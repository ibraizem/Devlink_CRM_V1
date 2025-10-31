'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp } from '@/lib/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { CheckCircle2, User, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { AuthCard } from '@/components/auth/AuthCard';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signUpError } = await signUp(email, password, nom, prenom, 'telepro');

      if (signUpError) {
        setError(signUpError.message || 'Erreur lors de l\'inscription. Veuillez réessayer.');
        setLoading(false);
        return;
      }

      if (data?.user) {
        setSuccess(true);
        // Redirection après un court délai pour permettre à l'utilisateur de voir le message de succès
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (err) {
      console.error('Erreur inattendue:', err);
      setError('Une erreur inattendue est survenue. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthCard
        title="Inscription réussie !"
        subtitle="Votre compte a été créé avec succès"
        highlightText="Bienvenue dans la communauté DevLink CRM"
        footer={
          <Button
            onClick={() => router.push('/auth/login')}
            className="w-full mt-4 py-5 text-base font-medium bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 shadow-lg shadow-blue-500/20 transition-all"
          >
            Se connecter à mon compte
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        }
      >
        <motion.div 
          className="text-center py-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-50 mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <p className="text-blue-800/80 mb-6">
            Un email de confirmation a été envoyé à <span className="font-medium">{email}</span>.
            Veuillez vérifier votre boîte de réception pour activer votre compte.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 inline-flex items-center">
            <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            </svg>
            <span className="text-sm text-blue-700">Pensez à vérifier vos spams si vous ne voyez pas notre email.</span>
          </div>
        </motion.div>
      </AuthCard>
    );
  }
  return (
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
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <motion.div 
            className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start space-x-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </motion.div>
        )}
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="prenom" className="text-sm font-medium text-blue-900">Prénom</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-blue-400" />
              </div>
              <Input
                id="prenom"
                name="prenom"
                type="text"
                autoComplete="given-name"
                required
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="pl-10 py-5 border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Votre prénom"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="nom" className="text-sm font-medium text-blue-900">Nom</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-blue-400" />
              </div>
              <Input
                id="nom"
                name="nom"
                type="text"
                autoComplete="family-name"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="pl-10 py-5 border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Votre nom"
              />
            </div>
          </div>
        </div>
        
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
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-blue-400" />
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 py-5 border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="••••••••"
            />
          </div>
          <p className="mt-1 text-xs text-blue-600/80">
            Le mot de passe doit contenir au moins 8 caractères
          </p>
        </div>
        
        <div className="pt-2">
          <Button 
            type="submit" 
            className="w-full py-5 text-base font-medium bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 shadow-lg shadow-blue-500/20 transition-all"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Création en cours...
              </>
            ) : (
              'Commencer mon essai gratuit'
            )}
          </Button>
        </div>
        
        <p className="text-xs text-center text-blue-800/60 mt-6">
          En vous inscrivant, vous acceptez nos{' '}
          <Link href="/terms" className="font-medium text-blue-600 hover:underline">conditions d'utilisation</Link>{' '}
          et notre{' '}
          <Link href="/privacy" className="font-medium text-blue-600 hover:underline">politique de confidentialité</Link>.
        </p>
      </form>
    </AuthCard> 
  );
}

