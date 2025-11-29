'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

type Step2Props = {
  data: {
    organizationName: string
  }
  onNext: (data: { organizationName: string }) => void
  onBack: () => void
}

export function Step2({ data, onNext, onBack }: Step2Props) {
  const [organizationName, setOrganizationName] = useState(data.organizationName || '')
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)

  const validateOrganizationName = (value: string): string => {
    if (!value.trim()) {
      return 'Le nom de l&apos;organisation est requis'
    }

    if (value.trim().length < 2) {
      return 'Le nom doit contenir au moins 2 caractères'
    }

    if (value.trim().length > 100) {
      return 'Le nom ne peut pas dépasser 100 caractères'
    }

    const validPattern = /^[a-zA-Z0-9\s\-'&àâäçéèêëïîôùûüÿæœÀÂÄÇÉÈÊËÏÎÔÙÛÜŸÆŒ.]+$/
    if (!validPattern.test(value)) {
      return 'Le nom contient des caractères non autorisés'
    }

    return ''
  }

  const handleOrganizationNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setOrganizationName(value)
    
    if (touched) {
      setError(validateOrganizationName(value))
    }
  }

  const handleBlur = () => {
    setTouched(true)
    setError(validateOrganizationName(organizationName))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    
    const validationError = validateOrganizationName(organizationName)
    if (validationError) {
      setError(validationError)
      return
    }

    onNext({ organizationName: organizationName.trim() })
  }

  const isValid = organizationName.trim() && !error
  const charCount = organizationName.length

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="organizationName" className="text-blue-900">
          Nom de l&apos;organisation
        </Label>
        <Input
          id="organizationName"
          type="text"
          placeholder="Nom de votre entreprise"
          value={organizationName}
          onChange={handleOrganizationNameChange}
          onBlur={handleBlur}
          maxLength={100}
          className={error && touched ? 'border-red-500 focus-visible:ring-red-500' : 'border-blue-200 focus-visible:ring-blue-500'}
          aria-invalid={!!error && touched}
          aria-describedby={error && touched ? 'org-error' : undefined}
        />
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {error && touched && (
              <div id="org-error" className="flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
            {!error && organizationName && touched && (
              <div className="text-sm text-green-600">
                ✓ Nom valide
              </div>
            )}
          </div>
          <div className={`text-xs ${charCount > 90 ? 'text-orange-600' : 'text-gray-400'}`}>
            {charCount}/100
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          Retour
        </Button>
        <Button
          type="submit"
          disabled={!isValid}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
        >
          Continuer
        </Button>
      </div>
    </form>
  )
}
