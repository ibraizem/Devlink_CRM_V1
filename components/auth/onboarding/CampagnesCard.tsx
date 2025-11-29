'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Users, Target, ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';

export function CampagnesCard() {
  const [stats, setStats] = useState({
    active: 0,
    reached: 0,
    conversion: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats({
        active: Math.floor(Math.random() * 12) + 3,
        reached: Math.floor(Math.random() * 5000) + 15000,
        conversion: Math.floor(Math.random() * 15) + 25,
      });
    }, 3000);

    setStats({
      active: 8,
      reached: 18542,
      conversion: 32,
    });

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 backdrop-blur-sm border border-white/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-5 w-5 text-purple-300" />
            <h3 className="text-lg font-semibold text-white">Campagnes</h3>
          </div>
          <p className="text-sm text-white/70">Gérez vos actions marketing</p>
        </div>
        <motion.div
          className="rounded-full bg-purple-400/20 p-2"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <TrendingUp className="h-4 w-4 text-purple-300" />
        </motion.div>
      </div>

      <div className="space-y-3">
        <motion.div
          className="flex items-center justify-between p-3 rounded-lg bg-white/5 backdrop-blur-sm"
          animate={{ x: [0, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <Target className="h-4 w-4 text-white" />
              </motion.div>
            </div>
            <div>
              <p className="text-xs font-medium text-white/80">Campagnes actives</p>
              <motion.p
                className="text-lg font-bold text-white"
                key={stats.active}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {stats.active}
              </motion.p>
            </div>
          </div>
          <ArrowUp className="h-4 w-4 text-green-400" />
        </motion.div>

        <motion.div
          className="flex items-center justify-between p-3 rounded-lg bg-white/5 backdrop-blur-sm"
          animate={{ x: [0, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-white/80">Prospects atteints</p>
              <motion.p
                className="text-lg font-bold text-white"
                key={stats.reached}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {stats.reached.toLocaleString('fr-FR')}
              </motion.p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="flex items-center justify-between p-3 rounded-lg bg-white/5 backdrop-blur-sm"
          animate={{ x: [0, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-white/80">Taux de conversion</p>
              <motion.p
                className="text-lg font-bold text-white"
                key={stats.conversion}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {stats.conversion}%
              </motion.p>
            </div>
          </div>
          <ArrowUp className="h-4 w-4 text-green-400" />
        </motion.div>
      </div>

      <motion.div
        className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-purple-400/20 blur-2xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />
    </motion.div>
  );
}
