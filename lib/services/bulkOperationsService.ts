import { createClient } from '@/lib/utils/supabase/client'
import { LeadStatus } from './leadService'
import * as XLSX from 'xlsx'

const supabase = createClient()

export interface BulkOperationProgress {
  total: number
  processed: number
  successful: number
  failed: number
  errors: Array<{ id: string; error: string }>
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

export interface BulkEmailPayload {
  leadIds: string[]
  subject: string
  body: string
  fromEmail: string
  templateId?: string
}

export interface BulkCallPayload {
  leadIds: string[]
  callerId: string
  scriptId?: string
  scheduledTime?: string
}

export interface BulkStatusUpdatePayload {
  leadIds: string[]
  status: LeadStatus
  notes?: string
}

export interface BulkAssignmentPayload {
  leadIds: string[]
  agentId: string
  notes?: string
}

export interface BulkExportOptions {
  leadIds: string[]
  format: 'csv' | 'xlsx' | 'json'
  columns?: string[]
  includeMetadata?: boolean
}

export type BulkOperationResult<T = any> = {
  success: boolean
  progress: BulkOperationProgress
  data?: T
  message: string
}

class BulkOperationTracker {
  private progress: BulkOperationProgress
  private callbacks: Array<(progress: BulkOperationProgress) => void> = []

  constructor(total: number) {
    this.progress = { total, processed: 0, successful: 0, failed: 0, errors: [], status: 'pending' }
  }

  start() {
    this.progress.status = 'processing'
    this.notify()
  }

  success(id: string) {
    this.progress.processed++
    this.progress.successful++
    if (this.progress.processed >= this.progress.total) this.progress.status = 'completed'
    this.notify()
  }

  fail(id: string, error: string) {
    this.progress.processed++
    this.progress.failed++
    this.progress.errors.push({ id, error })
    if (this.progress.processed >= this.progress.total) this.progress.status = 'completed'
    this.notify()
  }

  getProgress(): BulkOperationProgress {
    return { ...this.progress }
  }

  onProgress(callback: (progress: BulkOperationProgress) => void) {
    this.callbacks.push(callback)
  }

