'use client';

import { motion } from 'framer-motion';
import { Zap, Mail, Calendar, Database, CheckCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Integration {
  id: number;
  name: string;
  icon: React.ReactNode;
  status: 'connected' | 'connecting' | 'available';
  color: string;
}

export function IntegrationsCard() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 1,
      name: 'Email Marketing',
      icon: <Mail className="h-4 w-4" />,
      status: 'connected',
      color: 'from-green-400 to-emerald-400',
    },
    {
      id: 2,
      name: 'Calendrier',
      icon: <Calendar className="h-4 w-4" />,
      status: 'connecting',
      color: 'from-blue-400 to-cyan-400',
    },
    {
      id: 3,
      name: 'Base de données',
      icon: <Database className="h-4 w-4" />,
      status: 'available',
      color: 'from-orange-400 to-red-400',
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIntegrations((prev) =>
        prev.map((integration) => {
          if (integration.status === 'connecting') {
            return { ...integration, status: 'connected' };
          }
          if (integration.status === 'available' && Math.random() > 0.7) {
            return { ...integration, status: 'connecting' };
          }
          return integration;
        })
      );
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return (
          <div className="flex items-center gap-1 text-xs text-green-300">
            <CheckCircle className="h-3 w-3" />
            <span>Connecté</span>
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center gap-1 text-xs text-blue-300">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Connexion...</span>
          </div>
        );
      case 'available':
        return (
          <span className="text-xs text-white/50">Disponible</span>
        );
    }
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 p-6 backdrop-blur-sm border border-white/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-5 w-5 text-orange-300" />
            <h3 className="text-lg font-semibold text-white">Intégrations</h3>
          </div>
          <p className="text-sm text-white/70">Connectez vos outils favoris</p>
        </div>
        <motion.div
          className="rounded-full bg-orange-400/20 p-2"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Zap className="h-4 w-4 text-orange-300" />
        </motion.div>
      </div>

      <div className="space-y-3">
        {integrations.map((integration, index) => (
          <motion.div
            key={integration.id}
            className="flex items-center justify-between p-3 rounded-lg bg-white/5 backdrop-blur-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                className={`h-10 w-10 rounded-lg bg-gradient-to-br ${integration.color} flex items-center justify-center text-white`}
                animate={{
                  scale: integration.status === 'connecting' ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  duration: 1,
                  repeat: integration.status === 'connecting' ? Infinity : 0,
                }}
              >
                {integration.icon}
              </motion.div>
              <div>
                <p className="text-sm font-medium text-white">
                  {integration.name}
                </p>
                <div className="mt-1">{getStatusBadge(integration.status)}</div>
              </div>
            </div>
            {integration.status === 'connected' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="h-2 w-2 rounded-full bg-green-400"
              />
            )}
          </motion.div>
        ))}
      </div>

      <motion.div
        className="mt-4 text-center text-xs text-white/60"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        +50 intégrations disponibles
      </motion.div>

      <motion.div
        className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-orange-400/20 blur-2xl"
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </motion.div>
  );
}
