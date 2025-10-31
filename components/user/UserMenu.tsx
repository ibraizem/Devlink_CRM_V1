'use client';

import { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, ChevronDown, ChevronUp } from 'lucide-react';
import { signOut } from '@/lib/types/auth';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/types/utils';

type UserMenuProps = {
  isCollapsed?: boolean;
};

type MenuItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  onClick: () => void;
};

export default function UserMenu({ isCollapsed = false }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const menuItems: MenuItem[] = [
    {
      label: 'Mon compte',
      icon: User,
      shortcut: '⌘K',
      onClick: () => router.push('/compte'),
    },
    {
      label: 'Paramètres',
      icon: Settings,
      shortcut: '⌘,',
      onClick: () => router.push('/settings'),
    },
    {
      label: 'Déconnexion',
      icon: LogOut,
      onClick: async () => {
        await signOut();
        router.push('/auth/login');
      },
    },
  ];

  // Fermer le menu quand on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center w-full p-2 rounded-lg transition-colors',
          isOpen ? 'bg-blue-100' : 'hover:bg-blue-50',
          isCollapsed ? 'justify-center' : 'justify-between'
        )}
      >
        <div className="flex items-center">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
            <User className="w-4 h-4" />
          </div>
        </div>
        {!isCollapsed && (
          <div className="flex items-center flex-1 ml-3">
            <div className="text-left flex-1">
              <div className="text-sm font-medium text-gray-800">Utilisateur</div>
              <div className="text-xs text-gray-500">Administrateur</div>
            </div>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-500 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500 ml-2" />
            )}
          </div>
        )}
      </button>

      {isOpen && (
        <div className={cn(
          'absolute bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-100',
          isCollapsed ? 'bottom-0 left-14 w-56' : 'bottom-full mb-2 left-0 w-full'
        )}>
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={cn(
                'w-full text-left px-4 py-2.5 text-sm flex items-center',
                'hover:bg-blue-50 transition-colors',
                index === menuItems.length - 1 ? 'text-red-600 hover:text-red-700' : 'text-gray-700 hover:text-blue-600'
              )}
            >
              <item.icon className={cn(
                'w-4 h-4 mr-3',
                index === menuItems.length - 1 ? 'text-red-500' : 'text-blue-600'
              )} />
              <span className="font-medium">{item.label}</span>
              {item.shortcut && (
                <span className="ml-auto text-xs text-gray-400">
                  {item.shortcut}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>  
  );
}

export { UserMenu };
