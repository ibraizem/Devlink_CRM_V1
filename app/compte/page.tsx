'use client';

import { UserProfile } from '@/components/user/UserProfile';
import  Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoaded) return;
      
      if (!user) {
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router, user, isLoaded]);

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
