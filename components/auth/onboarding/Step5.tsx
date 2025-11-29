'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Eye, EyeOff, Check, X } from 'lucide-react'

type PasswordStrength = {
  score: number
  label: string
  color: string
  bgColor: string
}

type Step5Props = {
  data: {
    password: string
    confirmPassword: string
  }
  onNext: (data: { password: string; confirmPassword: string }) => void
  onBack: () => void
}

export function Step5({ data, onNext, onBack }: Step5Props) {
  const [password, setPassword] = useState(data.password || '')
  const [confirmPassword, setConfirmPassword] = useState(data.confirmPassword || '')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [confirmTouched, setConfirmTouched] = useState(false)

  const calculatePasswordStrength = (pwd: string): PasswordStrength => {
    let score = 0
    
    if (pwd.length >= 8) score += 1
    if (pwd.length >= 12) score += 1
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1
    if (/\d/.test(pwd)) score += 1
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score += 1

    if (score <= 1) return { score: 0, label: 'Très faible', color: 'text-red-600', bgColor: 'bg-red-500' }
    if (score === 2) return { score: 25, label: 'Faible', color: 'text-orange-600', bgColor: 'bg-orange-500' }
    if (score === 3) return { score: 50, label: 'Moyen', color: 'text-yellow-600', bgColor: 'bg-yellow-500' }
    if (score === 4) return { score: 75, label: 'Bon', color: 'text-blue-600', bgColor: 'bg-blue-500' }
    return { score: 100, label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-500' }
  }

  const getPasswordRequirements = (pwd: string) => [
    { met: pwd.length >= 8, text: 'Au moins 8 caractères' },
    { met: /[a-z]/.test(pwd) && /[A-Z]/.test(pwd), text: 'Majuscules et minuscules' },
    { met: /\d/.test(pwd), text: 'Au moins un chiffre' },
    { met: /[!@#$%^&*(),.?":{}|<>]/.test(pwd), text: 'Au moins un caractère spécial' },
  ]

  const validatePassword = (pwd: string): string => {
    if (!pwd) {
      return 'Le mot de passe est requis'
    }
    if (pwd.length < 8) {
      return 'Le mot de passe doit contenir au moins 8 caractères'
    }
    if (!/[a-z]/.test(pwd) || !/[A-Z]/.test(pwd)) {
      return 'Le mot de passe doit contenir des majuscules et minuscules'
    }
    if (!/\d/.test(pwd)) {
      return 'Le mot de passe doit contenir au moins un chiffre'
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      return 'Le mot de passe doit contenir au moins un caractère spécial'
    }
    return ''
  }

  const validateConfirmPassword = (pwd: string, confirm: string): string => {
    if (!confirm) {
      return 'Veuillez confirmer votre mot de passe'
    }
    if (pwd !== confirm) {
      return 'Les mots de passe ne correspondent pas'
    }
    return ''
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    
    if (passwordTouched) {
      setPasswordError(validatePassword(value))
    }
    if (confirmTouched && confirmPassword) {
      setConfirmError(validateConfirmPassword(value, confirmPassword))
    }
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setConfirmPassword(value)
    
    if (confirmTouched) {
      setConfirmError(validateConfirmPassword(password, value))
    }
  }

  const handlePasswordBlur = () => {
    setPasswordTouched(true)
    setPasswordError(validatePassword(password))
  }

  const handleConfirmPasswordBlur = () => {
    setConfirmTouched(true)
    setConfirmError(validateConfirmPassword(password, confirmPassword))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordTouched(true)
    setConfirmTouched(true)
    
    const pwdError = validatePassword(password)
    const confError = validateConfirmPassword(password, confirmPassword)
    
    setPasswordError(pwdError)
    setConfirmError(confError)
    
    if (pwdError || confError) {
      return
    }

    onNext({ password, confirmPassword })
  }

  const strength = password ? calculatePasswordStrength(password) : null
  const requirements = getPasswordRequirements(password)
  const isValid = password && confirmPassword && !passwordError && !confirmError

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="password" className="text-blue-900">
          Mot de passe
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Créez un mot de passe sécurisé"
            value={password}
            onChange={handlePasswordChange}
            onBlur={handlePasswordBlur}
            className={passwordError && passwordTouched ? 'border-red-500 focus-visible:ring-red-500 pr-10' : 'border-blue-200 focus-visible:ring-blue-500 pr-10'}
            aria-invalid={!!passwordError && passwordTouched}
            aria-describedby={passwordError && passwordTouched ? 'password-error' : 'password-requirements'}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        
        {password && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Force du mot de passe:</span>
              <Badge variant="outline" className={`${strength?.color} border-current`}>
                {strength?.label}
              </Badge>
            </div>
            <Progress value={strength?.score} className="h-2" />
          </div>
        )}

        <div id="password-requirements" className="space-y-1.5 pt-2">
          {requirements.map((req, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              {req.met ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
              <span className={req.met ? 'text-green-600' : 'text-gray-500'}>
                {req.text}
              </span>
            </div>
          ))}
        </div>

        {passwordError && passwordTouched && (
          <div id="password-error" className="flex items-center gap-1.5 text-sm text-red-600 pt-2">
            <AlertCircle className="h-4 w-4" />
            <span>{passwordError}</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-blue-900">
          Confirmer le mot de passe
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirmez votre mot de passe"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            onBlur={handleConfirmPasswordBlur}
            className={confirmError && confirmTouched ? 'border-red-500 focus-visible:ring-red-500 pr-10' : 'border-blue-200 focus-visible:ring-blue-500 pr-10'}
            aria-invalid={!!confirmError && confirmTouched}
            aria-describedby={confirmError && confirmTouched ? 'confirm-error' : undefined}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {confirmError && confirmTouched && (
          <div id="confirm-error" className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{confirmError}</span>
          </div>
        )}
        {!confirmError && confirmPassword && confirmTouched && (
          <div className="text-sm text-green-600">
            ✓ Les mots de passe correspondent
          </div>
        )}
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
          Terminer
        </Button>
      </div>
    </form>
  )
}
