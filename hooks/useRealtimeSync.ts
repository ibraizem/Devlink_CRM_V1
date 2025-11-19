import { useEffect } from "react";
import { useLeads } from "./useLeads";
import { supabase } from "@/lib/supabase/client";

// hooks/useRealtimeSync.ts
export function useRealtimeSync() {
  const { refreshLeads } = useLeads();
  
  useEffect(() => {
    const setupChannel = async () => {
      const channel = supabase
        .channel('leads_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'leads' },
          () => {
            refreshLeads();
          }
        )
        .subscribe();
        
      return channel;
    };

    let channel: any;
    setupChannel().then((ch) => {
      channel = ch;
    });
      
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [refreshLeads]);
}