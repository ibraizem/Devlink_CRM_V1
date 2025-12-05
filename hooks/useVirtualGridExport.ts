'use client'

import { useCallback } from 'react'
import { VirtualGridColumn } from '@/components/virtual'

export interface UseVirtualGridExportOptions<T> {
  data: T[]
  columns: VirtualGridColumn<T>[]
  filename?: string
}

export function useVirtualGridExport<T extends Record<string, any>>({
  data,
  columns,
  filename = 'export',
}: UseVirtualGridExportOptions<T>) {
  const getColumnValue = useCallback(
    (row: T, column: VirtualGridColumn<T>) => {
      if (typeof column.accessor === 'function') {
        return column.accessor(row)
      }
      return row[column.accessor]
    },
    []
  )

  const formatValue = useCallback(
    (value: any, column: VirtualGridColumn<T>): string => {
      if (value == null) return ''
      if (column.format) {
        return column.format(value)
      }
      return String(value)
    },
    []
  )

  const exportToCsv = useCallback(
    (selectedRows?: T[]) => {
      const dataToExport = selectedRows || data
      const visibleColumns = columns.filter((col) => col.visible !== false)

      const headers = visibleColumns.map((col) => col.label)
      const csvRows = [headers.join(',')]

      dataToExport.forEach((row) => {
        const values = visibleColumns.map((column) => {
          const value = getColumnValue(row, column)
          const formatted = formatValue(value, column)
          return `"${formatted.replace(/"/g, '""')}"`
        })
        csvRows.push(values.join(','))
      })

      const csvContent = csvRows.join('\n')
      const blob = new Blob(['\ufeff' + csvContent], {
        type: 'text/csv;charset=utf-8;',
      })

      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
      link.click()

      URL.revokeObjectURL(link.href)
    },
    [data, columns, filename, getColumnValue, formatValue]
  )

  const exportToJson = useCallback(
    (selectedRows?: T[]) => {
      const dataToExport = selectedRows || data
      const visibleColumns = columns.filter((col) => col.visible !== false)

      const jsonData = dataToExport.map((row) => {
        const obj: Record<string, any> = {}
        visibleColumns.forEach((column) => {
          obj[column.id] = getColumnValue(row, column)
        })
        return obj
      })

      const jsonContent = JSON.stringify(jsonData, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json' })

      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`
      link.click()

      URL.revokeObjectURL(link.href)
    },
    [data, columns, filename, getColumnValue]
  )

  const exportToExcel = useCallback(
    async (selectedRows?: T[]) => {
      const XLSX = await import('xlsx')
      const dataToExport = selectedRows || data
      const visibleColumns = columns.filter((col) => col.visible !== false)

      const worksheetData = [
        visibleColumns.map((col) => col.label),
        ...dataToExport.map((row) =>
          visibleColumns.map((column) => {
            const value = getColumnValue(row, column)
            return formatValue(value, column)
          })
        ),
      ]

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')

      XLSX.writeFile(
        workbook,
        `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`
      )
    },
    [data, columns, filename, getColumnValue, formatValue]
  )

  const copyToClipboard = useCallback(
    async (selectedRows?: T[]) => {
      const dataToExport = selectedRows || data
      const visibleColumns = columns.filter((col) => col.visible !== false)

      const headers = visibleColumns.map((col) => col.label).join('\t')
      const rows = dataToExport
        .map((row) =>
          visibleColumns
            .map((column) => {
              const value = getColumnValue(row, column)
              return formatValue(value, column)
            })
            .join('\t')
        )
        .join('\n')

      const textContent = `${headers}\n${rows}`

      try {
        await navigator.clipboard.writeText(textContent)
        return true
      } catch (error) {
        console.error('Erreur copie presse-papiers:', error)
        return false
      }
    },
    [data, columns, getColumnValue, formatValue]
  )

  return {
    exportToCsv,
    exportToJson,
    exportToExcel,
    copyToClipboard,
  }
}
