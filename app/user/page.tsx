'use client';

import { UserProfile } from '@/components/user/UserProfile';
import  Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar fixe */}
      <div className="w-20 flex-shrink-0">
        <Sidebar />
      </div>
      
      {/* Contenu principal avec scroll */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8">
          <UserProfile initialTab={searchParams.get('tab') as any} />
        </div>
      </div>
    </div>
  );
}
