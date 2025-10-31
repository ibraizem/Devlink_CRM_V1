'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Users, FileText, Calendar, ChevronLeft, Menu, X, Phone } from 'lucide-react';
import { cn } from '@/lib/types/utils';

interface MenuItemType {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  gradient: string;
}

interface MenuItemProps {
  item: MenuItemType;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

function MenuItem({ item, isActive, isCollapsed, onClick }: MenuItemProps) {
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
      </Link>
    </motion.div>
  );
}

const menuItems = [
  { 
    icon: Home, 
    label: 'Tableau de bord', 
    href: '/dashboard',
    gradient: 'from-blue-500 to-cyan-500'
  },
  { 
    icon: Users, 
    label: 'Prospects', 
    href: '/leads',
    gradient: 'from-green-500 to-emerald-500'
  },
  { 
    icon: Phone, 
    label: 'Appels', 
    href: '/appels',
    gradient: 'from-purple-500 to-indigo-600'
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
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return isMobile;
}

function ClientSidebar() {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed');
      setIsCollapsed(saved ? JSON.parse(saved) : isMobile);
    }
  }, [isMobile]);

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

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (!isMounted) {
    return (
      <div className="fixed top-0 left-0 h-screen w-16 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40" />
    );
  }

  return (
    <>
      <motion.div
        className={cn(
          'fixed top-0 left-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40',
          'flex flex-col transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-16' : 'w-64',
          isMobile && !isMobileOpen ? '-translate-x-full' : 'translate-x-0'
        )}
        initial={false}
        animate={{
          width: isCollapsed ? '4rem' : '16rem',
          x: isMobile && !isMobileOpen ? '-100%' : 0
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
          <div className="px-2">
            {menuItems.map((item) => (
              <MenuItem
                key={item.href}
                item={item}
                isActive={pathname === item.href}
                isCollapsed={isCollapsed}
                onClick={() => {}}
              />
            ))}
          </div>
        </div>
        
        <div className="p-2 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={isCollapsed ? 'Déplier le menu' : 'Replier le menu'}
          >
            <ChevronLeft className={cn(
              'h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform duration-200',
              isCollapsed ? 'rotate-180' : ''
            )} />
            {!isCollapsed && (
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                Réduire
              </span>
            )}
          </button>
        </div>
      </motion.div>

      {/* Overlay pour mobile */}
      {isMobile && isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}

export default ClientSidebar;
