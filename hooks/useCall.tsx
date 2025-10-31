'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { OnOffClient } from '@/lib/types/onoff/client';
import { OnOffCall, OnOffCallOptions } from '@/lib/types/onoff/types';

interface CallContextType {
  // Appels
  startCall: (options: OnOffCallOptions) => Promise<OnOffCall>;
  endCall: (callId: string) => Promise<void>;
  getCall: (callId: string) => Promise<OnOffCall>;
  
  // Historique
  callHistory: OnOffCall[];
  isLoadingHistory: boolean;
  refreshCallHistory: () => Promise<void>;
  
  // Appel en cours
  currentCall: OnOffCall | null;
  isCalling: boolean;
  callError: string | null;
  
  // Enregistrements
  downloadRecording: (callId: string) => Promise<Blob>;
  
  // Notes
  addCallNote: (callId: string, note: string) => Promise<OnOffCall>;
  
  // Tags
  updateCallTags: (callId: string, tags: string[]) => Promise<OnOffCall>;
}

interface CallProviderProps {
  children: ReactNode;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: CallProviderProps) {
  const [callClient, setCallClient] = useState<OnOffClient | null>(null);
  const [callHistory, setCallHistory] = useState<OnOffCall[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentCall, setCurrentCall] = useState<OnOffCall | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);

  // Initialiser le client d'appel
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_ONOFF_API_KEY;
    if (apiKey) {
      const client = new OnOffClient(apiKey);
      setCallClient(client);
      refreshCallHistory();
      const interval = setInterval(refreshCallHistory, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  // Rafraîchir l'historique des appels
  const refreshCallHistory = useCallback(async () => {
    if (!callClient) return;
    
    try {
      setIsLoadingHistory(true);
      const history = await callClient.getCallHistory({
        pageSize: 50,
        direction: 'outbound',
      });
      setCallHistory(history.calls);
    } catch (error) {
      console.error('Failed to refresh call history:', error);
      setCallError('Impossible de charger l\'historique des appels');
    } finally {
      setIsLoadingHistory(false);
    }
  }, [callClient]);

  // Démarrer un appel
  const startCall = useCallback(async (options: OnOffCallOptions) => {
    if (!callClient) throw new Error('Call client not initialized');
    
    try {
      setIsCalling(true);
      setCallError(null);
      
      const call = await callClient.makeCall(options);
      setCurrentCall(call);
      
      // Rafraîchir l'historique après l'appel
      await refreshCallHistory();
      
      return call;
    } catch (error) {
      console.error('Call failed:', error);
      setCallError('Échec de l\'appel. Veuillez réessayer.');
      throw error;
    } finally {
      setIsCalling(false);
    }
  }, [callClient, refreshCallHistory]);

  // Terminer un appel
  const endCall = useCallback(async (callId: string) => {
    if (!callClient) throw new Error('Call client not initialized');
    
    try {
      setIsCalling(true);
      await callClient.endCall(callId);
      
      // Mettre à jour l'appel actuel avec les dernières informations
      const updatedCall = await callClient.getCall(callId);
      setCurrentCall(updatedCall);
      
      // Rafraîchir l'historique
      await refreshCallHistory();
    } catch (error) {
      console.error('Failed to end call:', error);
      setCallError('Impossible de terminer l\'appel');
      throw error;
    } finally {
      setIsCalling(false);
    }
  }, [callClient, refreshCallHistory]);

  // Obtenir les détails d'un appel
  const getCall = useCallback(async (callId: string) => {
    if (!callClient) throw new Error('Call client not initialized');
    return callClient.getCall(callId);
  }, [callClient]);

  // Télécharger un enregistrement
  const downloadRecording = useCallback(async (callId: string) => {
    if (!callClient) throw new Error('Call client not initialized');
    return callClient.downloadRecording(callId);
  }, [callClient]);

  // Ajouter une note à un appel
  const addCallNote = useCallback(async (callId: string, note: string) => {
    if (!callClient) throw new Error('Call client not initialized');
    return callClient.addCallNote(callId, note);
  }, [callClient]);

  // Mettre à jour les tags d'un appel
  const updateCallTags = useCallback(async (callId: string, tags: string[]) => {
    if (!callClient) throw new Error('Call client not initialized');
    return callClient.updateCallTags(callId, tags);
  }, [callClient]);

  // Création de l'objet de contexte avec toutes les méthodes et états nécessaires
  const contextValue: CallContextType = {
    startCall: useCallback(async (options) => {
      if (!callClient) throw new Error('Call client not initialized');
      setIsCalling(true);
      try {
        const call = await callClient.makeCall(options);
        setCurrentCall(call);
        await refreshCallHistory();
        return call;
      } finally {
        setIsCalling(false);
      }
    }, [callClient, refreshCallHistory]),

    endCall: useCallback(async (callId: string) => {
      if (!callClient) throw new Error('Call client not initialized');
      await callClient.endCall(callId);
      await refreshCallHistory();
    }, [callClient, refreshCallHistory]),

    getCall: useCallback(async (callId: string) => {
      if (!callClient) throw new Error('Call client not initialized');
      return callClient.getCall(callId);
    }, [callClient]),

    callHistory,
    isLoadingHistory,
    refreshCallHistory: useCallback(async () => {
      if (!callClient) return;
      setIsLoadingHistory(true);
      try {
        const history = await callClient.getCallHistory({ pageSize: 50 });
        setCallHistory(history.calls || []);
      } catch (error) {
        console.error('Failed to refresh call history:', error);
        setCallError('Failed to load call history');
      } finally {
        setIsLoadingHistory(false);
      }
    }, [callClient]),

    currentCall,
    isCalling,
    callError,

    downloadRecording: useCallback(async (callId: string) => {
      if (!callClient) throw new Error('Call client not initialized');
      return callClient.downloadRecording(callId);
    }, [callClient]),

    addCallNote: useCallback(async (callId: string, note: string) => {
      if (!callClient) throw new Error('Call client not initialized');
      return callClient.addCallNote(callId, note);
    }, [callClient]),

    updateCallTags: useCallback(async (callId: string, tags: string[]) => {
      if (!callClient) throw new Error('Call client not initialized');
      return callClient.updateCallTags(callId, tags);
    }, [callClient]),
  };

  return (
    <CallContext.Provider value={contextValue}>
      {children}
    </CallContext.Provider>
  );
}

export function useCall(): CallContextType {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
