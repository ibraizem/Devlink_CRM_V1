'use client';

import { motion } from 'framer-motion';
import { CampagnesCard, FichiersCard, IntegrationsCard, RendezVousCard } from '@/components/auth/onboarding';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function OnboardingDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'inscription
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">
            Fonctionnalités DevLink CRM
          </h1>
          <p className="text-white/70 text-lg">
            Découvrez toutes les capacités de notre CRM avec des aperçus animés en temps réel
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <CampagnesCard />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <FichiersCard />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <IntegrationsCard />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <RendezVousCard />
          </motion.div>
        </div>

        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="inline-block bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">
              Prêt à transformer votre gestion commerciale ?
            </h2>
            <p className="text-white/70 mb-6 max-w-2xl">
              Rejoignez des centaines d'entreprises qui optimisent leur processus de vente avec DevLink CRM.
              Commencez votre essai gratuit dès aujourd'hui.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/auth/register"
                className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Commencer gratuitement
              </Link>
              <Link
                href="/"
                className="px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20"
              >
                En savoir plus
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
