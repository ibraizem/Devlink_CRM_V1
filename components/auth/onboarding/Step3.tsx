'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle } from 'lucide-react'

const INDUSTRIES = [
  { value: 'technology', label: 'Technologie & IT' },
  { value: 'finance', label: 'Finance & Banque' },
  { value: 'healthcare', label: 'Santé & Médical' },
  { value: 'retail', label: 'Commerce & Retail' },
  { value: 'manufacturing', label: 'Industrie & Fabrication' },
  { value: 'consulting', label: 'Conseil & Services' },
  { value: 'education', label: 'Éducation & Formation' },
  { value: 'real-estate', label: 'Immobilier' },
  { value: 'marketing', label: 'Marketing & Communication' },
  { value: 'hospitality', label: 'Hôtellerie & Restauration' },
  { value: 'construction', label: 'BTP & Construction' },
  { value: 'transport', label: 'Transport & Logistique' },
  { value: 'energy', label: 'Énergie & Environnement' },
  { value: 'legal', label: 'Juridique' },
  { value: 'other', label: 'Autre' },
]

type Step3Props = {
  data: {
    industry: string
  }
  onNext: (data: { industry: string }) => void
  onBack: () => void
}

export function Step3({ data, onNext, onBack }: Step3Props) {
  const [industry, setIndustry] = useState(data.industry || '')
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)

  const validateIndustry = (value: string): string => {
    if (!value) {
      return 'Veuillez sélectionner un secteur d&apos;activité'
    }
    return ''
  }

  const handleIndustryChange = (value: string) => {
    setIndustry(value)
    setTouched(true)
    setError(validateIndustry(value))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    
    const validationError = validateIndustry(industry)
    if (validationError) {
      setError(validationError)
      return
    }

    onNext({ industry })
  }

  const isValid = industry && !error

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="industry" className="text-blue-900">
          Secteur d&apos;activité
        </Label>
        <Select value={industry} onValueChange={handleIndustryChange}>
          <SelectTrigger
            id="industry"
            className={error && touched ? 'border-red-500 focus:ring-red-500' : 'border-blue-200 focus:ring-blue-500'}
            aria-invalid={!!error && touched}
            aria-describedby={error && touched ? 'industry-error' : undefined}
          >
            <SelectValue placeholder="Sélectionnez votre secteur d'activité" />
          </SelectTrigger>
          <SelectContent>
            {INDUSTRIES.map((industryOption) => (
              <SelectItem key={industryOption.value} value={industryOption.value}>
                {industryOption.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && touched && (
          <div id="industry-error" className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        {!error && industry && touched && (
          <div className="text-sm text-green-600">
            ✓ Secteur sélectionné
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 Cette information nous aide à personnaliser votre expérience et à vous proposer des fonctionnalités adaptées à votre secteur.
        </p>
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
