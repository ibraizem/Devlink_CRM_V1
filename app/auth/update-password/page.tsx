'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, CheckCircle } from 'lucide-react';
import { AuthCard } from '@/components/auth/AuthCard';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Les mots de passe ne correspondent pas.'
      });
      return;
    }

    if (password.length < 8) {
      setMessage({
        type: 'error',
        text: 'Le mot de passe doit contenir au moins 8 caractères.'
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await user?.updatePassword({
        newPassword: password,
      });

      setMessage({
        type: 'success',
        text: 'Votre mot de passe a été mis à jour avec succès. Vous allez être redirigé...'
      });

      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du mot de passe:', error);
      setMessage({
        type: 'error',
        text: 'Une erreur est survenue lors de la mise à jour du mot de passe.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <AuthCard
          title="Réinitialiser le mot de passe"
          subtitle="Vous devez être connecté pour modifier votre mot de passe"
          footer={
            <div className="mt-4 text-center text-sm">
              <Link 
                href="/auth/login" 
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Retour à la connexion
              </Link>
            </div>
          }
        >
          <div className="text-center py-8">
            <div className="p-4 bg-red-50 text-red-800 rounded-md">
              <p className="text-sm">Vous devez être connecté pour accéder à cette page.</p>
            </div>
            <Link 
              href="/auth/login" 
              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Se connecter
            </Link>
          </div>
        </AuthCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <AuthCard
        title="Réinitialiser le mot de passe"
        subtitle="Entrez votre nouveau mot de passe ci-dessous"
        footer={
          <div className="mt-4 text-center text-sm">
            <Link 
              href="/dashboard" 
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Retour au tableau de bord
            </Link>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-blue-900">
              Nouveau mot de passe
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-blue-400" />
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="pl-10 py-5 border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-blue-900">
              Confirmer le mot de passe
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-blue-400" />
              </div>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="pl-10 py-5 border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {message && (
            <motion.div 
              className={`p-4 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800' 
                  : 'bg-red-50 text-red-800'
              }`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-sm flex items-center">
                {message.type === 'success' && (
                  <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                )}
                {message.text}
              </p>
            </motion.div>
          )}

          <Button 
            type="submit" 
            className="w-full py-5 text-base font-medium bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 shadow-lg shadow-blue-500/20 transition-all"
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
      </AuthCard>
    </div>
  );
}
