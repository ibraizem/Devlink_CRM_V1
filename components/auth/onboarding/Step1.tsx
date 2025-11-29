'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

type Step1Props = {
  data: {
    email: string
  }
  onNext: (data: { email: string }) => void
  onBack?: () => void
}

export function Step1({ data, onNext, onBack }: Step1Props) {
  const [email, setEmail] = useState(data.email || '')
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)

  const validateEmail = (value: string): string => {
    if (!value.trim()) {
      return 'L&apos;adresse email est requise'
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return 'Veuillez entrer une adresse email valide'
    }

    const invalidDomains = ['test.com', 'example.com', 'temp.com']
    const domain = value.split('@')[1]?.toLowerCase()
    if (domain && invalidDomains.includes(domain)) {
      return 'Veuillez utiliser une adresse email professionnelle'
    }

    return ''
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    
    if (touched) {
      setError(validateEmail(value))
    }
  }

  const handleBlur = () => {
    setTouched(true)
    setError(validateEmail(email))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    
    const validationError = validateEmail(email)
    if (validationError) {
      setError(validationError)
      return
    }

    onNext({ email: email.trim() })
  }

  const isValid = email.trim() && !error

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-blue-900">
          Adresse email professionnelle
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="exemple@entreprise.com"
          value={email}
          onChange={handleEmailChange}
          onBlur={handleBlur}
          className={error && touched ? 'border-red-500 focus-visible:ring-red-500' : 'border-blue-200 focus-visible:ring-blue-500'}
          aria-invalid={!!error && touched}
          aria-describedby={error && touched ? 'email-error' : undefined}
        />
        {error && touched && (
          <div id="email-error" className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        {!error && email && touched && (
          <div className="text-sm text-green-600">
            ✓ Email valide
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            Retour
          </Button>
        )}
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
