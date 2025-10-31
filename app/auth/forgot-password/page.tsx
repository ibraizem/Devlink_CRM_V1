'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { AuthCard } from '@/components/auth/AuthCard';
import { AlertCircle, ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { resetPassword } from './actions';

function ForgotPasswordContent() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const isReset = searchParams.get('reset') === 'true';
  const isError = searchParams.get('error') === 'true';
  const message = searchParams.get('message');
  const errorDescription = searchParams.get('error_description') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('email', email);
      await resetPassword(formData);
    } catch (err) {
      setError(errorDescription || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (isReset) {
    return (
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
            <Mail className="h-12 w-12 text-green-600" />
          </motion.div>
        </div>
      </AuthCard>
    );
  }

  return (
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
        {isError && error && (
          <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}
        {message && (
          <div className="p-4 mb-6 text-sm text-green-700 bg-green-100 rounded-lg">
            <div className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              <span>{message}</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Adresse email</Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 py-3 w-full md:w-[320px] lg:w-[400px]"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full py-3 text-lg md:w-[320px] lg:w-[400px] rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
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
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
