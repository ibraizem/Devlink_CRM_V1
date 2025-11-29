'use client';

import { motion } from 'framer-motion';
import { CampagnesCard } from './CampagnesCard';
import { FichiersCard } from './FichiersCard';
import { IntegrationsCard } from './IntegrationsCard';
import { RendezVousCard } from './RendezVousCard';
import { useEffect, useState } from 'react';

export function OnboardingFeaturePanel() {
  const [activeCard, setActiveCard] = useState(0);
  
  const cards = [
    { component: <CampagnesCard />, title: 'Campagnes' },
    { component: <FichiersCard />, title: 'Fichiers' },
    { component: <IntegrationsCard />, title: 'Intégrations' },
    { component: <RendezVousCard />, title: 'Rendez-vous' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % cards.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [cards.length]);

  return (
    <div className="h-full flex flex-col relative z-10 overflow-y-auto">
      <motion.div
        className="mb-6 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold text-white mb-2">
          Découvrez DevLink CRM
        </h2>
        <p className="text-sm text-white/70">
          Toutes les fonctionnalités pour booster votre business
        </p>
      </motion.div>

      <div className="flex-1 space-y-4 min-h-0">
        <motion.div
          key={activeCard}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
        >
          {cards[activeCard].component}
        </motion.div>

        <div className="flex justify-center gap-2 py-4">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveCard(index)}
              className={`h-2 rounded-full transition-all ${
                index === activeCard
                  ? 'w-8 bg-white'
                  : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
