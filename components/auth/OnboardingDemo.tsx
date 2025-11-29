'use client'

import { useState } from 'react'
import { Step1, Step2, Step3, Step4, Step5 } from './onboarding'
import { AuthCard } from './AuthCard'
import { Progress } from '@/components/ui/progress'

type OnboardingData = {
  email: string
  organizationName: string
  industry: string
  teamSize: string
  password: string
  confirmPassword: string
}

export function OnboardingDemo() {
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<OnboardingData>({
    email: '',
    organizationName: '',
    industry: '',
    teamSize: '',
    password: '',
    confirmPassword: '',
  })

  const totalSteps = 5
  const progress = (currentStep / totalSteps) * 100

  const handleNext = (stepData: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...stepData }))
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      console.log('Onboarding complete:', { ...data, ...stepData })
      alert('Onboarding terminé ! Consultez la console pour voir les données.')
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Bienvenue'
      case 2:
        return 'Votre organisation'
      case 3:
        return 'Secteur d&apos;activité'
      case 4:
        return 'Taille de l&apos;équipe'
      case 5:
        return 'Sécurité'
      default:
        return 'Onboarding'
    }
  }

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1:
        return 'Commençons par votre adresse email'
      case 2:
        return 'Parlez-nous de votre entreprise'
      case 3:
        return 'Dans quel domaine travaillez-vous ?'
      case 4:
        return 'Combien de personnes travaillent avec vous ?'
      case 5:
        return 'Créez un mot de passe sécurisé'
      default:
        return ''
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1 data={data} onNext={handleNext} />
      case 2:
        return <Step2 data={data} onNext={handleNext} onBack={handleBack} />
      case 3:
        return <Step3 data={data} onNext={handleNext} onBack={handleBack} />
      case 4:
        return <Step4 data={data} onNext={handleNext} onBack={handleBack} />
      case 5:
        return <Step5 data={data} onNext={handleNext} onBack={handleBack} />
      default:
        return null
    }
  }

  return (
    <AuthCard
      title={getStepTitle()}
      subtitle={getStepSubtitle()}
      footer={
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-blue-600">
            <span>Étape {currentStep} sur {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      }
      highlightText="Configurez votre compte en quelques étapes"
    >
      {renderStep()}
    </AuthCard>
  )
}
