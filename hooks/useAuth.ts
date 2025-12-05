'use client';

import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  email?: string;
};

export function useAuth() {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const router = useRouter();

  const user: User | null = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.emailAddresses[0]?.emailAddress,
  } : null;

  const signOut = async () => {
    try {
      await clerkSignOut();
      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    user,
    isAuthenticated: isSignedIn ?? false,
    isLoading: !isLoaded,
    signOut,
  };
}
