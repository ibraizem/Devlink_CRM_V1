'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/utils/supabase/client';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import { BulkActionSummary } from './BulkActionSummary';

interface BulkAssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onAssign: (userId: string) => Promise<void>;
}

export function BulkAssignModal({
  open,
  onOpenChange,
  selectedCount,
  onAssign,
}: BulkAssignModalProps) {
  const [users, setUsers] = useState<Array<{ id: string; nom: string; prenom: string }>>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const loadUsers = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('users_profile')
      .select('id, nom, prenom')
      .order('nom');
    
    if (data) {
      setUsers(data);
    }
  };

  const handleAssign = async () => {
    if (!selectedUser) {
      toast.error('Veuillez sélectionner un utilisateur');
      return;
    }

    setLoading(true);
    try {
      await onAssign(selectedUser);
      toast.success(`✅ ${selectedCount} lead(s) attribué(s)`);
      onOpenChange(false);
      setSelectedUser('');
    } catch (error) {
      console.error('Erreur attribution:', error);
      toast.error('❌ Erreur lors de l\'attribution');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Attribuer les leads
          </DialogTitle>
          <DialogDescription>
            Attribuer {selectedCount} lead(s) à un utilisateur
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <BulkActionSummary
            selectedCount={selectedCount}
            action="Attribution à un utilisateur"
          />

          <div className="space-y-2">
            <Label htmlFor="user">Utilisateur</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger id="user">
                <SelectValue placeholder="Sélectionner un utilisateur" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.prenom} {user.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleAssign} disabled={loading || !selectedUser}>
            {loading ? 'Attribution...' : 'Attribuer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
