'use client'

import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Sparkles, TrendingUp, Zap, ArrowRight, Phone, Mail, MessageSquare, Database } from 'lucide-react'

function Hero() {
  const stats = [
    { value: '10K+', label: 'Leads gérés', icon: Database },
    { value: '4', label: 'Canaux intégrés', icon: MessageSquare },
    { value: '92%', label: 'Taux de satisfaction', icon: TrendingUp },
  ];

  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-b from-white via-blue-50/30 to-white overflow-hidden">
      {/* Arrière-plan animé - cohérent avec les autres sections */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(99,102,241,0.08),transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
        
        {/* Blobs animés */}
        <motion.div
          className="absolute -left-20 top-20 w-80 h-80 bg-blue-100 rounded-full filter blur-3xl opacity-20"
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
        <motion.div
          className="absolute -right-20 bottom-20 w-96 h-96 bg-purple-100 rounded-full filter blur-3xl opacity-15"
          animate={{
            y: [0, 20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
            delay: 1,
          }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 py-20 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Bloc texte */}
          <motion.div 
            className="space-y-6 text-center md:text-left"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >

            {/* Titre */}
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-blue-950 to-blue-500">
                Prospection intelligente
              </span>
              {' '}pour gérer{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-blue-950 to-blue-500">
                des milliers de leads
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p 
              className="text-base md:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto md:mx-0"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Campagnes d'appels sortants/entrants avec VoIP intégré, automatisation email/SMS/WhatsApp et enrichissement AI. La solution tout-en-un pour votre prospection à grande échelle.
            </motion.p>

            {/* Canaux */}
            <motion.div
              className="flex flex-wrap gap-2 justify-center md:justify-start"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              {[
                { icon: Phone, label: 'Appels VoIP', color: 'bg-blue-50 text-blue-600' },
                { icon: Mail, label: 'Email', color: 'bg-purple-50 text-purple-600' },
                { icon: MessageSquare, label: 'SMS', color: 'bg-green-50 text-green-600' },
                { icon: MessageSquare, label: 'WhatsApp', color: 'bg-emerald-50 text-emerald-600' },
              ].map((channel, index) => (
                <motion.div
                  key={channel.label}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${channel.color} text-xs font-medium`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <channel.icon className="w-3.5 h-3.5" />
                  <span>{channel.label}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Boutons CTA */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start pt-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <Button 
                size="lg"
                className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 px-6 py-3 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30"
                asChild
              >
                <Link href="/auth/register" className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>Essai gratuit - 14 jours</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              
              <Button 
                size="lg"
                variant="outline"
                className="group border-2 border-blue-500 text-blue-700 hover:bg-blue-50 hover:border-blue-600 px-6 py-3 transition-all duration-300"
                asChild
              >
                <Link href="https://calendly.com/votre-compte" target="_blank" rel="noopener noreferrer">
                  Demander une démo
                </Link>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="pt-4 flex flex-wrap gap-6 justify-center md:justify-start"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              {stats.map((stat, index) => (
                <div key={stat.label} className="text-center md:text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <stat.icon className="w-4 h-4 text-blue-500" />
                    <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-700">
                      {stat.value}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Bloc visuel - cohérent avec les autres sections */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="relative w-full h-[500px] md:h-[550px]">
              {/* Window Frame - matching SidePanel style */}
              <motion.div
                className="relative w-full h-full rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white"
                whileHover={{ scale: 1.01, y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {/* Window Controls */}
                <div className="absolute top-0 left-0 right-0 h-8 bg-gray-50 border-b border-gray-200 flex items-center px-3 gap-1.5 z-10">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400/80"></div>
                  </div>
                </div>

                {/* Content */}
                <div className="relative w-full h-full pt-8 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                  <div className="space-y-3 h-full flex flex-col justify-center">
                    {/* Dashboard Header */}
                    <div className="bg-white rounded-lg shadow-sm p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-800">Dashboard en temps réel</h3>
                        <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 rounded p-3">
                          <div className="text-xs text-gray-600 mb-1">Leads actifs</div>
                          <div className="text-2xl font-bold text-gray-800">10,234</div>
                          <div className="flex items-center gap-1 text-xs text-green-500 font-medium">
                            <TrendingUp className="w-3 h-3" />
                            <span>+23%</span>
                          </div>
                        </div>
                        <div className="bg-purple-50 rounded p-3">
                          <div className="text-xs text-gray-600 mb-1">Conversions</div>
                          <div className="text-2xl font-bold text-gray-800">1,847</div>
                          <div className="flex items-center gap-1 text-xs text-green-500 font-medium">
                            <TrendingUp className="w-3 h-3" />
                            <span>+18%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Campaigns */}
                    <div className="bg-white rounded-lg shadow-sm p-3 border border-blue-200">
                      <div className="text-xs font-semibold text-gray-800 mb-2">Campagnes actives</div>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { icon: Phone, count: '1.2K', color: 'bg-blue-50 text-blue-600' },
                          { icon: Mail, count: '3.4K', color: 'bg-purple-50 text-purple-600' },
                          { icon: MessageSquare, count: '2.8K', color: 'bg-green-50 text-green-600' },
                          { icon: MessageSquare, count: '1.5K', color: 'bg-emerald-50 text-emerald-600' },
                        ].map((item, i) => (
                          <div key={i} className={`${item.color} rounded p-2 text-center`}>
                            <item.icon className="w-3 h-3 mx-auto mb-1" />
                            <div className="text-xs font-bold">{item.count}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Badge */}
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-3 text-center"
                      animate={{
                        scale: [1, 1.02, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: 'reverse',
                      }}
                    >
                      <div className="flex items-center justify-center gap-2 text-sm font-medium">
                        <Sparkles className="w-4 h-4" />
                        <span>Enrichissement AI activé</span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Decorative elements */}
              <motion.div
                className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-200 rounded-full filter blur-3xl opacity-30 -z-10"
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
                className="absolute -top-10 -right-10 w-60 h-60 bg-purple-200 rounded-full filter blur-3xl opacity-20 -z-10"
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
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Hero;