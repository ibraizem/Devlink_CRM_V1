'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, MoreVertical, Edit, Trash2, RefreshCw, Sparkles, Calculator, Power, PowerOff } from 'lucide-react'
import FormulaEditor from './FormulaEditor'
import { CalculatedColumn } from '@/lib/services/calculatedColumnService'
import { toast } from 'sonner'

export default function CalculatedColumnManager() {
  const [columns, setColumns] = useState<CalculatedColumn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingColumn, setEditingColumn] = useState<CalculatedColumn | null>(null)

  useEffect(() => {
    loadColumns()
  }, [])

  const loadColumns = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/calculated-columns')
      if (response.ok) {
        const { data } = await response.json()
        setColumns(data || [])
      }
    } catch (error) {
      console.error('Failed to load columns:', error)
      toast.error('Failed to load calculated columns')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (data: any) => {
    try {
      const url = editingColumn
        ? `/api/calculated-columns/${editingColumn.id}`
        : '/api/calculated-columns'
      
      const method = editingColumn ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        toast.success(editingColumn ? 'Column updated' : 'Column created')
        setIsDialogOpen(false)
        setEditingColumn(null)
        loadColumns()
      } else {
        const { error } = await response.json()
        toast.error(error || 'Failed to save column')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save column')
    }
  }

  const handleDelete = async (columnId: string) => {
    if (!confirm('Are you sure you want to delete this column?')) return

    try {
      const response = await fetch(`/api/calculated-columns/${columnId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Column deleted')
        loadColumns()
      } else {
        toast.error('Failed to delete column')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete column')
    }
  }

  const handleToggleActive = async (column: CalculatedColumn) => {
    try {
      const response = await fetch(`/api/calculated-columns/${column.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !column.is_active })
      })

      if (response.ok) {
        toast.success(column.is_active ? 'Column disabled' : 'Column enabled')
        loadColumns()
      } else {
        toast.error('Failed to toggle column')
      }
    } catch (error) {
      console.error('Toggle error:', error)
      toast.error('Failed to toggle column')
    }
  }

  const handleClearCache = async (columnId: string) => {
    try {
      const response = await fetch(`/api/calculated-columns/${columnId}/cache`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Cache cleared')
      } else {
        toast.error('Failed to clear cache')
      }
    } catch (error) {
      console.error('Clear cache error:', error)
      toast.error('Failed to clear cache')
    }
  }

  const openCreateDialog = () => {
    setEditingColumn(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (column: CalculatedColumn) => {
    setEditingColumn(column)
    setIsDialogOpen(true)
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <div>
          <h2 className='text-2xl font-bold'>Calculated Columns</h2>
          <p className='text-sm text-muted-foreground'>
            Create formula-based columns with AI enrichment
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className='h-4 w-4 mr-2' />
              New Column
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>
                {editingColumn ? 'Edit Calculated Column' : 'Create Calculated Column'}
              </DialogTitle>
              <DialogDescription>
                Use formulas and AI functions to create dynamic columns
              </DialogDescription>
            </DialogHeader>
            <FormulaEditor
              initialFormula={editingColumn?.formula}
              initialColumnName={editingColumn?.column_name}
              initialFormulaType={editingColumn?.formula_type}
              initialResultType={editingColumn?.result_type}
              onSave={handleSave}
              onCancel={() => {
                setIsDialogOpen(false)
                setEditingColumn(null)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className='text-center py-8 text-muted-foreground'>Loading...</div>
      ) : columns.length === 0 ? (
        <div className='text-center py-12 border-2 border-dashed rounded-lg'>
          <Calculator className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
          <h3 className='text-lg font-semibold mb-2'>No calculated columns yet</h3>
          <p className='text-sm text-muted-foreground mb-4'>
            Create your first calculated column to enhance your lead data
          </p>
          <Button onClick={openCreateDialog}>
            <Plus className='h-4 w-4 mr-2' />
            Create Column
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Column Name</TableHead>
              <TableHead>Formula</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Result Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cache</TableHead>
              <TableHead className='w-[50px]'></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {columns.map((column) => (
              <TableRow key={column.id}>
                <TableCell className='font-medium'>{column.column_name}</TableCell>
                <TableCell className='font-mono text-xs max-w-md truncate'>
                  {column.formula}
                </TableCell>
                <TableCell>
                  <Badge variant='outline' className='flex items-center gap-1 w-fit'>
                    {column.formula_type === 'ai_enrichment' ? (
                      <><Sparkles className='h-3 w-3' /> AI</>
                    ) : (
                      <><Calculator className='h-3 w-3' /> Calc</>
                    )}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant='secondary'>{column.result_type}</Badge>
                </TableCell>
                <TableCell>
                  {column.is_active ? (
                    <Badge variant='default' className='flex items-center gap-1 w-fit'>
                      <Power className='h-3 w-3' /> Active
                    </Badge>
                  ) : (
                    <Badge variant='secondary' className='flex items-center gap-1 w-fit'>
                      <PowerOff className='h-3 w-3' /> Inactive
                    </Badge>
                  )}
                </TableCell>
                <TableCell className='text-sm text-muted-foreground'>
                  {column.cache_duration ? `${column.cache_duration}s` : 'No cache'}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='sm'>
                        <MoreVertical className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem onClick={() => openEditDialog(column)}>
                        <Edit className='h-4 w-4 mr-2' />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(column)}>
                        {column.is_active ? (
                          <><PowerOff className='h-4 w-4 mr-2' /> Disable</>
                        ) : (
                          <><Power className='h-4 w-4 mr-2' /> Enable</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleClearCache(column.id)}>
                        <RefreshCw className='h-4 w-4 mr-2' />
                        Clear Cache
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(column.id)}
                        className='text-red-600'
                      >
                        <Trash2 className='h-4 w-4 mr-2' />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
