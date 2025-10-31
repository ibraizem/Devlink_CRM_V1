'use client'

import React from 'react'
import { motion, AnimatePresence, Variants, Transition } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import * as Card from '@/components/ui/card'
import { cn } from '@/lib/types/utils'
import { 
  ArrowRight, 
  MessageSquare, 
  UserPlus, 
  Clock, 
  Zap, 
  PieChart, 
  Lock, 
  Sparkles 
} from 'lucide-react'


function Features() {
  const features = [
    {
      icon: MessageSquare,
      title: 'Appels intégrés',
      description: 'Connectez vos numéros OnOff, Aircall ou SIP Trunk VoIP et passez vos appels directement depuis la plateforme.',
      color: 'from-blue-500 to-blue-950',
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      icon: UserPlus,
      title: 'Gestion des leads',
      description: 'Centralisez, segmentez et suivez vos prospects en temps réel avec un système de scoring intelligent.',
      color: 'from-purple-500/20 to-purple-600/10',
      iconColor: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      icon: Clock,
      title: 'Rendez-vous',
      description: 'Planifiez vos appels de closing avec l\'intégration Calendly et réduisez les allers-retours inutiles.',
      color: 'from-emerald-500/20 to-emerald-600/10',
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      icon: Zap,
      title: 'Automatisations',
      description: 'Automatisez vos relances, SMS et emails pour ne plus jamais perdre un lead de vue.',
      color: 'from-amber-500/20 to-amber-600/10',
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      icon: PieChart,
      title: 'Tableaux de bord',
      description: 'Visualisez les performances de votre équipe avec des KPI en temps réel et des rapports intuitifs.',
      color: 'from-rose-500/20 to-rose-600/10',
      iconColor: 'text-rose-500',
      bgColor: 'bg-rose-50 dark:bg-rose-900/20',
    },
    {
      icon: Lock,
      title: 'Sécurité avancée',
      description: 'Authentification forte, RLS Supabase et contrôle d\'accès granulaire pour une sécurité maximale.',
      color: 'from-cyan-500/20 to-cyan-600/10',
      iconColor: 'text-cyan-500',
      bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    },
  ]

  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      } as Transition,
    },
  };

  const item: Variants = {
    hidden: { y: 30, opacity: 0 },
    show: { 
      y: 0, 
      opacity: 1, 
      transition: { 
        duration: 0.6,
        ease: 'easeOut'
      } as Transition
    },
  };

  return (
    <section
      id="features"
      className="relative py-28 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-50"
    >
      {/* Arrière-plan animé */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(99,102,241,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
        
        {/* Particules animées */}
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-blue-400/20"
            initial={{
              x: Math.random() * 100,
              y: Math.random() * 100,
              scale: Math.random() * 0.5 + 0.5,
              opacity: Math.random() * 0.3 + 0.1
            }}
            animate={{
              y: [null, -20, 0],
              x: [null, Math.random() * 20 - 10, 0],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
            style={{
              width: Math.random() * 300 + 100,
              height: Math.random() * 300 + 100,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              filter: 'blur(40px)'
            }}
          />
        ))}
      </div>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Titre de section */}
        <motion.div
          className="text-center max-w-4xl mx-auto mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
          ref={ref}
        >
          <motion.div 
            className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-blue-100 border border-blue-200 mb-6"
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Zap className="w-4 h-4 text-blue-500 dark:text-blue-400 mr-2" />
            <span className="text-xs text-blue-500 dark:text-blue-400">Tout ce dont vous avez besoin pour convertir plus de Prospects en clients.</span>
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-blue-950 to-blue-500 dark:from-white dark:via-gray-200 dark:to-gray-400">
            Fonctionnalités clés
          </h2>
          <p className="text-sm text-blue-500 max-w-2xl mx-auto leading-relaxed text-center">
            Une solution complète pour booster vos performances et automatiser votre prospection commerciale.
          </p>
        </motion.div>
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto"
          variants={container}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
        >
          <AnimatePresence>
            {features.map((feature, index) => {
              const Icon = feature.icon;
              
              return (
                <motion.div
                  key={index}
                  variants={item}
                  className="h-full"
                >
                  <Card.Card className="relative h-full group overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1">
                    <div className="relative p-8 h-full flex flex-col">
                      {/* Icône avec fond coloré */}
                      <div className={cn(
                        "w-16 h-16 rounded-2xl mb-6 mx-auto flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                        feature.bgColor
                      )}>
                        <Icon className={`w-8 h-8 ${feature.iconColor} transition-transform duration-300 group-hover:scale-110`} />
                      </div>  

                      <h3 className="text-xl font-semibold mb-4 text-gray-900 text-center">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed text-center mb-6">
                        {feature.description}
                      </p>
                        </div>
                      <div className="h-0.5 w-10 bg-gradient-to-r from-transparent via-current to-transparent opacity-50 mx-auto group-hover:w-20 transition-all duration-500">
                      </div>
                  </Card.Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="mt-24 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <div className="max-w-2xl mx-auto bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-8 rounded-2xl border border-border/50 shadow-lg">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/30 shadow-sm">
              <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Prêt à booster votre prospection ?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Essayez gratuitement notre plateforme pendant 14 jours et découvrez comment nous pouvons transformer votre processus de vente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                href="/auth/register"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 group"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                Essai gratuit de 14 jours
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </motion.a>
              <motion.a
                href="#contact"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-border bg-blue-200 text-foreground font-medium hover:bg-accent/50 transition-colors"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                Parler à un expert
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Features;
