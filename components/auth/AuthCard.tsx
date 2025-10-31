'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useEffect, useState } from 'react';

type AuthCardProps = {
  title: string;
  subtitle: string | ReactNode;
  children: ReactNode;
  footer: ReactNode;
  highlightText?: string;
};

// Composant pour l'état de chargement
function LoadingSkeleton() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 sm:p-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthCard({ title, subtitle, children, footer, highlightText }: AuthCardProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Pendant le SSR et le premier rendu côté client, on affiche le squelette de chargement
  if (typeof window === 'undefined' || !isMounted) {
    return <LoadingSkeleton />;
  }

  return (
    <AnimatePresence mode="wait">
      <div className="max-h-fit flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Partie gauche - Formulaire */}
            <motion.div
              className="p-8 sm:p-12"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-blue-800 sm:text-3xl">
                    {title}
                  </h1>
                  <div className="mt-2 text-sm text-blue-600">
                    {subtitle}
                  </div>
                </div>

                <div className="mt-8">
                  {children}
                </div>

                <div className="mt-6">
                  {footer}
                </div>
              </div>
            </motion.div>

            {/* Partie droite - Illustration */}
            <motion.div 
              className="hidden lg:block bg-gradient-to-br from-blue-600 to-blue-800 p-8 sm:p-12 text-white relative overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="h-full flex flex-col justify-center items-center text-center relative z-10">
                <div className="max-w-md mx-auto">
                  <h2 className="text-2xl font-bold mb-4">
                    {highlightText || 'Gérez vos leads efficacement'}
                  </h2>
                  <p className="text-blue-100">
                    Une solution complète pour suivre, gérer et convertir vos prospects en clients fidèles.
                  </p>
                </div>
              </div>
              
              {/* Éléments décoratifs */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute w-64 h-64 bg-white rounded-full -top-32 -right-32"></div>
                <div className="absolute w-96 h-96 bg-blue-400 rounded-full -bottom-48 -left-48"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}