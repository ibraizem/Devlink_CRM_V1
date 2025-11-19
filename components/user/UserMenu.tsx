'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { User, Settings, LogOut, ChevronDown, ChevronUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { avatarService } from '@/lib/services/avatarService';
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
  const [userData, setUserData] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isOpenRef = useRef(isOpen);
  
  // Synchroniser la référence avec l'état
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Charger les données utilisateur au montage du composant
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { supabase } = await import('@/lib/supabase/client');
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Récupérer les données utilisateur depuis la base de données
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
          
          setUserData(profile || user);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
      }
    };

    loadUserData();
  }, []);

  // Version simplifiée pour tester le clic
  const handleClick = useCallback(() => {
    const newState = !isOpenRef.current;
    setIsOpen(newState);
  }, []);

  const menuItems = useMemo(() => [
    {
      label: 'Mon compte',
      icon: User,
      shortcut: '⌘K',
      onClick: () => {
        window.location.href = '/user';
      },
    },
    {
      label: 'Paramètres',
      icon: Settings,
      shortcut: '⌘,',
      onClick: () => {
        window.location.href = '/user?tab=settings';
      },
    },
    {
      label: 'Déconnexion',
      icon: LogOut,
      onClick: async () => {
        try {
          const { supabase } = await import('@/lib/supabase/client');
          await supabase.auth.signOut();
          window.location.href = '/auth/login';
        } catch (error) {
          console.error('Erreur lors de la déconnexion:', error);
        }
      },
    },
  ], []);

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
        ref={buttonRef}
        onClick={handleClick}
        className={cn(
          'flex items-center w-full p-2 rounded-lg transition-colors',
          isOpen ? 'bg-blue-100' : 'hover:bg-blue-50',
          isCollapsed ? 'justify-center' : 'justify-between'
        )}
      >
        <div className="flex items-center">
          <Avatar className="w-9 h-9">
            <AvatarImage 
              src={(() => {
                let avatarUrl = userData?.avatar_url || '';
                // Si avatar_url est une URL complète, extraire le chemin relatif
                if (avatarUrl.includes('storage/v1/object/public/user_avatars/')) {
                  avatarUrl = avatarUrl.replace('https://nzlwbtslfljjkozzyaej.supabase.co/storage/v1/object/public/user_avatars/', '');
                }
                return avatarService.getAvatarUrl(avatarUrl) || '';
              })()}
              alt={`${userData?.prenom || 'Utilisateur'} ${userData?.nom || ''}`}
            />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              {userData?.prenom?.[0]?.toUpperCase() || userData?.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
        {!isCollapsed && (
          <div className="flex items-center flex-1 ml-3">
            <div className="text-left flex-1">
              <div className="text-sm font-medium text-gray-800">
                {userData?.prenom && userData?.nom 
                  ? `${userData.prenom} ${userData.nom}` 
                  : userData?.email || 'Utilisateur'
                }
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {userData?.role || 'Administrateur'}
              </div>
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
        <div 
          className={cn(
            'fixed bg-white rounded-lg shadow-lg py-1 border border-gray-100',
            'z-[9999]', // z-index très élevé pour être au-dessus de tout
            'w-48'
          )}
          style={{
            // Positionnement par rapport au bouton
            bottom: isCollapsed ? '80px' : '100px',
            left: isCollapsed ? '20px' : '20px'
          }}
        >
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
