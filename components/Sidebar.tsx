'use client';

import { cn } from '@/lib/types/utils';
import { Home, Users, FileText, Calendar, ChevronLeft, Menu, X, LucideProps, Phone, CheckSquare, FileUp } from 'lucide-react';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { memo, useState, useEffect, useCallback, useRef, forwardRef } from 'react';
import dynamic from 'next/dynamic';

// Types
type MenuItemType = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  gradient: string;
};

interface MenuItemProps {
  item: MenuItemType;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

// Composant MenuItem avec forwardRef
const MenuItem = memo(forwardRef<HTMLAnchorElement, MenuItemProps>(({ 
  item, 
  isActive, 
  isCollapsed, 
  onClick 
}, ref) => {
  return (
    <motion.div 
      className={cn(
        'relative mx-2 mb-1 rounded-xl overflow-hidden',
        isCollapsed ? 'w-10' : 'w-[calc(100%-1rem)]'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        ref={ref}
        href={item.href}
        onClick={onClick}
        className={cn(
          'relative overflow-hidden',
          'flex items-center py-3 text-sm font-medium rounded-xl transition-all duration-200',
          'justify-start px-4',
          isActive && !isCollapsed
            ? 'text-blue-600 dark:text-white bg-blue-50 dark:bg-blue-900/20 shadow-md'
            : 'text-gray-700 hover:bg-white hover:shadow-md dark:text-gray-300 dark:hover:bg-gray-800',
          isCollapsed ? 'justify-center px-0 w-10' : 'w-full',
          'group relative overflow-hidden'
        )}
      >
        {isActive && !isCollapsed && (
          <motion.div 
            className="absolute inset-0 z-0 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/20"></div>
          </motion.div>
        )}
        
        <motion.div 
          className={cn(
            'relative z-10 flex items-center justify-center rounded-xl p-2',
            isActive 
              ? isCollapsed 
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-white' 
                : 'text-blue-600 dark:text-white bg-blue-500/10'
              : 'text-gray-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-blue-900/20',
            isCollapsed ? 'w-9 h-9' : 'w-9 h-9 mr-3',
            'transition-colors duration-200'
          )}
          whileHover={!isActive ? { scale: 1.05 } : {}}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        >
          <item.icon className="h-5 w-5" />
        </motion.div>
        
        <motion.span 
          className={cn(
            'relative z-10 transition-all duration-300 font-medium',
            isActive ? 'text-blue-600 dark:text-white' : 'text-gray-700 group-hover:text-gray-900 dark:text-gray-300',
            isCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3',
            'whitespace-nowrap overflow-hidden'
          )}
        >
          {item.label}
        </motion.span>
        
        {isActive && !isCollapsed && (
          <motion.div 
            className={cn(
              'absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8',
              'bg-gradient-to-b from-blue-500 to-blue-600',
              'rounded-l-lg',
              'shadow-[0_0_10px_RGBA(59,130,246,0.5)]'
            )}
            layoutId="activeIndicator"
            initial={{ opacity: 0, scaleX: 0.5 }}
            animate={{ 
              opacity: 1, 
              scaleX: 1,
              height: '2rem'
            }}
            exit={{ opacity: 0, scaleX: 0.5 }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 30
            }}
          />
        )}
      </Link>
    </motion.div>
  );
}));

MenuItem.displayName = 'MenuItem';

// Hook personnalisé pour l'effet de vague au clic
const useRippleEffect = (ref: React.RefObject<HTMLElement>) => {
  const createRipple = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.classList.add('ripple');

    const existingRipples = button.getElementsByClassName('ripple');
    if (existingRipples.length > 0) {
      existingRipples[0].remove();
    }

    button.appendChild(ripple);

    const removeRipple = () => {
      ripple.style.opacity = '0';
      ripple.addEventListener('transitionend', () => ripple.remove());
    };

    setTimeout(removeRipple, 600);
  }, []);

  useEffect(() => {
    const button = ref.current;
    if (button) {
      // Utilisation de 'any' pour l'événement car il y a une incompatibilité entre les types d'événements
      button.addEventListener('click', createRipple as any);
      return () => {
        button.removeEventListener('click', createRipple as any);
      };
    }
  }, [createRipple, ref]);
};

// Chargement dynamique du composant UserMenu
const UserMenu = dynamic<{ isCollapsed: boolean }>(
  () => import('@/components/user/UserMenu'),
  { 
    ssr: false,
    loading: () => <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
  }
);

const menuItems = [
  { 
    icon: Home, 
    label: 'Dashboard', 
    href: '/dashboard',
    gradient: 'from-blue-500 to-blue-600'
  },
  { 
    icon: Users, 
    label: 'Leads', 
    href: '/leads',
    gradient: 'from-emerald-500 to-teal-600'
  },
  { 
    icon: FileUp, 
    label: 'Fichiers', 
    href: '/fichiers',
    gradient: 'from-amber-500 to-orange-500'
  },
  { 
    icon: Calendar, 
    label: 'Rendez-vous', 
    href: '/rendezvous',
    gradient: 'from-purple-500 to-indigo-600'
  },
  { 
    icon: FileText, 
    label: 'Rapports', 
    href: '/rapports',
    gradient: 'from-amber-500 to-orange-600'
  },
  { 
    icon: CheckSquare, 
    label: 'Analytics', 
    href: '/analytics',
    gradient: 'from-pink-500 to-rose-600'
  },
];

// Vérifie si on est sur un appareil mobile (SSR-safe)
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // This code will only run on the client side
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Set initial value
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  return isMobile;
}

