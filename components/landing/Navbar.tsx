'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/types/utils';
import { Menu, X, ArrowRight, User, Rocket, Play } from 'lucide-react';

// Animation variants
import type { Variants, Transition } from 'framer-motion';

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    } as Transition,
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    } as Transition,
  },
};

const item: Variants = {
  hidden: { y: -20, opacity: 0 },
  show: { 
    y: 0, 
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
  exit: { y: -20, opacity: 0 },
};

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { 
      href: '#features', 
      label: 'Fonctionnalités',
      icon: '✨'
    },
    { 
      href: '#pricing', 
      label: 'Tarifs',
      icon: '💰'
    },
    { 
      href: '#contact', 
      label: 'Contact',
      icon: '📞'
    },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={cn(
        'fixed top-0 w-full z-50 transition-all duration-500',
        scrolled
          ? 'bg-background/90 backdrop-blur-md border-b border-border/40 shadow-lg shadow-black/5'
          : 'bg-transparent'
      )}
    >
      <div className="w-full max-w-7xl mx-auto h-20 flex items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Logo à gauche */}
        <div className="flex-shrink-0">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative"
          >
            <Link href="/" className="flex items-center space-x-2 group">
              <motion.span 
                className="text-xl font-extrabold bg-gradient-to-r from-blue-500 via-blue-950 to-blue-500 bg-clip-text text-transparent"
                whileHover={{ 
                  backgroundImage: 'linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899)',
                  transition: { duration: 0.5 }
                }}
              >
                DevLink
              </motion.span>
              <motion.span 
                className="absolute -right-12 -top-1 text-xs font-bold bg-gradient-to-r from-blue-500 via-blue-950 to-blue-500 text-white px-2 py-0.5 rounded-full"
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
                CRM
              </motion.span>
            </Link>
          </motion.div>
        </div>

        {/* Navigation centrée */}
        <div className="hidden md:flex items-center justify-center flex-1">
          <nav className="flex items-center space-x-1 lg:space-x-6">
            {links.map((link, index) => (
              <motion.div
                key={link.href}
                initial="hidden"
                animate="show"
                variants={item}
                custom={index}
                className="relative group"
              >
                <Link
                  href={link.href}
                  className="relative px-4 py-2.5 text-base font-medium text-blue-900 hover:text-blue-700 transition-all duration-300 rounded-lg group"
                >
                  <span className="flex justify-start items-center gap-2">
                    <span className="text-base transition-transform duration-300 group-hover:scale-110">{link.icon}</span>
                    <span className="relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-500 after:scale-x-0 after:origin-left after:transition-transform after:duration-300 group-hover:after:scale-x-100">
                      {link.label}
                    </span>
                  </span>
                  <span className="absolute inset-0 bg-blue-50 rounded-lg scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 -z-10"></span>
                </Link>
              </motion.div>
            ))}
          </nav>
        </div>

        {/* Boutons à droite */}
        <div className="hidden md:flex space-x-4">
          <motion.div 
            whileHover={{ 
              scale: 1.03,
              boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4), 0 10px 10px -5px rgba(59, 130, 246, 0.2)'
            }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="outline"
              asChild
              className="group relative overflow-hidden border-2 border-blue-500 text-blue-700 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-600 px-6 py-2.5 text-sm font-medium transition-all duration-300 rounded-lg bg-white/80 backdrop-blur-sm"
            >
              <Link href="https://calendly.com/votre-compte" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <Play className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                <span>Demander une démo</span>
                <span className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-blue-600/20 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </Link>
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="ghost"
              asChild
              className="group relative overflow-hidden px-5 py-2.5 text-base font-medium text-blue-700 hover:text-blue-800 hover:bg-blue-50 transition-all duration-300 rounded-lg"
            >
              <Link href="/auth/login" className="flex items-center gap-2">
                <User className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                <span>Connexion</span>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-full group-hover:translate-x-full"></span>
              </Link>
            </Button>
          </motion.div>
          
          <motion.div 
            whileHover={{ 
              scale: 1.03,
              boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4), 0 10px 10px -5px rgba(59, 130, 246, 0.2)'
            }}
            whileTap={{ scale: 0.98 }}
            className="relative"
          >
            <Button
              asChild
              className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow-lg shadow-blue-500/30 px-6 py-2.5 text-sm font-medium transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 rounded-lg"
            >
              <Link href="/auth/register" className="flex items-center gap-2">
                <Rocket className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                <span>Essai gratuit</span>
                <span className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/40 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-full group-hover:translate-x-[200%] w-[50%] skew-x-[-20deg]"></span>
              </Link>
            </Button>
            <motion.div 
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut'
              }}
            />
          </motion.div>
        </div>

        {/* Mobile Menu Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="md:hidden p-2.5 rounded-lg bg-background/50 backdrop-blur-sm border border-border/30 shadow-sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <AnimatePresence mode="wait">
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-foreground" />
            ) : (
              <Menu className="w-5 h-5 text-foreground" />
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            ref={menuRef}
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: 'auto', 
              opacity: 1,
              transition: { 
                height: { duration: 0.3, ease: 'easeInOut' },
                opacity: { duration: 0.2, delay: 0.1 }
              }
            }}
            exit={{ 
              height: 0, 
              opacity: 0,
              transition: { 
                height: { duration: 0.2 },
                opacity: { duration: 0.1 }
              }
            }}
            className="md:hidden bg-background/95 backdrop-blur-lg border-t border-border/30 overflow-hidden"
          >
            <motion.nav 
              variants={container}
              initial="hidden"
              animate="show"
              exit="exit"
              className="flex flex-col space-y-1 p-4"
            >
              {links.map((link, index) => (
                <motion.div key={link.href} variants={item} custom={index}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                  >
                    <span className="text-lg">{link.icon}</span>
                    <span className="font-medium">{link.label}</span>
                    <motion.span 
                      className="ml-auto text-muted-foreground/50"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </motion.span>
                  </Link>
                </motion.div>
              ))}
              
              <div className="border-t border-border/20 my-2"></div>
              
              <motion.div 
                variants={item} 
                custom={links.length}
                className="flex flex-col space-y-3 pt-2"
              >
                <Button 
                  variant="outline" 
                  asChild
                  className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Link href="/auth/login">
                    <User className="h-4 w-4" />
                    <span>Connexion</span>
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline"
                  className="w-full justify-center gap-2 border-2 border-blue-500 text-blue-700 hover:bg-blue-50 hover:text-blue-800 bg-white/80 backdrop-blur-sm"
                >
                  <Link href="https://calendly.com/votre-compte" target="_blank" rel="noopener noreferrer">
                    <Play className="h-4 w-4" />
                    <span>Demander une démo</span>
                  </Link>
                </Button>
                <Button 
                  asChild 
                  className="w-full justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md"
                >
                  <Link href="/auth/register">
                    <Rocket className="h-4 w-4" />
                    <span>Essai gratuit</span>
                  </Link>
                </Button>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

export default Navbar;
