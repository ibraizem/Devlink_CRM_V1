// features/campaigns/hooks/useCampaignCreator.ts
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface CreatorInfo {
  name: string;
  email?: string;
}

export function useCampaignCreator(userId?: string | null) {
  const [creator, setCreator] = useState<CreatorInfo | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchCreator = async () => {
      const { data } = await supabase
        .from('users_profile')
        .select('email, nom, prenom')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        const fullName =
          data.prenom && data.nom
            ? `${data.prenom} ${data.nom}`
            : data.email ?? 'Utilisateur';

        setCreator({ name: fullName, email: data.email });
      } else {
        setCreator({ name: `Utilisateur (${userId.slice(0, 6)}...)` });
      }
    };

    fetchCreator();
  }, [userId]);

  return creator;
}
