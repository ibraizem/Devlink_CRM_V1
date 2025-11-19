"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/types/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";

function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "5€",
      period: "mois",
      description: "Idéal pour les freelances et petites structures",
      features: [
        "1 utilisateur inclus",
        "Jusqu’à 500 leads actifs",
        "Appels et SMS intégrés",
        "Tableaux de bord de base",
        "Support par email"
      ],
      cta: "Commencer",
      popular: false,
    },
    {
      name: "Team",
      price: "9€",
      period: "mois / utilisateur",
      description: "La solution préférée des équipes commerciales",
      features: [
        "Jusqu’à 20 utilisateurs",
        "Leads illimités",
        "Appels, SMS & emails intégrés",
        "Rapports et KPI avancés",
        "Intégration Calendly & Outlook",
        "Support prioritaire"
      ],
      cta: "Essai gratuit 14j",
      popular: true,
    },
    {
      name: "Business",
      price: "19€",
      period: "mois / utilisateur",
      description: "Solution sur mesure pour call centers et agences",
      features: [
        "Utilisateurs illimités",
        "Infrastructure dédiée",
        "API complète & intégrations custom",
        "Support 24/7",
        "Formation & onboarding inclus",
        "Développements sur mesure"
      ],
      cta: "Commencer",
      popular: false,
    },
  ];

  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  return (
    <section 
      id="pricing" 
      className="relative py-24 bg-gradient-to-b from-background via-white to-blue-50/50 overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30" />
        
        {/* Animated blobs */}
        <motion.div 
          className="absolute -left-20 -top-20 w-96 h-96 rounded-full bg-blue-100/30 filter blur-3xl"
          animate={{
            y: [0, -30, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
        <motion.div 
          className="absolute -right-20 bottom-0 w-80 h-80 rounded-full bg-purple-100/30 filter blur-3xl"
          animate={{
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          ref={ref}
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-blue-500 via-blue-950 to-blue-500 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
            Des tarifs simples, clairs et évolutifs
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Débutez gratuitement et faites évoluer votre CRM en fonction de votre croissance.
            Aucune carte de crédit requise pour commencer.
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-3 gap-8 w-full"
          variants={container}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
        >
          <AnimatePresence>
            {plans.map((plan, index) => (
              <motion.div 
                key={plan.name} 
                className="relative group"
                variants={item}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                {plan.popular && (
                  <motion.div 
                    className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-blue-950 text-white text-xs font-medium px-4 py-1.5 rounded-full shadow-lg flex items-center z-10"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <Zap className="w-3 h-3 mr-1.5 fill-yellow-300 text-yellow-300" />
                    <span>Le plus populaire</span>
                  </motion.div>
                )}

                <Card
                  className={cn(
                    "h-full flex flex-col relative border border-border/60 backdrop-blur-md bg-white/80 dark:bg-card/80 transition-all hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-500/10",
                    plan.popular ? "ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/10 dark:shadow-blue-500/5" : "hover:border-blue-300/50 dark:hover:border-blue-500/30"
                  )}
                >
                  <CardHeader className="pb-4 text-center relative">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-blue-950 to-blue-500 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                      {plan.name}
                    </CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold bg-gradient-to-r from-blue-500 via-blue-950 to-blue-500 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-muted-foreground">/{plan.period}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                  </CardHeader>

                  <CardContent className="flex-grow py-0">
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <motion.li 
                          key={i} 
                          className="flex items-start text-sm group"
                          whileHover={{ x: 5 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        >
                          <Check className="w-5 h-5 text-green-500 mr-2.5 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                          <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-8 pb-6 px-6">
                    <Button
                      className={cn(
                        "w-full py-5 text-base font-medium transition-all group relative overflow-hidden",
                        plan.popular 
                          ? "bg-gradient-to-r from-blue-500 via-blue-950 to-blue-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30" 
                          : "bg-gradient-to-r from-blue-500 via-blue-950 to-blue-600 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500/50 hover:bg-gray-50 dark:hover:bg-gray-800/80"
                      )}
                      size="lg"
                      asChild
                    >
                      <a
                        href={plan.name === "Business" ? "#contact" : "/auth/register"}
                        className="relative z-10 flex items-center justify-center gap-2"
                      >
                        {plan.cta}
                        <ArrowRight className={cn(
                          "w-4 h-4 transition-transform duration-300",
                          plan.popular ? "group-hover:translate-x-1" : "group-hover:translate-x-1 text-blue-600 dark:text-blue-400"
                        )} />
                        {plan.popular && (
                          <span className="absolute inset-0 bg-gradient-to-r from-blue-700/20 to-purple-700/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-md" />
                        )}
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <motion.div 
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-900/50 mb-6">
            <motion.div 
              className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-300 mr-3"
              initial={{ scale: 0.8 }}
              animate={inView ? { scale: 1 } : {}}
              transition={{ duration: 0.4 }}
            >
              <Zap className="w-4 h-4" />
            </motion.div>
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">14 jours d'essai gratuit — sans carte bancaire</p>
          </div>
          
          <p className="text-muted-foreground">
            Besoin d'une offre personnalisée ?{' '}
            <a 
              href="#contact" 
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors inline-flex items-center group"
            >
              Contactez-nous
              <motion.span 
                className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1"
                initial={{ scale: 0.8 }}
                animate={inView ? { scale: 1 } : {}}
                transition={{ duration: 0.4 }}
              >
                <ArrowRight className="w-4 h-4" />
              </motion.span>
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default Pricing;
