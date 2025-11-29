'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AlertCircle, Users } from 'lucide-react'

const TEAM_SIZES = [
  { value: '1', label: '1 personne', description: 'Travailleur indépendant' },
  { value: '2-10', label: '2-10 personnes', description: 'Petite équipe' },
  { value: '11-50', label: '11-50 personnes', description: 'Équipe moyenne' },
  { value: '51-200', label: '51-200 personnes', description: 'Grande équipe' },
  { value: '201-1000', label: '201-1000 personnes', description: 'Entreprise' },
  { value: '1000+', label: '1000+ personnes', description: 'Grande entreprise' },
]

type Step4Props = {
  data: {
    teamSize: string
  }
  onNext: (data: { teamSize: string }) => void
  onBack: () => void
}

export function Step4({ data, onNext, onBack }: Step4Props) {
  const [teamSize, setTeamSize] = useState(data.teamSize || '')
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)

  const validateTeamSize = (value: string): string => {
    if (!value) {
      return 'Veuillez sélectionner la taille de votre équipe'
    }
    return ''
  }

  const handleTeamSizeChange = (value: string) => {
    setTeamSize(value)
    setTouched(true)
    setError(validateTeamSize(value))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    
    const validationError = validateTeamSize(teamSize)
    if (validationError) {
      setError(validationError)
      return
    }

    onNext({ teamSize })
  }

  const isValid = teamSize && !error

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label className="text-blue-900">
          Taille de l&apos;équipe
        </Label>
        <RadioGroup
          value={teamSize}
          onValueChange={handleTeamSizeChange}
          className="space-y-3"
          aria-invalid={!!error && touched}
          aria-describedby={error && touched ? 'teamsize-error' : undefined}
        >
          {TEAM_SIZES.map((size) => (
            <label
              key={size.value}
              className={`flex items-start space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                teamSize === size.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-blue-200 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              <RadioGroupItem value={size.value} id={size.value} className="mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">{size.label}</span>
                </div>
                <p className="text-sm text-blue-600 mt-0.5">{size.description}</p>
              </div>
            </label>
          ))}
        </RadioGroup>
        {error && touched && (
          <div id="teamsize-error" className="flex items-center gap-1.5 text-sm text-red-600 pt-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        {!error && teamSize && touched && (
          <div className="text-sm text-green-600 pt-2">
            ✓ Taille sélectionnée
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 Cette information nous permet d&apos;adapter les fonctionnalités et les recommandations à la taille de votre organisation.
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
