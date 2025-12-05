'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { z, ZodSchema } from 'zod'
import { Input } from '@/components/ui/input'
import { Check, X, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface EditableCellProps<T = any> {
  value: T
  onChange: (value: T) => Promise<void> | void
  validationSchema?: ZodSchema<T>
  className?: string
  format?: (value: T) => string
  parse?: (value: string) => T
  type?: 'text' | 'number' | 'email' | 'tel' | 'url'
  placeholder?: string
  disabled?: boolean
  onEditStart?: () => void
  onEditEnd?: () => void
}

export function EditableCell<T = any>({
  value,
  onChange,
  validationSchema,
  className,
  format = (v) => String(v ?? ''),
  parse = (v) => v as T,
  type = 'text',
  placeholder,
  disabled = false,
  onEditStart,
  onEditEnd,
}: EditableCellProps<T>) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(format(value))
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleStartEdit = () => {
    if (disabled) return
    setIsEditing(true)
    setEditValue(format(value))
    setError(null)
    onEditStart?.()
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditValue(format(value))
    setError(null)
    onEditEnd?.()
  }

  const validateValue = (rawValue: string): { isValid: boolean; error?: string; parsedValue?: T } => {
    try {
      const parsedValue = parse(rawValue)
      
      if (validationSchema) {
        const result = validationSchema.safeParse(parsedValue)
        if (!result.success) {
          return {
            isValid: false,
            error: result.error.errors[0]?.message || 'Valeur invalide'
          }
        }
      }
      
      return { isValid: true, parsedValue }
    } catch (err) {
      return {
        isValid: false,
        error: err instanceof Error ? err.message : 'Format invalide'
      }
    }
  }

  const handleSave = async () => {
    const validation = validateValue(editValue)
    
    if (!validation.isValid) {
      setError(validation.error || 'Valeur invalide')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await onChange(validation.parsedValue!)
      setIsEditing(false)
      onEditEnd?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEdit()
    }
  }

  const handleBlur = () => {
    if (!error) {
      handleSave()
    }
  }

  if (isEditing) {
    return (
      <div className="relative flex items-center gap-1">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type={type}
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value)
              setError(null)
            }}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={isSaving}
            className={cn(
              'h-8 text-sm',
              error && 'border-destructive focus-visible:ring-destructive',
              className
            )}
          />
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-0 top-full mt-1 z-50 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded shadow-lg flex items-center gap-1"
              >
                <AlertCircle className="h-3 w-3" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !!error}
            className={cn(
              'p-1 rounded hover:bg-accent transition-colors',
              (isSaving || error) && 'opacity-50 cursor-not-allowed'
            )}
            aria-label="Sauvegarder"
          >
            <Check className="h-4 w-4 text-green-600" />
          </button>
          <button
            type="button"
            onClick={handleCancelEdit}
            disabled={isSaving}
            className={cn(
              'p-1 rounded hover:bg-accent transition-colors',
              isSaving && 'opacity-50 cursor-not-allowed'
            )}
            aria-label="Annuler"
          >
            <X className="h-4 w-4 text-destructive" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={handleStartEdit}
      className={cn(
        'px-2 py-1 rounded cursor-pointer hover:bg-accent/50 transition-colors',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleStartEdit()
        }
      }}
    >
      {format(value) || <span className="text-muted-foreground italic">Vide</span>}
    </div>
  )
}
