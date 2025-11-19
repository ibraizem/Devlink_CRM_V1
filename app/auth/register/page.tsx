'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { OnboardingFlow } from '@/components/auth/OnboardingFlow';
import { completeOnboarding, OnboardingData } from '@/lib/services/onboardingService';
import { AuthCard } from '@/components/auth/AuthCard';
import { saveOnboardingTeamName } from '@/hooks/useBootstrapTeam';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOnboardingComplete = async (data: OnboardingData) => {
    try {
      setLoading(true)
      // Mémoriser le teamName saisi pour création post-login
      if (data.teamName) {
        saveOnboardingTeamName(data.teamName)
      }
      const result = await completeOnboarding(data)
      
      if (!result.success) {
        if (result.error === 'USER_ALREADY_EXISTS') {
          // Cas utilisateur déjà existant - TOAST avec options
          toast({
            title: "Compte déjà existant",
            description: "Un compte existe déjà avec cet email.",
            action: (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/auth/login'}
                >
                  Se connecter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/auth/forgot-password'}
                >
                  Mot de passe oublié
                </Button>
              </div>
            ),
            duration: 10000
          })
        } else {
          // Autres erreurs
          toast({
            title: "Erreur lors de l'inscription",
            description: result.message || "Une erreur est survenue. Veuillez réessayer.",
            variant: "destructive"
          })
        }
        // NE PAS REDIRIGER en cas d'erreur
        return
      }

      // SEULEMENT en cas de succès: afficher l'état de succès (pas de connexion auto, pas de redirection)
      setIsSuccess(true)
      toast({
        title: "Compte créé !",
        description: "Vérifiez votre email et cliquez sur le lien de confirmation pour activer votre compte.",
      })

    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error)
      toast({
        title: "Erreur lors de l'inscription",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive"
      })
      // NE PAS REDIRIGER en cas d'erreur catch
    } finally {
      setLoading(false)
    }
  };

  // État de succès
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4">
        <AuthCard
          title=""
          subtitle=""
          footer=""
        >
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12H8m8 0l-3 3m3-3l-3-3M12 22a10 10 0 100-20 10 10 0 000 20z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🎉 Compte créé !</h2>
            <p className="text-gray-600 mb-6">
              Vérifiez votre boîte mail et cliquez sur le lien de confirmation avant de vous connecter.
            </p>
            <div className="mt-4 space-y-2 text-sm text-gray-500">
              <p>- Pensez à vérifier vos spams si vous ne trouvez pas l'email.</p>
              <p>- Une fois confirmé, revenez vous connecter à partir de la page de connexion.</p>
            </div>
          </div>
        </AuthCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Devlink CRM</span>
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Créer votre compte
          </h1>
          <p className="text-gray-600">
            Rejoignez-nous et transformez votre prospection
          </p>
        </div>

        {/* Onboarding Flow */}
        <OnboardingFlow onComplete={handleOnboardingComplete} />

        {/* Lien vers connexion */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Vous avez déjà un compte ?{' '}
            <Link 
              href="/auth/login" 
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}