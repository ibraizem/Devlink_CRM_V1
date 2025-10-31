        'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/utils/supabase/client';
import { Loader2, Lock, CheckCircle } from 'lucide-react';
import { AuthCard } from '@/components/auth/AuthCard';
import Link from 'next/link';

function UpdatePasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [validLink, setValidLink] = useState<boolean | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Vérifier si le token est valide au chargement de la page
  useEffect(() => {
    const supabase = createClient();
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        // Si pas de session ou d'erreur, le lien n'est pas valide
        if (error || !data.session) {
          setValidLink(false);
          setMessage({
            type: 'error',
            text: 'Le lien de réinitialisation est invalide ou a expiré. Veuillez faire une nouvelle demande.'
          });
        } else {
          setValidLink(true);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de la session:', error);
        setValidLink(false);
        setMessage({
          type: 'error',
          text: 'Une erreur est survenue lors de la vérification du lien.'
        });
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Les mots de passe ne correspondent pas.'
      });
      return;
    }

    if (password.length < 6) {
      setMessage({
        type: 'error',
        text: 'Le mot de passe doit contenir au moins 6 caractères.'
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Votre mot de passe a été mis à jour avec succès. Vous allez être redirigé vers la page de connexion...'
      });

      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du mot de passe:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Une erreur est survenue lors de la mise à jour du mot de passe.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (validLink === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-gray-600">Vérification du lien de réinitialisation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12 dark:bg-gray-900">
      <AuthCard
        title="Réinitialiser le mot de passe"
        subtitle="Entrez votre nouveau mot de passe ci-dessous"
        footer={
          <div className="mt-4 text-center text-sm">
            <a 
              href="/auth/login" 
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Retour à la connexion
            </a>
          </div>
        }
      >
        {validLink ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Nouveau mot de passe
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirmer le mot de passe
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10"
                />
              </div>
            </div>

            {message && (
              <div 
                className={`p-4 rounded-md ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-800' 
                    : 'bg-red-50 text-red-800'
                }`}
              >
                <p className="text-sm flex items-center">
                  {message.type === 'success' && (
                    <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  )}
                  {message.text}
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full justify-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              disabled={loading || message?.type === 'success'}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mise à jour en cours...
                </>
              ) : (
                'Mettre à jour le mot de passe'
              )}
            </Button>
          </form>
        ) : (
          <div className="text-center">
            <div className="p-4 bg-red-50 text-red-800 rounded-md">
              <p className="text-sm">{message?.text}</p>
            </div>
            <Link 
              href="/auth/forgot-password" 
              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Lock className="w-4 h-4 mr-2" />
              Demander un nouveau lien
            </Link>
          </div>
        )}
      </AuthCard>
    </div>
  );
}

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <UpdatePasswordContent />
    </Suspense>
  );
}
