'use client';

import { useEffect, useState } from 'react';

export function ClientSideTimestamp({ className }: { className?: string }) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // Fonction pour formater l'heure actuelle
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    };

    // Mettre à jour immédiatement
    updateTime();

    // Mettre à jour toutes les secondes
    const interval = setInterval(updateTime, 1000);

    // Nettoyer l'intervalle lors du démontage
    return () => clearInterval(interval);
  }, []);

  // Ne rien afficher pendant le rendu côté serveur
  if (typeof window === 'undefined') {
    return <span className={className}></span>;
  }

  return <span className={className}>{currentTime}</span>;
}
