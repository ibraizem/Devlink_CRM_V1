'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { AuthCard } from '@/components/auth/AuthCard';
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { isLoaded } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      setSuccess(true);
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
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

  if (success) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <AuthCard
          title="Vérifiez votre email"
          subtitle={
            <>
              Un lien de réinitialisation a été envoyé à votre adresse email.
              <br />
              Vérifiez votre boîte de réception et suivez les instructions pour réinitialiser votre mot de passe.
            </>
          }
          footer={
            <div className="text-center text-sm">
              <Link href="/auth/login" className="text-blue-600 hover:underline">
                Retour à la connexion
              </Link>
            </div>
          }
        >
          <div className="flex justify-center py-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-6 bg-green-50 rounded-full"
            >
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </motion.div>
          </div>
        </AuthCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <AuthCard
        title="Réinitialisation du mot de passe"
        subtitle="Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe."
        footer={
          <div className="text-center text-sm">
            <Link href="/auth/login" className="text-blue-600 hover:underline flex items-center justify-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Retour à la connexion
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
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </motion.div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-blue-900">Adresse email</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-blue-400" />
              </div>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 py-5 border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full py-5 text-base font-medium bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 shadow-lg shadow-blue-500/20 transition-all"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              'Envoyer le lien de réinitialisation'
            )}
          </Button>
        </form>
      </AuthCard>
    </div>
  );
}
