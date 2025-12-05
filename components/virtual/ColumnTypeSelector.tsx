'use client'

import { useState } from 'react'
import { ColumnType } from '@/types/virtual-grid'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Type,
  Hash,
  Mail,
  Phone,
  Link,
  Calendar,
  ToggleLeft,
  DollarSign,
} from 'lucide-react'

interface ColumnTypeSelectorProps {
  value: ColumnType
  onChange: (type: ColumnType) => void
  disabled?: boolean
}

const columnTypeInfo: Record<ColumnType, { label: string; icon: React.ReactNode; description: string }> = {
  text: {
    label: 'Texte',
    icon: <Type className="h-4 w-4" />,
    description: 'Texte simple',
  },
  number: {
    label: 'Nombre',
    icon: <Hash className="h-4 w-4" />,
    description: 'Nombre avec formatage',
  },
  email: {
    label: 'Email',
    icon: <Mail className="h-4 w-4" />,
    description: 'Adresse email avec validation',
  },
  tel: {
    label: 'Téléphone',
    icon: <Phone className="h-4 w-4" />,
    description: 'Numéro de téléphone français',
  },
  url: {
    label: 'URL',
    icon: <Link className="h-4 w-4" />,
    description: 'Lien web avec validation',
  },
  date: {
    label: 'Date',
    icon: <Calendar className="h-4 w-4" />,
    description: 'Date avec formatage français',
  },
  boolean: {
    label: 'Booléen',
    icon: <ToggleLeft className="h-4 w-4" />,
    description: 'Oui/Non',
  },
  currency: {
    label: 'Montant',
    icon: <DollarSign className="h-4 w-4" />,
    description: 'Montant en euros',
  },
}

export function ColumnTypeSelector({
  value,
  onChange,
  disabled = false,
}: ColumnTypeSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ColumnType)} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue>
          <div className="flex items-center gap-2">
            {columnTypeInfo[value].icon}
            <span>{columnTypeInfo[value].label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(columnTypeInfo).map(([type, info]) => (
          <SelectItem key={type} value={type}>
            <div className="flex items-center gap-2">
              {info.icon}
              <div className="flex flex-col">
                <span className="font-medium">{info.label}</span>
                <span className="text-xs text-muted-foreground">{info.description}</span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