// Main Sidebar component (client-side only)
function Sidebar() {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useIsMobile();
  
  // État initial pour éviter les problèmes d'hydratation
  const [isCollapsed, setIsCollapsed] = useState(true); // Valeur par défaut pour le SSR
  const [isClient, setIsClient] = useState(false);

  // Initialisation côté client uniquement
  useEffect(() => {
    setIsClient(true);
    setIsMounted(true);
    
    // Initialisation de l'état après le montage
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    } else {
      setIsCollapsed(isMobile);
    }
  }, [isMobile]);
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const controls = useAnimationControls();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
    }
  }, [isCollapsed]);

  useEffect(() => {
    if (isMobile && isMobileOpen) {
      const timer = setTimeout(() => {
        setIsMobileOpen(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [pathname, isMobile, isMobileOpen]);

  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
    }
  }, [isMobile]);

  const handleLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isMobile && isCollapsed) {
      e.preventDefault();
      if (!isMobileOpen) {
        setIsMobileOpen(true);
      }
    }
  }, [isMobile, isCollapsed, isMobileOpen]);

  // Ne rien rendre pendant le SSR ou avant l'initialisation du client
  if (!isClient) {
    return (
      <div className="fixed top-0 left-0 h-screen w-16 bg-white dark:bg-gray-900 shadow-lg z-40" />
    );
  }

  const mobileMenuButton = (
    <motion.div
      key="mobile-menu-button"
      className="md:hidden fixed top-4 left-4 z-50"
      initial={isMounted ? { opacity: 0, y: -10 } : false}
      animate={isMounted ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.2 }}
    >
      <motion.button
        onClick={() => {
          setIsMobileOpen(!isMobileOpen);
          controls.start({
            rotate: isMobileOpen ? 0 : 180,
            transition: { duration: 0.3 }
          });
        }}
        className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 transition-all group"
        whileHover={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
        }}
        whileTap={{ 
          scale: 0.95,
          backgroundColor: 'rgba(239, 246, 255, 0.8)'
        }}
        aria-label={isMobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        animate={controls}
      >
        <div className="relative w-4 h-4">
          <motion.div
            animate={isMobileOpen ? { opacity: 0, rotate: 90 } : { opacity: 1, rotate: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Menu className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
          </motion.div>
          <motion.div
            animate={isMobileOpen ? { opacity: 1, rotate: 0 } : { opacity: 0, rotate: -90 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
          </motion.div>
        </div>
      </motion.button>
    </motion.div>
  );

  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <>
      {isMobile && mobileMenuButton}
      <motion.div 
        className={cn(
          "flex flex-col h-screen bg-gradient-to-b from-white to-blue-50 border-r border-blue-100 fixed md:relative z-40 shadow-lg",
          isCollapsed ? "w-16" : "w-64",
          isMobile && !isMobileOpen && "-translate-x-full"
        )}
        initial={false}
        animate={{
          width: isCollapsed ? '4rem' : '16rem',
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
      >
        {/* En-tête */}
        <motion.div 
          className={cn("p-4 border-b border-blue-100 cursor-pointer")}
          initial={false}
          animate={{
            padding: isCollapsed ? '1rem 0.5rem' : '1rem',
          }}
          onClick={() => {
            if (isMobile) {
              setIsMobileOpen(!isMobileOpen);
            } else {
              setIsCollapsed(!isCollapsed);
            }
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {isCollapsed && (
                <motion.div
                  className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-md mx-auto"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-white font-bold text-xl">D</span>
                </motion.div>
              )}
              <div className="relative">
                <div className={cn(
                  'relative',
                  isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto ml-2',
                  'transition-all duration-300 overflow-hidden inline-block'
                )}>
                  <motion.span 
                    className="text-xl font-extrabold whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-blue-950 to-blue-500"
                  >
                    DevLink CRM
                  </motion.span>
                </div>
                {!isCollapsed && (
                  <motion.span 
                    className="absolute left-full ml-2 -top-1 text-xs font-bold bg-gradient-to-r from-blue-500 via-blue-950 to-blue-500 text-white px-2 py-0.5 rounded-full"
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
                )}
              </div>
            </div>
            
            {!isMobile && !isCollapsed && (
              <ChevronLeft className="w-5 h-5 text-blue-600" />
            )}
          </div>
        </motion.div>

        {/* Menu principal */}
        <nav className={cn(
          "flex-1 px-2 py-4 space-y-1",
          isCollapsed ? "overflow-y-visible" : "overflow-y-auto custom-scrollbar"
        )}>
          {menuItems.map((menuItem) => {
            const isActive = pathname === menuItem.href;
            return (
              <MenuItem 
                key={menuItem.href}
                item={menuItem}
                isActive={isActive}
                isCollapsed={isCollapsed}
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleLinkClick(e, menuItem.href)}
              />
            );
          })}
        </nav>

        {/* Menu utilisateur */}
        <motion.div 
          className={cn(
            'p-4 mt-auto border-t border-blue-100',
            isCollapsed ? 'px-2' : 'px-4'
          )}
          initial={false}
          animate={{
            padding: isCollapsed ? '1rem 0.5rem' : '1rem',
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
        >
          <UserMenu isCollapsed={isCollapsed} />
        </motion.div>
      </motion.div>

      {/* Overlay mobile */}
      <AnimatePresence>
        {isMobile && isMobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Styles globaux pour la scrollbar */}
      <style jsx global>{`
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
        .ripple {
          position: absolute;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.7);
          transform: scale(0);
          animation: ripple 600ms linear;
          pointer-events: none;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 0, 0, 0.1) rgba(0, 0, 0, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2);
        }
        /* Cacher la scrollbar en mode réduit */
        .overflow-y-visible::-webkit-scrollbar {
          display: none;
        }
        .overflow-y-visible {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </>
  );
}

export default Sidebar;
