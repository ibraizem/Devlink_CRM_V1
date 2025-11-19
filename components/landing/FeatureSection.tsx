'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/types/utils';
import { ReactNode } from 'react';

interface FeatureSectionProps {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  icon: LucideIcon;
  gradient: string;
  iconColor: string;
  bgColor: string;
  reverse?: boolean;
  children?: ReactNode;
  badge?: {
    text: string;
    stat: string;
  };
}

export default function FeatureSection({
  id,
  title,
  subtitle,
  description,
  features,
  icon: Icon,
  gradient,
  iconColor,
  bgColor,
  reverse = false,
  children,
  badge,
}: FeatureSectionProps) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section
      id={id}
      className="relative py-16 md:py-20 overflow-hidden bg-gradient-to-b from-white via-blue-50/30 to-white"
    >
      {/* Background elements - matching existing sections */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(99,102,241,0.08),transparent_70%)]" />
        <motion.div
          className={cn(
            'absolute w-80 h-80 rounded-full filter blur-3xl opacity-20',
            reverse ? '-right-20 top-20' : '-left-20 top-20',
            bgColor.replace('bg-', 'bg-')
          )}
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div
          ref={ref}
          className={cn(
            'grid md:grid-cols-2 gap-12 lg:gap-16 items-center',
            reverse && 'md:grid-flow-dense'
          )}
        >
          {/* Content Side */}
          <motion.div
            className={cn('space-y-6', reverse && 'md:col-start-2')}
            initial={{ opacity: 0, x: reverse ? 50 : -50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Badge */}
            {badge && (
              <motion.div
                className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-100 border border-blue-200 mb-4"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={inView ? { scale: 1, opacity: 1 } : {}}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <Icon className={cn('w-4 h-4 mr-2', iconColor)} />
                <span className="text-xs font-semibold text-blue-600">
                  {badge.text}
                </span>
                <span className="mx-2 text-blue-300">•</span>
                <span className="text-xs font-bold text-blue-700">
                  {badge.stat}
                </span>
              </motion.div>
            )}

            {/* Title - matching Hero and Pricing style */}
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-blue-950 to-blue-500">
                {title}
              </h2>
              <p className="text-lg md:text-xl font-medium text-blue-600 mb-4">
                {subtitle}
              </p>
            </div>

            {/* Description */}
            <p className="text-base text-gray-600 leading-relaxed mb-6">
              {description}
            </p>

            {/* Features List */}
            <ul className="space-y-3 mb-6">
              {features.map((feature, index) => (
                <motion.li
                  key={index}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                >
                  <div
                    className={cn(
                      'w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                      bgColor
                    )}
                  >
                    <svg
                      className={cn('w-4 h-4', iconColor)}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700 leading-relaxed">
                    {feature}
                  </span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Visual Side (SidePanel or custom content) */}
          <motion.div
            className={cn('relative', reverse && 'md:col-start-1')}
            initial={{ opacity: 0, x: reverse ? -50 : 50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </div>
    </section>
  );
}