  private notify() {
    this.callbacks.forEach(cb => cb(this.getProgress()))
  }
}

const exportToFormat = (leads: any[], format: 'csv' | 'xlsx' | 'json', columns?: string[]): Blob => {
  const headers = columns || Object.keys(leads[0]?.donnees || {})
  const rows = leads.map(lead => {
    const row: Record<string, any> = {}
    headers.forEach(col => {
      row[col] = lead[col] || lead.donnees?.[col] || ''
    })
    return row
  })

  if (format === 'csv') {
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${String(r[h] || '').replace(/"/g, '""')}"`).join(','))].join('\n')
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  } else if (format === 'xlsx') {
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Leads')
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  } else {
    return new Blob([JSON.stringify(leads, null, 2)], { type: 'application/json' })
  }
}

export const bulkOperationsService = {
  async bulkSendEmail(payload: BulkEmailPayload, onProgress?: (progress: BulkOperationProgress) => void): Promise<BulkOperationResult> {
    const tracker = new BulkOperationTracker(payload.leadIds.length)
    if (onProgress) tracker.onProgress(onProgress)
    tracker.start()
    const results = []

    for (const leadId of payload.leadIds) {
      try {
        const { data: lead, error: leadError } = await supabase.from('fichier_donnees').select('donnees').eq('id', leadId).single()
        if (leadError) throw leadError
        if (!lead?.donnees?.email) throw new Error('Email address not found')

        const { error: insertError } = await supabase.from('email_logs').insert({
          lead_id: leadId,
          recipient_email: lead.donnees.email,
          subject: payload.subject,
          body: payload.body,
          from_email: payload.fromEmail,
          template_id: payload.templateId,
          status: 'pending',
          sent_at: null,
          created_at: new Date().toISOString()
        })

        if (insertError) throw insertError
        await supabase.from('fichier_donnees').update({ notes: `Email envoyé: ${payload.subject}`, updated_at: new Date().toISOString() }).eq('id', leadId)
        tracker.success(leadId)
        results.push({ leadId, status: 'success' })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        tracker.fail(leadId, errorMsg)
        results.push({ leadId, status: 'failed', error: errorMsg })
      }
    }

    return { success: tracker.getProgress().failed === 0, progress: tracker.getProgress(), data: results, message: `Envoi terminé: ${tracker.getProgress().successful}/${tracker.getProgress().total} réussis` }
  },

  async bulkInitiateCall(payload: BulkCallPayload, onProgress?: (progress: BulkOperationProgress) => void): Promise<BulkOperationResult> {
    const tracker = new BulkOperationTracker(payload.leadIds.length)
    if (onProgress) tracker.onProgress(onProgress)
    tracker.start()
    const results = []

    for (const leadId of payload.leadIds) {
      try {
        const { data: lead, error: leadError } = await supabase.from('fichier_donnees').select('donnees').eq('id', leadId).single()
        if (leadError) throw leadError
        if (!lead?.donnees?.telephone && !lead?.donnees?.phone) throw new Error('Phone number not found')

        const phoneNumber = lead.donnees.telephone || lead.donnees.phone
        const { error: insertError } = await supabase.from('call_logs').insert({
          lead_id: leadId,
          phone_number: phoneNumber,
          caller_id: payload.callerId,
          script_id: payload.scriptId,
          scheduled_time: payload.scheduledTime || new Date().toISOString(),
          status: 'scheduled',
          duration: null,
          recording_url: null,
          notes: null,
          created_at: new Date().toISOString()
        })

        if (insertError) throw insertError
        await supabase.from('fichier_donnees').update({ notes: `Appel planifié`, updated_at: new Date().toISOString() }).eq('id', leadId)
        tracker.success(leadId)
        results.push({ leadId, status: 'success', phoneNumber })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        tracker.fail(leadId, errorMsg)
        results.push({ leadId, status: 'failed', error: errorMsg })
      }
    }

    return { success: tracker.getProgress().failed === 0, progress: tracker.getProgress(), data: results, message: `Appels planifiés: ${tracker.getProgress().successful}/${tracker.getProgress().total} réussis` }
  },

  async bulkUpdateStatus(payload: BulkStatusUpdatePayload, onProgress?: (progress: BulkOperationProgress) => void): Promise<BulkOperationResult> {
    const tracker = new BulkOperationTracker(payload.leadIds.length)
    if (onProgress) tracker.onProgress(onProgress)
    tracker.start()
    const BATCH_SIZE = 50
    const results = []

    for (let i = 0; i < payload.leadIds.length; i += BATCH_SIZE) {
      const batch = payload.leadIds.slice(i, i + BATCH_SIZE)
      try {
        const updateData: any = { statut: payload.status, updated_at: new Date().toISOString() }
        if (payload.notes) {
          const { data: existingLeads } = await supabase.from('fichier_donnees').select('id, notes').in('id', batch)
          for (const lead of existingLeads || []) {
            const updatedNotes = lead.notes ? `${lead.notes}\n${new Date().toISOString()}: ${payload.notes}` : `${new Date().toISOString()}: ${payload.notes}`
            await supabase.from('fichier_donnees').update({ ...updateData, notes: updatedNotes }).eq('id', lead.id)
            tracker.success(lead.id)
            results.push({ leadId: lead.id, status: 'success' })
          }
        } else {
          const { error: updateError } = await supabase.from('fichier_donnees').update(updateData).in('id', batch)
          if (updateError) throw updateError
          batch.forEach(id => { tracker.success(id); results.push({ leadId: id, status: 'success' }) })
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        batch.forEach(id => { tracker.fail(id, errorMsg); results.push({ leadId: id, status: 'failed', error: errorMsg }) })
      }
    }

    return { success: tracker.getProgress().failed === 0, progress: tracker.getProgress(), data: results, message: `Mise à jour terminée: ${tracker.getProgress().successful}/${tracker.getProgress().total} réussis` }
  },

  async bulkAssignToAgent(payload: BulkAssignmentPayload, onProgress?: (progress: BulkOperationProgress) => void): Promise<BulkOperationResult> {
    const tracker = new BulkOperationTracker(payload.leadIds.length)
    if (onProgress) tracker.onProgress(onProgress)
    tracker.start()

    const { data: agent, error: agentError } = await supabase.from('users_profile').select('id, nom, prenom').eq('id', payload.agentId).single()
    if (agentError || !agent) return { success: false, progress: tracker.getProgress(), message: 'Agent non trouvé' }

    const results = []
    for (const leadId of payload.leadIds) {
      try {
        const { data: lead } = await supabase.from('fichier_donnees').select('donnees, notes').eq('id', leadId).single()
        if (!lead) throw new Error('Lead not found')

        const updatedDonnees = { ...lead.donnees, agent_id: payload.agentId, agent_nom: `${agent.prenom} ${agent.nom}` }
        const assignmentNote = `Assigné à ${agent.prenom} ${agent.nom}${payload.notes ? ': ' + payload.notes : ''}`
        const updatedNotes = lead.notes ? `${lead.notes}\n${new Date().toISOString()}: ${assignmentNote}` : `${new Date().toISOString()}: ${assignmentNote}`
        const { error: updateError } = await supabase.from('fichier_donnees').update({ donnees: updatedDonnees, notes: updatedNotes, updated_at: new Date().toISOString() }).eq('id', leadId)
        if (updateError) throw updateError

        tracker.success(leadId)
        results.push({ leadId, status: 'success', agentId: payload.agentId })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        tracker.fail(leadId, errorMsg)
        results.push({ leadId, status: 'failed', error: errorMsg })
      }
    }

    return { success: tracker.getProgress().failed === 0, progress: tracker.getProgress(), data: results, message: `Attribution terminée: ${tracker.getProgress().successful}/${tracker.getProgress().total} réussis` }
  },

  async bulkExport(options: BulkExportOptions, onProgress?: (progress: BulkOperationProgress) => void): Promise<BulkOperationResult<Blob>> {
    const tracker = new BulkOperationTracker(options.leadIds.length)
    if (onProgress) tracker.onProgress(onProgress)
    tracker.start()

    try {
      const BATCH_SIZE = 100
      const allLeads = []
      for (let i = 0; i < options.leadIds.length; i += BATCH_SIZE) {
        const batch = options.leadIds.slice(i, i + BATCH_SIZE)
        const { data: leads, error } = await supabase.from('fichier_donnees').select('*').in('id', batch)
        if (error) throw error
        allLeads.push(...(leads || []))
        batch.forEach(id => tracker.success(id))
      }

      const exportData = exportToFormat(allLeads, options.format, options.columns)
      return { success: true, progress: tracker.getProgress(), data: exportData, message: `Export terminé: ${allLeads.length} leads exportés` }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, progress: tracker.getProgress(), message: `Erreur d'export: ${errorMsg}` }
    }
  }
}
