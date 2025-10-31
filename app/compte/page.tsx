'use client';

import { UserProfile } from '@/components/user/UserProfile';
import  Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8">
          <UserProfile />
        </div>
      </main>
    </div>
  );
}
