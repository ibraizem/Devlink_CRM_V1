'use client'

import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { motion } from 'framer-motion'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Chargement dynamique pour éviter le rendu côté serveur
const AnimatedParticles = dynamic(
  () => import('@/components/landing/AnimatedParticles'),
  { ssr: false }
)

function Hero() {
  return (
    <section className="relative flex flex-col md:flex-row items-center justify-between min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 overflow-hidden">
      {/* Arrière-plan animé */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(99,102,241,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
        
        {/* Composant de particules animées côté client uniquement */}
      <AnimatedParticles />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-16 md:py-24 flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Bloc texte */}
        <motion.div 
          className="max-w-2xl text-center md:text-left space-y-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight text-gray-900"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Le CRM conçu pour la{' '}
            <span className="bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
              téléprospection
            </span>
          </motion.h1>

          <motion.p 
            className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto md:mx-0 leading-relaxed"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Centralisez vos leads, gérez vos appels et optimisez votre prospection avec une interface intuitive et des outils puissants conçus pour les professionnels exigeants.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Link href="/auth/register" passHref>
              <Button 
                size="lg"
                className="group justify-center relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:from-blue-700 hover:to-blue-800 px-8 py-6 text-lg transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-xl w-full sm:w-auto"
                asChild
              >
                <div>
                  <span className="relative z-10 flex items-center gap-2">
                    <span>🚀</span>
                    <span>Essai gratuit - 14 jours</span>
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </div>
              </Button>
            </Link>
          </motion.div>

          <motion.div 
            className="pt-6 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 text-sm text-blue-700/80"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div className="flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className="w-9 h-9 rounded-full bg-white border-2 border-white shadow-md flex items-center justify-center text-xs font-medium text-blue-700 transition-transform hover:scale-110 hover:z-10"
                  style={{
                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                    zIndex: i
                  }}
                >
                  {i === 3 ? '+50' : `U${i}`}
                </div>
              ))}
            </div>
            <span className="text-center md:text-left">Rejoignez plus de <span className="font-semibold">50 entreprises</span> qui nous font confiance</span>
          </motion.div>
        </motion.div>

        {/* Bloc image illustrative */}
        <motion.div 
          className="relative w-full md:w-[55%] flex justify-center items-center mt-12 md:mt-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <motion.div 
            className="relative w-full max-w-[600px] h-[320px] sm:h-[380px] md:h-[480px] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-white/30 backdrop-blur-sm transform transition-all duration-500 hover:shadow-blue-200/50 hover:border-blue-100/70"
            whileHover={{ scale: 1.01 }}
          >
            <Image
              src="/images/hero-dashboard.jpeg"
              alt="Tableau de bord du CRM Devlink"
              fill
              className="object-cover object-top"
              priority
              quality={90}
            />
            
            {/* Overlay de dégradé */}
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/30 via-transparent to-transparent pointer-events-none"></div>
            
            {/* Badge flottant */}
            <motion.div 
              className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-800">En ligne maintenant</span>
            </motion.div>

            {/* Éléments interactifs sur l'image */}
            <motion.div 
              className="absolute top-1/4 right-6 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg w-40"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1, type: 'spring', stiffness: 100 }}
              whileHover={{ y: -5 }}
            >
              <div className="text-xs text-blue-600 font-medium mb-1">Nouveaux leads</div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-gray-800">740</span>
                <span className="text-xs text-green-500 font-medium">+17%</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Éléments décoratifs flottants */}
          <motion.div 
            className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-400/10 rounded-full filter blur-3xl -z-10"
            animate={{
              y: [0, -20, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute -top-20 -right-20 w-80 h-80 bg-purple-400/10 rounded-full filter blur-3xl -z-10"
            animate={{
              y: [0, 20, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: 1
            }}
          />
        </motion.div>
      </div>
    </section>
  )
}

export default Hero;