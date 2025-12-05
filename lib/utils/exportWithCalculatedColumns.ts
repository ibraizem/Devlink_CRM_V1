import { CalculatedColumn } from '@/lib/services/calculatedColumnService'

interface ExportLead {
  id: string
  [key: string]: any
}

interface ExportOptions {
  includeCalculatedColumns?: boolean
  calculatedColumns?: CalculatedColumn[]
  calculatedValues?: Record<string, Record<string, any>>
}

export function prepareLeadsForExport(
  leads: ExportLead[],
  options: ExportOptions = {}
): any[] {
  const {
    includeCalculatedColumns = true,
    calculatedColumns = [],
    calculatedValues = {}
  } = options

  if (!includeCalculatedColumns || calculatedColumns.length === 0) {
    return leads
  }

  return leads.map(lead => {
    const exportLead = { ...lead }

    for (const column of calculatedColumns) {
      if (column.is_active) {
        const value = calculatedValues[lead.id]?.[column.column_name]
        exportLead[column.column_name] = formatValueForExport(value, column.result_type)
      }
    }

    return exportLead
  })
}

function formatValueForExport(value: any, resultType: string): any {
  if (value === null || value === undefined) {
    return ''
  }

  if (resultType === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (resultType === 'number' && typeof value === 'number') {
    return value
  }

  return String(value)
}

export function getCalculatedColumnHeaders(columns: CalculatedColumn[]): string[] {
  return columns
    .filter(col => col.is_active)
    .map(col => col.column_name)
}

export async function exportLeadsWithCalculatedToCSV(
  leads: ExportLead[],
  calculatedColumns: CalculatedColumn[],
  calculatedValues: Record<string, Record<string, any>>,
  filename: string = 'leads_export.csv'
): Promise<void> {
  const preparedLeads = prepareLeadsForExport(leads, {
    includeCalculatedColumns: true,
    calculatedColumns,
    calculatedValues
  })

  if (preparedLeads.length === 0) {
    console.warn('No data to export')
    return
  }

  const headers = Object.keys(preparedLeads[0])
  const csvContent = [
    headers.join(','),
    ...preparedLeads.map(lead =>
      headers.map(header => {
        const value = lead[header]
        const stringValue = value === null || value === undefined ? '' : String(value)
        return stringValue.includes(',') || stringValue.includes('"')
          ? `"${stringValue.replace(/"/g, '""')}"`
          : stringValue
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export async function exportLeadsWithCalculatedToJSON(
  leads: ExportLead[],
  calculatedColumns: CalculatedColumn[],
  calculatedValues: Record<string, Record<string, any>>,
  filename: string = 'leads_export.json'
): Promise<void> {
  const preparedLeads = prepareLeadsForExport(leads, {
    includeCalculatedColumns: true,
    calculatedColumns,
    calculatedValues
  })

  const jsonContent = JSON.stringify(preparedLeads, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
