'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Mail, MessageSquare, Phone, MapPin, Twitter, Linkedin, Github, Zap, ArrowRight } from 'lucide-react';

function Footer() {
  const currentYear = new Date().getFullYear();

  // Seulement les liens vers les pages existantes
  const links = [
    {
      title: 'Navigation',
      items: [
        { name: 'Accueil', href: '/' },
        { name: 'Fonctionnalités', href: '#features' },
        { name: 'Tarifs', href: '#pricing' },
        { name: 'Contact', href: '#contact' },
      ],
    },
    {
      title: 'Légal',
      items: [
        { name: 'Mentions légales', href: '/mentions-legales' },
        { name: 'Politique de confidentialité', href: '/confidentialite' },
        { name: 'CGU', href: '/cgu' },
      ],
    },
  ];

  const contactInfo = [
    { icon: Mail, text: 'contact@devlink-crm.com', href: 'mailto:contact@devlink-crm.com' },
    { icon: Phone, text: '+33 1 23 45 67 89', href: 'tel:+33123456789' },
    { icon: MapPin, text: '123 Rue de la République, 75001 Paris', href: 'https://maps.google.com' },
  ];

  const socialLinks = [
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'LinkedIn', icon: Linkedin, href: '#' },
    { name: 'GitHub', icon: Github, href: '#' },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-blue-500/5 via-blue-950/5 to-blue-500/5 border-t border-blue-500/10 backdrop-blur-sm">
      {/* Effets visuels */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        {/* Contenu principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Colonne Logo et description */}
          <div className="space-y-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative"
            >
              <Link href="/" className="flex items-center space-x-2 group">
                <motion.span 
                  className="text-2xl font-extrabold bg-gradient-to-r from-blue-500 via-blue-950 to-blue-500 bg-clip-text text-transparent"
                  whileHover={{ 
                    backgroundImage: 'linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899)',
                    transition: { duration: 0.5 }
                  }}
                >
                  DevLink CRM
                </motion.span>
                <motion.span 
                  className="absolute right-16 -top-1 text-xs font-bold bg-gradient-to-r from-blue-500 via-blue-950 to-blue-500 text-white px-2 py-0.5 rounded-full"
                  animate={{ 
                    scale: [1, 1.10, 1],
                    rotate: [1, 5, -5, 0],
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'easeInOut'
                  }}
                >
                  PRO
                </motion.span>
              </Link>
            </motion.div>
            <p className="text-blue-800 text-sm leading-relaxed">
              La solution tout-en-un pour gérer vos relations clients et booster votre productivité.
              Conçue pour les professionnels qui veulent exceller.
            </p>
            
            {/* Bouton CTA */}
            <Button 
              asChild 
              className="group mt-4 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-medium py-2 px-6 rounded-lg transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20"
            >
              <Link href="#contact">
                Nous contacter
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {/* Liens de navigation */}
          {links.map((section, index) => (
            <div key={index} className="space-y-4">
              <h3 className="text-sm font-semibold text-blue-500 uppercase tracking-wider">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <Link 
                      href={item.href}
                      className="text-blue-800 hover:text-blue-500 transition-colors text-sm flex items-start group"
                    >
                      <span className="h-px w-0 bg-blue-400 group-hover:w-4 mt-2.5 mr-2 transition-all duration-300"></span>
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-blue-500 uppercase tracking-wider">
              Contact
            </h3>
            <ul className="space-y-3">
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                return (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-blue-800" />
                    </div>
                    <a 
                      href={info.href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-3 text-sm text-blue-800 hover:text-blue-500 transition-colors"
                    >
                      {info.text}
                    </a>
                  </li>
                );
              })}
            </ul>

            {/* Réseaux sociaux */}
            <div className="pt-4">
              <h4 className="text-sm font-semibold text-blue-700 mb-3">Suivez-nous</h4>
              <div className="flex space-x-3">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <motion.a
                      key={index}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500 hover:bg-blue-500/20 text-white hover:text-white border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="sr-only">{social.name}</span>
                      <Icon className="h-4 w-4" />
                    </motion.a>
                )})}
              </div>
            </div>
          </div>
        </div>
        {/* Bas de page */}
        <div className="border-t border-blue-500/10 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm text-center md:text-left">
            &copy; {currentYear} DevLink Provider. Tous droits réservés.
          </p>
          <div className="mt-4 md:mt-0 flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/mentions-legales" className="text-gray-500 hover:text-white text-xs transition-colors">
              Mentions légales
            </Link>
            <Link href="/confidentialite" className="text-gray-500 hover:text-white text-xs transition-colors">
              Politique de confidentialité
            </Link>
            <Link href="/cgu" className="text-gray-500 hover:text-white text-xs transition-colors">
              Conditions générales
            </Link>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
              Version 2.0.0
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
