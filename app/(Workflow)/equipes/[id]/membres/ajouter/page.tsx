'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Plus, X, UserPlus, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

type UserProfile = {
  id: string;
  email: string;
  nom: string | null;
  prenom: string | null;
  avatar_url: string | null;
  role: string;
};

export default function AddTeamMembersPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [role, setRole] = useState('member');
  const [currentTeamMembers, setCurrentTeamMembers] = useState<Set<string>>(new Set());

  // Charger les utilisateurs et les membres actuels de l'équipe
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Récupérer les membres actuels de l'équipe
        const { data: teamMembers } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('team_id', params.id);

        if (teamMembers) {
          const memberIds = new Set(teamMembers.map((m: { user_id: string }) => m.user_id));
          setCurrentTeamMembers(memberIds);
        }

        // Récupérer les utilisateurs (sauf l'utilisateur actuel)
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data: usersData, error } = await supabase
          .from('users_profile')
          .select('*')
          .neq('id', user?.id) // Exclure l'utilisateur actuel
          .order('prenom', { ascending: true });

        if (error) throw error;
        
        // Filtrer les utilisateurs qui ne sont pas déjà membres de l'équipe
        const filteredUsers = usersData.filter((user: UserProfile) => !currentTeamMembers.has(user.id));
        setUsers(filteredUsers);
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        toast.error('Erreur lors du chargement des utilisateurs');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nom?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const addMembersToTeam = async () => {
    if (selectedUsers.size === 0) {
      toast.warning('Veuillez sélectionner au moins un membre à ajouter');
      return;
    }

    setLoading(true);

    try {      
      const membersToAdd = Array.from(selectedUsers).map((userId) => ({
        team_id: params.id,
        user_id: userId,
        role,
      }));

      const { error } = await supabase
        .from('team_members')
        .insert(membersToAdd)
        .select();

      if (error) throw error;

      toast.success(`${selectedUsers.size} membre(s) ajouté(s) avec succès`);
      router.push(`/equipes/${params.id}`);
    } catch (error) {
      console.error('Erreur lors de l\'ajout des membres:', error);
      toast.error('Une erreur est survenue lors de l\'ajout des membres');
    } finally {
      setLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/equipes/${params.id}`} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour aux détails de l'équipe
            </Link>
          </Button>
          <h1 className="text-3xl font-bold mb-2">Ajouter des membres</h1>
          <p className="text-muted-foreground mb-6">
            Sélectionnez les utilisateurs à ajouter à l'équipe
          </p>
          <Input
            placeholder="Rechercher des utilisateurs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-6"
          />
        </div>

        <div className="space-y-2">
          <Label>Rôle des membres</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sélectionner un rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Membre</SelectItem>
              <SelectItem value="leader">Responsable</SelectItem>
              <SelectItem value="admin">Administrateur</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Le rôle sera appliqué à tous les membres sélectionnés
          </p>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                {selectedUsers.size} membre(s) sélectionné(s)
              </div>
              {selectedUsers.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUsers(new Set())}
                >
                  <X className="h-4 w-4 mr-1" />
                  Tout désélectionner
                </Button>
              )}
            </div>
          </div>

          <div className="divide-y">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleUserSelection(user.id)}
                >
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      checked={selectedUsers.has(user.id)}
                      onCheckedChange={() => toggleUserSelection(user.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Avatar>
                      <AvatarImage src={user.avatar_url || ''} />
                      <AvatarFallback>
                        {user.prenom?.[0]}
                        {user.nom?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {user.prenom} {user.nom}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {user.role}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <UserPlus className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium text-foreground">
                  Aucun utilisateur trouvé
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Essayez de modifier votre recherche ou vérifiez que l'utilisateur n'est pas déjà membre de l'équipe.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/equipes/${params.id}`)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={addMembersToTeam}
            disabled={selectedUsers.size === 0 || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ajout en cours...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter {selectedUsers.size} membre(s)
              </>
            )}
          </Button>
        </div>
      </div>
      </div>
  );
}
