'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBootstrapTeam } from '@/hooks/useBootstrapTeam';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AuthCard } from '@/components/auth/AuthCard';
import { userService } from '@/lib/services/userService';
import { Loader2, Mail, Lock, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const { bootstrapPendingTeam } = useBootstrapTeam();
  const { toast } = useToast();
  // Utilisation de l'instance partagée de Supabase côté client

  useEffect(() => {
      // Laisser le middleware gérer la redirection
    // pour éviter les conflits entre le client et le serveur
    // Vérification de la session existante
    const checkSession = async () => {
      console.log('Vérification de la session en cours...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session trouvée:', session ? 'OUI' : 'NON');
      if (session) {
        console.log('Redirection vers:', redirectTo);
        router.push(redirectTo);
      }
    };
    
    checkSession();
  }, [router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Tentative de connexion avec:', email);
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Erreur de connexion:', signInError);
        setError(signInError.message || 'Email ou mot de passe incorrect');
        setLoading(false);
        return;
      }

      console.log('Connexion réussie, redirection vers:', redirectTo);
      
      // Enregistrement de l'activité de connexion
      if (authData?.user) {
        try {
await userService.logActivity(authData.user.id, 'login', {
            ip_address: null, // Vous pouvez ajouter l'IP ici si nécessaire
            user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
          });
          console.log('Activité de connexion enregistrée');
          // Bootstrap de l'équipe si un teamName a été saisi durant l'onboarding
          try {
            const created = await bootstrapPendingTeam(authData.user.id);
            if (created) {
              toast({
                title: 'Équipe créée avec succès',
                description: 'Votre équipe a été initialisée automatiquement.',
              })
            }
          } catch (_) {}
        } catch (activityError) {
          console.error('Erreur lors de l\'enregistrement de l\'activité:', activityError);
          // On continue même en cas d'erreur d'enregistrement de l'activité
        }
      }
      
      // Navigation côté client pour éviter le rechargement complet
      router.push(redirectTo);
          
    } catch (err) {
      console.error('Erreur inattendue lors de la connexion:', err);
      setError('Une erreur inattendue est survenue. Veuillez réessayer.');
      setLoading(false);
    }
  };

  return (
    <div className="h-100 w-100 bg-gradient-to-br from-blue-50 via-white to-blue-50">
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
        <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <motion.div 
            className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start space-x-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </motion.div>
        )}
        
        <div className="space-y-1">
          <Label htmlFor="email" className="text-sm font-medium text-blue-900">Adresse email</Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-blue-400" />
            </div>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 py-5 border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="votre@email.com"
            />
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-blue-900">Mot de passe</Label>
            <Link 
              href="/auth/forgot-password" 
              className="text-xs font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-blue-400" />
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 py-5 border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="••••••••"
            />
          </div>
        </div>
        
        <div className="pt-2">
          <Button 
            type="submit" 
            className="w-full py-5 text-base font-medium bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 shadow-lg shadow-blue-500/20 transition-all"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              'Se connecter'
            )}
          </Button>
        </div>
        
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-blue-100"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-blue-500">Ou continuez avec</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Remplacer le bouton OAuth par un placeholder ou désactiver */}
          <Button
            type="button"
            variant="outline"
            className="py-2.5 border-blue-200 text-blue-700 hover:bg-blue-50"
            disabled={true}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            className="py-2.5 border-blue-200 text-blue-700 hover:bg-blue-50"
            disabled={true}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 23 23" fill="currentColor">
              <path d="M0 0v23h11v-23h-11zm12 0v23h11v-23h-11z" fill="#f3f3f3" />
              <path d="M11.5 0v11.5h11.5v-11.5h-11.5zm0 11.5v11.5h11.5v-11.5h-11.5z" fill="#f1511b" />
              <path d="M0 11.5v11.5h11.5v-11.5h-11.5z" fill="#80cc28" />
              <path d="M11.5 11.5v11.5h11.5v-11.5h-11.5z" fill="#00adef" />
            </svg>
            Microsoft
          </Button>
        </div>
        </form>
      </AuthCard>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

