'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Download, FileText, FileSpreadsheet, FileJson } from 'lucide-react'
import { Lead, ColumnDefinition } from '@/types/leads'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

type ExportFormat = 'csv' | 'excel' | 'json'

interface ExportDialogProps<T extends Lead> {
  data: T[]
  selectedIds: string[]
  columns: ColumnDefinition<T>[]
  trigger?: React.ReactNode
}

export function ExportDialog<T extends Lead>({
  data,
  selectedIds,
  columns,
  trigger
}: ExportDialogProps<T>) {
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    columns.map(c => String(c.key))
  )
  const [includeHeaders, setIncludeHeaders] = useState(true)
  const [exportAll, setExportAll] = useState(false)

  const exportData = useMemo(() => {
    return exportAll 
      ? data 
      : data.filter(item => selectedIds.includes(item.id))
  }, [data, selectedIds, exportAll])

  const handleToggleColumn = (columnKey: string) => {
    setSelectedColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(k => k !== columnKey)
        : [...prev, columnKey]
    )
  }

  const handleSelectAll = () => {
    setSelectedColumns(columns.map(c => String(c.key)))
  }

  const handleDeselectAll = () => {
    setSelectedColumns([])
  }

  const exportToCsv = () => {
    const headers = selectedColumns.map(key => 
      columns.find(c => String(c.key) === key)?.label || key
    )
    
    const rows = exportData.map(item => 
      selectedColumns.map(key => {
        const value = item[key as keyof T]
        if (value === null || value === undefined) return ''
        if (typeof value === 'object') return JSON.stringify(value)
        return String(value)
      })
    )

    const csvContent = [
      includeHeaders ? headers.join(',') : null,
      ...rows.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
    ].filter(Boolean).join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    downloadFile(blob, `export_leads_${Date.now()}.csv`)
  }

  const exportToExcel = () => {
    const headers = selectedColumns.map(key => 
      columns.find(c => String(c.key) === key)?.label || key
    )
    
    const rows = exportData.map(item => 
      selectedColumns.reduce((acc, key) => {
        const value = item[key as keyof T]
        acc[columns.find(c => String(c.key) === key)?.label || key] = 
          value === null || value === undefined ? '' :
          typeof value === 'object' ? JSON.stringify(value) :
          value
        return acc
      }, {} as Record<string, any>)
    )

    const ws = XLSX.utils.json_to_sheet(rows, { 
      header: includeHeaders ? headers : undefined 
    })
    
    const colWidths = headers.map(() => ({ wch: 20 }))
    ws['!cols'] = colWidths

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Leads')
    
    XLSX.writeFile(wb, `export_leads_${Date.now()}.xlsx`)
  }

  const exportToJson = () => {
    const rows = exportData.map(item => 
      selectedColumns.reduce((acc, key) => {
        acc[key] = item[key as keyof T]
        return acc
      }, {} as Record<string, any>)
    )

    const jsonContent = JSON.stringify(rows, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    downloadFile(blob, `export_leads_${Date.now()}.json`)
  }

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const handleExport = () => {
    if (selectedColumns.length === 0) {
      toast.error('Veuillez sélectionner au moins une colonne')
      return
    }

    if (exportData.length === 0) {
      toast.error('Aucune donnée à exporter')
      return
    }

    try {
      switch (format) {
        case 'csv':
          exportToCsv()
          break
        case 'excel':
          exportToExcel()
          break
        case 'json':
          exportToJson()
          break
      }
      
      toast.success(`${exportData.length} lead${exportData.length > 1 ? 's' : ''} exporté${exportData.length > 1 ? 's' : ''} avec succès`)
      setOpen(false)
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
      toast.error('Erreur lors de l\'export des données')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Exporter les leads</DialogTitle>
          <DialogDescription>
            Choisissez le format et les colonnes à exporter
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Données à exporter</Label>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">
                  {exportAll ? 'Tous les leads' : 'Leads sélectionnés'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {exportAll ? `${data.length} lead${data.length > 1 ? 's' : ''}` : `${selectedIds.length} lead${selectedIds.length > 1 ? 's' : ''} sélectionné${selectedIds.length > 1 ? 's' : ''}`}
                </div>
              </div>
              <Switch
                checked={exportAll}
                onCheckedChange={setExportAll}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Format d'export</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer flex-1">
                  <FileText className="h-4 w-4" />
                  <div>
                    <div className="font-medium">CSV</div>
                    <div className="text-xs text-muted-foreground">
                      Format compatible avec Excel et tableurs
                    </div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="flex items-center gap-2 cursor-pointer flex-1">
                  <FileSpreadsheet className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Excel</div>
                    <div className="text-xs text-muted-foreground">
                      Fichier .xlsx avec mise en forme
                    </div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer flex-1">
                  <FileJson className="h-4 w-4" />
                  <div>
                    <div className="font-medium">JSON</div>
                    <div className="text-xs text-muted-foreground">
                      Format structuré pour intégrations
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Colonnes à exporter</Label>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-7 text-xs"
                >
                  Tout sélectionner
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeselectAll}
                  className="h-7 text-xs"
                >
                  Tout désélectionner
                </Button>
              </div>
            </div>
            
            <ScrollArea className="h-[200px] rounded-md border p-3">
              <div className="space-y-2">
                {columns.map((col) => {
                  const key = String(col.key)
                  const isChecked = selectedColumns.includes(key)
                  
                  return (
                    <div
                      key={key}
                      className="flex items-center space-x-2 py-1 px-2 rounded hover:bg-muted cursor-pointer"
                      onClick={() => handleToggleColumn(key)}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => handleToggleColumn(key)}
                      />
                      <Label className="cursor-pointer flex-1">
                        {col.label}
                      </Label>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          {(format === 'csv' || format === 'excel') && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="headers"
                checked={includeHeaders}
                onCheckedChange={(checked) => setIncludeHeaders(!!checked)}
              />
              <Label htmlFor="headers" className="cursor-pointer">
                Inclure les en-têtes de colonnes
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleExport} disabled={selectedColumns.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Exporter ({exportData.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
