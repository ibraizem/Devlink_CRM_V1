'use client'

import { useMemo, useCallback } from 'react'
import { VirtualGridColumn } from '@/components/virtual'
import { z } from 'zod'

export interface ColumnPreset<T = any> {
  id: string
  label: string
  accessor: keyof T | ((row: T) => any)
  type?: 'text' | 'number' | 'email' | 'tel' | 'url' | 'date' | 'boolean' | 'currency'
  editable?: boolean
  sortable?: boolean
  width?: number
}

export function useVirtualGridColumns<T>(presets: ColumnPreset<T>[]): VirtualGridColumn<T>[] {
  return useMemo(() => {
    return presets.map((preset) => {
      const column: VirtualGridColumn<T> = {
        id: preset.id,
        label: preset.label,
        accessor: preset.accessor,
        width: preset.width || 150,
        resizable: true,
        sortable: preset.sortable ?? true,
        editable: preset.editable ?? false,
        visible: true,
      }

      switch (preset.type) {
        case 'number':
          column.type = 'number'
          column.format = (value) => {
            if (value == null || value === '') return ''
            return Number(value).toLocaleString('fr-FR')
          }
          column.parse = (value) => {
            const num = parseFloat(value.replace(/\s/g, '').replace(',', '.'))
            return isNaN(num) ? 0 : num
          }
          column.validationSchema = z.number({ 
            invalid_type_error: 'Doit être un nombre' 
          })
          column.cellClassName = 'text-right font-mono'
          break

        case 'email':
          column.type = 'email'
          column.validationSchema = z.string().email('Email invalide')
          break

        case 'tel':
          column.type = 'tel'
          column.format = (value) => {
            if (!value) return ''
            const cleaned = String(value).replace(/\D/g, '')
            if (cleaned.length === 10) {
              return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
            }
            return value
          }
          column.parse = (value) => value.replace(/\D/g, '')
          column.validationSchema = z.string().regex(
            /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
            'Numéro de téléphone invalide'
          )
          break

        case 'url':
          column.type = 'url'
          column.validationSchema = z.string().url('URL invalide')
          column.format = (value) => {
            if (!value) return ''
            try {
              const url = new URL(value)
              return url.hostname + url.pathname
            } catch {
              return value
            }
          }
          break

        case 'date':
          column.format = (value) => {
            if (!value) return ''
            try {
              const date = new Date(value)
              return date.toLocaleDateString('fr-FR')
            } catch {
              return value
            }
          }
          column.parse = (value) => {
            const date = new Date(value)
            return isNaN(date.getTime()) ? null : date.toISOString()
          }
          column.validationSchema = z.string().refine(
            (val) => !isNaN(new Date(val).getTime()),
            'Date invalide'
          )
          break

        case 'boolean':
          column.format = (value) => (value ? 'Oui' : 'Non')
          column.parse = (value) => {
            const lower = value.toLowerCase().trim()
            return lower === 'oui' || lower === 'true' || lower === '1' || lower === 'yes'
          }
          column.validationSchema = z.boolean()
          break

        case 'currency':
          column.type = 'number'
          column.format = (value) => {
            if (value == null || value === '') return ''
            return new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
            }).format(Number(value))
          }
          column.parse = (value) => {
            const num = parseFloat(
              value.replace(/[^\d,-]/g, '').replace(',', '.')
            )
            return isNaN(num) ? 0 : num
          }
          column.validationSchema = z.number({ 
            invalid_type_error: 'Doit être un montant valide' 
          })
          column.cellClassName = 'text-right font-mono'
          break

        default:
          column.type = 'text'
          if (preset.editable) {
            column.validationSchema = z.string()
          }
      }

      return column
    })
  }, [presets])
}

export function createColumn<T>(preset: ColumnPreset<T>): ColumnPreset<T> {
  return preset
}
