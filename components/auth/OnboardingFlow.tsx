'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Building, Users, Briefcase, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// Types pour les données d'onboarding
interface OnboardingData {
  firstName: string
  lastName: string
  organization: string
  industry: string
  teamName: string
  email: string
  password: string
}

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => Promise<void>
}

const METIERS = [
  { 
    id: 'assurance', 
    label: 'Assurance décennale', 
    description: 'Prospection pour assurances et garanties décennales',
    icon: '🛡️'
  },
  { 
    id: 'energie', 
    label: 'Énergie / Solar', 
    description: 'Démarchage pour solutions énergétiques et solaires',
    icon: '⚡'
  },
  { 
    id: 'telecom', 
    label: 'Télécom B2B', 
    description: 'Services télécoms pour entreprises',
    icon: '📞'
  },
  { 
    id: 'marketing', 
    label: 'Agence marketing', 
    description: 'Acquisition clients pour agences digitales',
    icon: '📈'
  },
  { 
    id: 'batiment', 
    label: 'Bâtiment / BTP', 
    description: 'Prospection dans le secteur du bâtiment',
    icon: '🏗️'
  },
  { 
    id: 'recrutement', 
    label: 'Recrutement', 
    description: 'Services de recrutement B2B',
    icon: '👥'
  }
]

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({
    firstName: '',
    lastName: '',
    organization: '',
    industry: '',
    teamName: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const totalSteps = 5

  const updateData = useCallback((field: keyof OnboardingData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }))
    // Effacer l'erreur si elle existe
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }, [errors])

  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 0: // Nom + Prénom
        if (!data.firstName.trim()) newErrors.firstName = 'Le prénom est requis'
        if (!data.lastName.trim()) newErrors.lastName = 'Le nom est requis'
        break
      case 1: // Organisation
        if (!data.organization.trim()) newErrors.organization = 'Le nom de l\'organisation est requis'
        break
      case 2: // Métier
        if (!data.industry) newErrors.industry = 'Veuillez sélectionner un secteur d\'activité'
        break
      case 4: // Email + Mot de passe
        if (!data.email.trim()) newErrors.email = 'L\'email est requis'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) 
          newErrors.email = 'Veuillez entrer un email valide'
        if (!data.password) newErrors.password = 'Le mot de passe est requis'
        else if (data.password.length < 8) 
          newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères'
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [data])

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps - 1) {
        setCurrentStep(prev => prev + 1)
      } else {
        // Dernière étape - soumettre
        handleSubmit()
      }
    }
  }, [currentStep, validateStep])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setLoading(true)
    try {
      await onComplete(data)
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error)
      setErrors({ submit: 'Une erreur est survenue. Veuillez réessayer.' })
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <Step1Name data={data} updateData={updateData} errors={errors} />
      case 1:
        return <Step2Organization data={data} updateData={updateData} errors={errors} />
      case 2:
        return <Step3Industry data={data} updateData={updateData} errors={errors} />
      case 3:
        return <Step4Team data={data} updateData={updateData} errors={errors} />
      case 4:
        return <Step5Account data={data} updateData={updateData} errors={errors} />
      default:
        return null
    }
  }

  const getStepTitle = () => {
    const titles = [
      'Commencez par votre identité',
      'Votre organisation',
      'Votre secteur d\'activité',
      'Votre équipe (optionnel)',
      'Créer votre compte'
    ]
    return titles[currentStep]
  }

  const getStepSubtitle = () => {
    const subtitles = [
      'Comment devrions-nous vous appeler ?',
      'Le nom de votre entreprise ou organisation',
      'Sélectionnez votre secteur pour des playbooks adaptés',
      'Créez une équipe ou passez cette étape',
      'Dernière étape avant de commencer !'
    ]
    return subtitles[currentStep]
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-blue-600">
            Étape {currentStep + 1} sur {totalSteps}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(((currentStep + 1) / totalSteps) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
            initial={{ width: '20%' }}
            animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Carte d'étape */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {getStepTitle()}
          </h2>
          <p className="text-gray-600">
            {getStepSubtitle()}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {currentStep > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              className="flex-1"
              disabled={loading}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          )}

          <Button
            type="button"
            onClick={nextStep}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {currentStep === totalSteps - 1 ? 'Création...' : 'Chargement...'}
              </>
            ) : (
              <>
                {currentStep === totalSteps - 1 ? 'Créer mon compte' : 'Continuer'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {errors.submit && (
          <motion.div
            className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {errors.submit}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

// Composants d'étape
function Step1Name({ data, updateData, errors }: { data: OnboardingData, updateData: (field: keyof OnboardingData, value: string) => void, errors: Record<string, string> }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="firstName">Prénom</Label>
        <div className="relative">
          <Input
            id="firstName"
            value={data.firstName}
            onChange={(e) => updateData('firstName', e.target.value)}
            placeholder="Votre prénom"
            className={cn(errors.firstName && 'border-red-500')}
            autoFocus
          />
          <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastName">Nom</Label>
        <div className="relative">
          <Input
            id="lastName"
            value={data.lastName}
            onChange={(e) => updateData('lastName', e.target.value)}
            placeholder="Votre nom"
            className={cn(errors.lastName && 'border-red-500')}
          />
          <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
      </div>
    </div>
  )
}

function Step2Organization({ data, updateData, errors }: { data: OnboardingData, updateData: (field: keyof OnboardingData, value: string) => void, errors: Record<string, string> }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="organization">Nom de l'organisation</Label>
        <div className="relative">
          <Input
            id="organization"
            value={data.organization}
            onChange={(e) => updateData('organization', e.target.value)}
            placeholder="Ex: Ma Entreprise SARL"
            className={cn(errors.organization && 'border-red-500')}
            autoFocus
          />
          <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        {errors.organization && <p className="text-sm text-red-500">{errors.organization}</p>}
      </div>
    </div>
  )
}

function Step3Industry({ data, updateData, errors }: { data: OnboardingData, updateData: (field: keyof OnboardingData, value: string) => void, errors: Record<string, string> }) {
  return (
    <div className="space-y-4">
      <Label>Sélectionnez votre secteur d'activité</Label>
      <div className="grid gap-3">
        {METIERS.map((metier) => (
          <motion.div
            key={metier.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <button
              type="button"
              onClick={() => updateData('industry', metier.id)}
              className={cn(
                'w-full p-4 text-left border-2 rounded-lg transition-all',
                data.industry === metier.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{metier.icon}</span>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{metier.label}</h3>
                  <p className="text-sm text-gray-600 mt-1">{metier.description}</p>
                </div>
              </div>
            </button>
          </motion.div>
        ))}
      </div>
      {errors.industry && <p className="text-sm text-red-500">{errors.industry}</p>}
    </div>
  )
}

function Step4Team({ data, updateData, errors }: { data: OnboardingData, updateData: (field: keyof OnboardingData, value: string) => void, errors: Record<string, string> }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="teamName">Nom de votre équipe (optionnel)</Label>
        <div className="relative">
          <Input
            id="teamName"
            value={data.teamName}
            onChange={(e) => updateData('teamName', e.target.value)}
            placeholder="Ex: Équipe Commerciale A"
            className={cn(errors.teamName && 'border-red-500')}
            autoFocus
          />
          <Users className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        {errors.teamName && <p className="text-sm text-red-500">{errors.teamName}</p>}
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-700">
          💡 Vous pourrez créer d'autres équipes et ajouter des membres plus tard. 
          Cette étape est optionnelle pour commencer rapidement.
        </p>
      </div>
    </div>
  )
}

function Step5Account({ data, updateData, errors }: { data: OnboardingData, updateData: (field: keyof OnboardingData, value: string) => void, errors: Record<string, string> }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Adresse email</Label>
        <div className="relative">
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => updateData('email', e.target.value)}
            placeholder="votre@email.com"
            className={cn(errors.email && 'border-red-500')}
            autoFocus
          />
          <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <div className="relative">
          <Input
            id="password"
            type="password"
            value={data.password}
            onChange={(e) => updateData('password', e.target.value)}
            placeholder="••••••••"
            className={cn(errors.password && 'border-red-500')}
          />
          <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        {errors.password ? (
          <p className="text-sm text-red-500">{errors.password}</p>
        ) : (
          <p className="text-xs text-gray-500">Le mot de passe doit contenir au moins 8 caractères</p>
        )}
      </div>
    </div>
  )
}
