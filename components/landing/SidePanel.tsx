'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/types/utils';
import { ReactNode } from 'react';

interface SidePanelProps {
  imageSrc?: string;
  imageAlt?: string;
  badge?: {
    icon?: ReactNode;
    text: string;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };
  stats?: {
    label: string;
    value: string;
    trend?: string;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };
  gradient?: string;
  children?: ReactNode;
}

export default function SidePanel({
  imageSrc,
  imageAlt = 'Feature screenshot',
  badge,
  stats,
  gradient = 'from-blue-500 to-blue-600',
  children,
}: SidePanelProps) {
  const getBadgePosition = (position?: string) => {
    switch (position) {
      case 'top-left':
        return 'top-6 left-6';
      case 'top-right':
        return 'top-6 right-6';
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'bottom-right':
        return 'bottom-6 right-6';
      default:
        return 'bottom-6 left-6';
    }
  };

  const getStatsPosition = (position?: string) => {
    switch (position) {
      case 'top-left':
        return 'top-6 left-6';
      case 'top-right':
        return 'top-6 right-6';
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'bottom-right':
        return 'bottom-6 right-6';
      default:
        return 'top-1/4 right-6';
    }
  };

  return (
    <div className="relative w-full h-full min-h-[400px] md:min-h-[500px]">
      {/* Window Frame - matching existing design */}
      <motion.div
        className="relative w-full h-full rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white"
        whileHover={{ scale: 1.01, y: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Window Controls - subtle style */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gray-50 border-b border-gray-200 flex items-center px-3 gap-1.5 z-10">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-400/80"></div>
          </div>
        </div>

        {/* Content */}
        <div className="relative w-full h-full pt-8">
          {imageSrc ? (
            <>
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                className="object-cover object-top"
                quality={90}
              />
              {/* Overlay gradient */}
              <div
                className={cn(
                  'absolute inset-0 bg-gradient-to-t from-gray-900/20 via-transparent to-transparent pointer-events-none'
                )}
              ></div>
            </>
          ) : (
            children
          )}

          {/* Floating Badge */}
          {badge && (
            <motion.div
              className={cn(
                'absolute bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2',
                getBadgePosition(badge.position)
              )}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              {badge.icon && <div className="flex-shrink-0">{badge.icon}</div>}
              <span className="text-sm font-medium text-gray-800">
                {badge.text}
              </span>
            </motion.div>
          )}

          {/* Floating Stats */}
          {stats && (
            <motion.div
              className={cn(
                'absolute bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg w-40',
                getStatsPosition(stats.position)
              )}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.7, type: 'spring', stiffness: 100 }}
              whileHover={{ y: -5 }}
            >
              <div className="text-xs text-blue-600 font-medium mb-1">
                {stats.label}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-800">
                  {stats.value}
                </span>
                {stats.trend && (
                  <span className="text-xs text-green-500 font-medium">
                    {stats.trend}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Decorative floating elements */}
      <motion.div
        className={cn(
          'absolute -bottom-10 -left-10 w-40 h-40 rounded-full filter blur-3xl -z-10 bg-gradient-to-r',
          gradient,
          'opacity-20'
        )}
        animate={{
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className={cn(
          'absolute -top-10 -right-10 w-60 h-60 rounded-full filter blur-3xl -z-10 bg-gradient-to-r',
          gradient,
          'opacity-15'
        )}
        animate={{
          y: [0, 20, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
          delay: 1,
        }}
      />
    </div>
  );
}