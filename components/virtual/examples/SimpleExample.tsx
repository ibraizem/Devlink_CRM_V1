'use client'

import { useState } from 'react'
import { VirtualGrid } from '@/components/virtual'
import { useVirtualGridColumns, createColumn } from '@/hooks/useVirtualGridColumns'

interface SimpleData {
  id: string
  name: string
  email: string
  phone: string
  age: number
}

export function SimpleExample() {
  const [data] = useState<SimpleData[]>(
    Array.from({ length: 10000 }, (_, i) => ({
      id: `${i}`,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      phone: `0612345${i.toString().padStart(3, '0')}`,
      age: 20 + (i % 50),
    }))
  )

  const columns = useVirtualGridColumns<SimpleData>([
    createColumn({
      id: 'name',
      label: 'Nom',
      accessor: 'name',
      type: 'text',
      editable: true,
      sortable: true,
      width: 200,
    }),
    createColumn({
      id: 'email',
      label: 'Email',
      accessor: 'email',
      type: 'email',
      editable: true,
      sortable: true,
      width: 250,
    }),
    createColumn({
      id: 'phone',
      label: 'Téléphone',
      accessor: 'phone',
      type: 'tel',
      editable: true,
      sortable: true,
      width: 180,
    }),
    createColumn({
      id: 'age',
      label: 'Âge',
      accessor: 'age',
      type: 'number',
      editable: true,
      sortable: true,
      width: 100,
    }),
  ])

  const handleCellUpdate = async (rowIndex: number, columnId: string, newValue: any) => {
    console.log('Cell updated:', { rowIndex, columnId, newValue })
  }

  return (
    <div className="h-[600px] border rounded-lg">
      <VirtualGrid
        data={data}
        columns={columns}
        rowHeight={52}
        overscan={10}
        onCellUpdate={handleCellUpdate}
        enableColumnReordering
        enableColumnResizing
        enableColumnManagement
      />
    </div>
  )
}
