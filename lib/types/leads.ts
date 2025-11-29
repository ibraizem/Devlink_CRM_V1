import { createClient } from '@/lib/utils/supabase/client';

export type Lead = { [key: string]: any };

export type LeadFilters = {
  statut?: string;
  agent_id?: string;
  search?: string;
};

export type ActivityType = 'note' | 'statut_change' | 'lead_assigne' | 'appel' | 'email' | 'whatsapp' | 'sms' | 'rendezvous';

export type Activity = {
  id: string;
  lead_id: string;
  agent_id: string;
  type_action: ActivityType;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
  users_profile?: {
    nom: string;
    prenom: string;
    email?: string;
  };
};

export type Note = {
  id: string;
  lead_id: string;
  auteur_id: string;
  contenu: string;
  created_at: string;
  updated_at: string;
  users_profile?: {
    nom: string;
    prenom: string;
  };
};

export type Attachment = {
  id: string;
  lead_id: string;
  fichier_nom: string;
  fichier_url: string;
  fichier_type: string;
  fichier_taille: number;
  uploaded_by: string;
  created_at: string;
  users_profile?: {
    nom: string;
    prenom: string;
  };
};

export async function getLeads(filters?: LeadFilters) {
  const supabase = createClient();
  let query = supabase.from('leads').select('*, users_profile:agent_id(nom, prenom)');
  if (filters?.statut) {
    query = query.eq('statut', filters.statut);
  }
  if (filters?.agent_id) {
    query = query.eq('agent_id', filters.agent_id);
  }
  if (filters?.search) {
    query = query.or(`nom.ilike.%${filters.search}%,prenom.ilike.%${filters.search}%,telephone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }
  const { data, error } = await query.order('created_at', { ascending: false });
  return { data, error };
}

export async function getLeadById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('leads')
    .select('*, users_profile:agent_id(nom, prenom, email)')
    .eq('id', id)
    .maybeSingle();
  return { data, error };
}

export async function createLead(lead: Partial<Lead>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('leads')
    .insert(lead)
    .select()
    .single();
  if (data && !error) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('historique_actions').insert({
      lead_id: data.id,
      agent_id: user?.id,
      type_action: 'lead_assigne',
      description: 'Lead créé',
      metadata: { lead_data: lead },
    });
  }
  return { data, error };
}

export async function updateLead(id: string, updates: Partial<Lead>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (data && !error && updates.statut) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('historique_actions').insert({
      lead_id: data.id,
      agent_id: user?.id,
      type_action: 'statut_change',
      description: `Statut changé en ${updates.statut}`,
      metadata: { old_statut: data.statut, new_statut: updates.statut },
    });
  }
  return { data, error };
}

export async function deleteLead(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id);
  return { error };
}

export async function getLeadNotes(leadId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('notes')
    .select('*, users_profile:auteur_id(nom, prenom)')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function createNote(leadId: string, contenu: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('notes')
    .insert({
      lead_id: leadId,
      auteur_id: user?.id,
      contenu,
    })
    .select()
    .single();
  if (data && !error) {
    await supabase.from('historique_actions').insert({
      lead_id: leadId,
      agent_id: user?.id,
      type_action: 'note',
      description: 'Note ajoutée',
      metadata: { note_id: data.id },
    });
  }
  return { data, error };
}

export async function getLeadHistory(leadId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('historique_actions')
    .select('*, users_profile:agent_id(nom, prenom)')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function getLeadRendezvous(leadId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('rendezvous')
    .select('*, users_profile:agent_id(nom, prenom)')
    .eq('lead_id', leadId)
    .order('date_heure', { ascending: false });
  return { data, error };
}

export async function assignLeadToAgent(leadId: string, agentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('leads')
    .update({ agent_id: agentId })
    .eq('id', leadId)
    .select()
    .single();
  if (data && !error) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('historique_actions').insert({
      lead_id: leadId,
      agent_id: user?.id, // L'agent qui fait l'assignation
      type_action: 'lead_assigne',
      description: `Lead assigné à l'agent ${agentId}`,
      metadata: { new_agent_id: agentId },
    });
  }
  return { data, error };
}

