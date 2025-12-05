'use client';

import { useUser as useClerkUser } from '@clerk/nextjs';

type User = {
  id: string;
  email?: string;
};

interface UseUserReturn {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export function useUser(): UseUserReturn {
  const { user: clerkUser, isLoaded } = useClerkUser();

  const user: User | null = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.emailAddresses[0]?.emailAddress,
  } : null;

  return { 
    user, 
    loading: !isLoaded, 
    error: null 
  };
}
