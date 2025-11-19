import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// components/common/SyncStatus.tsx
export function SyncStatus({ fileId }: { fileId: string }) {
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced' | 'error'>('synced');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  
  return (
    <div className="flex items-center gap-2 text-sm">
      {syncStatus === 'syncing' && <Loader2 className="h-3 w-3 animate-spin" />}
      {syncStatus === 'synced' && <CheckCircle className="h-3 w-3 text-green-500" />}
      {syncStatus === 'error' && <AlertCircle className="h-3 w-3 text-red-500" />}
      {lastSync && <span>Dernière sync: {format(lastSync, 'HH:mm', { locale: fr })}</span>}
    </div>
  );
}