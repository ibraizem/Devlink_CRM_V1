'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, SignIn } from '@clerk/nextjs';
import { AuthCard } from '@/components/auth/AuthCard';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
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
        title="Connexion à votre compte"
        subtitle={
          <div className="space-y-2">
            <div>Bienvenue à nouveau ! Connectez-vous pour accéder à votre compte</div>
            <Link 
              href="/" 
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              Retour à l'accueil
            </Link>
          </div>
        }
        footer={
          <div className="mt-4 text-center text-sm">
            Pas encore de compte ?{' '}
            <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
              Créer un compte
            </Link>
          </div>
        }
      >
        <div className="flex justify-center">
          <SignIn 
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