export async function getAgents() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('users_profile')
    .select('id, nom, prenom')
    .eq('actif', true)
    .in('role', ['telepro', 'manager', 'admin'])
    .order('nom', { ascending: true });
  return { data, error };
}

export async function getLeadStatistics() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_lead_statistics');
  return { data, error };
}

export async function getLeadsByAgent(agentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('leads')
    .select('*, users_profile:agent_id(nom, prenom)')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function getRecentLeads(limit: number = 5) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('leads')
    .select('*, users_profile:agent_id(nom, prenom)')
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data, error };
}

export async function getLeadsByStatus(statut: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('leads')
    .select('*, users_profile:agent_id(nom, prenom)')
    .eq('statut', statut)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function getLeadsCountByStatus() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('leads')
    .select('statut, count:id')
    .eq('deleted', false) // Optional: filter out deleted leads if you have a soft delete
    .order('statut', { ascending: true });
  return { data, error };
}

export async function getLeadsCreatedBetween(startDate: string, endDate: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('leads')
    .select('*, users_profile:agent_id(nom, prenom)')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function getLeadsWithUpcomingRendezvous() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('leads')
    .select('*, rendezvous!inner(*)')
    .gte('rendezvous.date_heure', new Date().toISOString())
    .order('rendezvous.date_heure', { ascending: true });
  return { data, error };
}

export async function getLeadsByCanal(canal: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('leads')
    .select('*, users_profile:agent_id(nom, prenom)')
    .eq('canal', canal)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function getLeadsBySource(source: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('leads')
    .select('*, users_profile:agent_id(nom, prenom)')
    .eq('source', source)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function updateNote(noteId: string, contenu: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('notes')
    .update({ contenu, updated_at: new Date().toISOString() })
    .eq('id', noteId)
    .select()
    .single();
  return { data, error };
}

export async function deleteNote(noteId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId);
  return { error };
}

export async function getLeadAttachments(leadId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('lead_attachments')
    .select('*, users_profile:uploaded_by(nom, prenom)')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function uploadAttachment(leadId: string, file: File) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${leadId}/${Date.now()}.${fileExt}`;
  
  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('lead-attachments')
    .upload(fileName, file);

  if (uploadError) return { data: null, error: uploadError };

  const { data: urlData } = supabase
    .storage
    .from('lead-attachments')
    .getPublicUrl(fileName);

  const { data, error } = await supabase
    .from('lead_attachments')
    .insert({
      lead_id: leadId,
      fichier_nom: file.name,
      fichier_url: urlData.publicUrl,
      fichier_type: file.type,
      fichier_taille: file.size,
      uploaded_by: user?.id,
    })
    .select('*, users_profile:uploaded_by(nom, prenom)')
    .single();

  if (data && !error) {
    await supabase.from('historique_actions').insert({
      lead_id: leadId,
      agent_id: user?.id,
      type_action: 'note',
      description: `Fichier ajouté: ${file.name}`,
      metadata: { attachment_id: data.id },
    });
  }

  return { data, error };
}

export async function deleteAttachment(attachmentId: string, leadId: string) {
  const supabase = createClient();
  
  const { data: attachment } = await supabase
    .from('lead_attachments')
    .select('fichier_url')
    .eq('id', attachmentId)
    .single();

  if (attachment) {
    const fileName = attachment.fichier_url.split('/').pop();
    await supabase.storage.from('lead-attachments').remove([`${leadId}/${fileName}`]);
  }

  const { error } = await supabase
    .from('lead_attachments')
    .delete()
    .eq('id', attachmentId);
  
  return { error };
}

export async function logCommunication(
  leadId: string,
  type: 'appel' | 'email' | 'whatsapp' | 'sms',
  description: string,
  metadata?: Record<string, any>
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('historique_actions')
    .insert({
      lead_id: leadId,
      agent_id: user?.id,
      type_action: type,
      description,
      metadata,
    })
    .select('*, users_profile:agent_id(nom, prenom)')
    .single();
  
  return { data, error };
}

export async function getStatusHistory(leadId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('historique_actions')
    .select('*, users_profile:agent_id(nom, prenom)')
    .eq('lead_id', leadId)
    .eq('type_action', 'statut_change')
    .order('created_at', { ascending: false });
  return { data, error };
}
