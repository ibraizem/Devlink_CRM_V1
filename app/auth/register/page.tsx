'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, SignUp } from '@clerk/nextjs';
import { AuthCard } from '@/components/auth/AuthCard';
import { ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { OnboardingFeaturePanel } from '@/components/auth/onboarding/OnboardingFeaturePanel';

export default function RegisterPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isSignedIn, isLoaded, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <AuthCard
        title="Créer un compte"
        subtitle={
          <>
            <div>Créez votre compte pour accéder à toutes les fonctionnalités</div>
            <Link 
              href="/" 
              className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ArrowRight className="h-3 w-3 mr-1 transform rotate-180" />
              Retour à l'accueil
            </Link>
          </>
        }
        footer={
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Vous avez déjà un compte ? </span>
            <Link 
              href="/auth/login" 
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Se connecter
            </Link>
          </div>
        }
        rightPanel={<OnboardingFeaturePanel />}
      >
        <div className="flex justify-center">
          <SignUp 
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-none bg-transparent',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'border-blue-200 text-blue-700 hover:bg-blue-50',
                formButtonPrimary: 'bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 shadow-lg shadow-blue-500/20',
                formFieldInput: 'border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100',
                footerActionLink: 'text-blue-600 hover:text-blue-500',
              },
            }}
            redirectUrl="/dashboard"
          />
        </div>
      </AuthCard>
    </div>
  );
}
