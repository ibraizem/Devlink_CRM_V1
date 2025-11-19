'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Team } from '@/lib/types/teams';
import { supabase } from '@/lib/supabase/client';
import { TeamForm } from './TeamForm';
import { Users, UserPlus, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  team: Team | null;
  onUpdated?: (team: Team) => void;
  onDeleted?: (id: string) => void;
}

export function TeamDetailModal({ team, open, onClose, onUpdated, onDeleted }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [creatorInfo, setCreatorInfo] = useState<{ nom?: string; prenom?: string; email?: string } | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [availableUsers, setAvailableUsers] = useState<Array<{id: string, nom?: string, prenom?: string, email: string}>>([]);
  const [loading, setLoading] = useState(false);

  // Récupérer les informations de l'utilisateur créateur
  useEffect(() => {
    const fetchCreatorInfo = async () => {
      if (!team?.created_by) {
        setCreatorInfo(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users_profile')
          .select('nom, prenom, email')
          .eq('id', team.created_by)
          .single();

        if (error) {
          console.error('Erreur lors de la récupération des infos du créateur:', error);
          setCreatorInfo(null);
        } else {
          setCreatorInfo(data);
        }
      } catch (error) {
        console.error('Erreur:', error);
        setCreatorInfo(null);
      }
    };

    if (team?.created_by) {
      fetchCreatorInfo();
    }
  }, [team?.created_by]);

  // Récupérer les utilisateurs disponibles pour l'ajout
  useEffect(() => {
    const fetchAvailableUsers = async () => {
      if (!team) return;

      try {
        // Récupérer tous les utilisateurs actifs
        const { data: allUsers, error: usersError } = await supabase
          .from('users_profile')
          .select('id, nom, prenom, email')
          .eq('actif', true);

        if (usersError) throw usersError;

        // Filtrer les utilisateurs qui ne sont pas déjà dans l'équipe
        const teamMemberIds = team.members?.map(member => member.user.id) || [];
        const available = allUsers?.filter(user => 
          !teamMemberIds.includes(user.id) && user.id !== team.created_by
        ) || [];

        setAvailableUsers(available);
      } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        setAvailableUsers([]);
      }
    };

    if (addMemberModalOpen && team) {
      fetchAvailableUsers();
    }
  }, [addMemberModalOpen, team]);

  if (!team) return null;

  const handleOpenAddMemberModal = () => {
    setAddMemberModalOpen(true);
    setSelectedUserId('');
  };

  const handleAddMember = async () => {
    if (!selectedUserId || !team) return;

    setLoading(true);
    try {
      // Ajouter le membre à l'équipe
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: selectedUserId,
          role: 'member',
        });

      if (memberError) throw memberError;

      toast({
        title: '👋 Membre ajouté',
        description: 'Le nouveau membre a été ajouté à l\'équipe avec succès.',
      });

      setAddMemberModalOpen(false);
      setSelectedUserId('');
      onUpdated?.(team);
    } catch (error: any) {
      toast({
        title: '❌ Erreur lors de l\'ajout',
        description: error.message || 'Impossible d\'ajouter le membre. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', team.id);

      if (error) throw error;

      toast({
        title: '🗑️ Équipe supprimée',
        description: `"${team.name}" a été supprimée définitivement.`,
      });

      onDeleted?.(team.id);
      onClose();
    } catch (error: any) {
      toast({
        title: '❌ Erreur lors de la suppression',
        description: error.message || 'Impossible de supprimer l\'équipe. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Détails de l'équipe
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setEditModalOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            Informations détaillées sur l'équipe {team?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations principales */}
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{team.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Créée le {formatDate(team.created_at)}
                    </p>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {team.description && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground">{team.description}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div key="id">
                  <span className="font-medium">ID:</span>
                  <p className="text-muted-foreground font-mono text-xs">{team.id}</p>
                </div>
                <div key="created-by">
                  <span className="font-medium">Créé par:</span>
                  <p className="text-muted-foreground">
                    {creatorInfo ? (
                      creatorInfo.nom && creatorInfo.prenom 
                        ? `${creatorInfo.prenom} ${creatorInfo.nom}`
                        : creatorInfo.email
                    ) : (
                      team.created_by
                    )}
                  </p>
                </div>
                <div key="updated">
                  <span className="font-medium">Mise à jour:</span>
                  <p className="text-muted-foreground">
                    {team.updated_at ? formatDate(team.updated_at) : 'Jamais'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chef d'équipe */}
          {team.leader && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Chef d'équipe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={team.leader.avatar_url || undefined} />
                    <AvatarFallback>
                      {team.leader.prenom?.[0]}{team.leader.nom?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-medium">
                      {team.leader.prenom} {team.leader.nom}
                    </h4>
                    <p className="text-sm text-muted-foreground">{team.leader.email}</p>
                  </div>
                  <Badge variant="secondary">Leader</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Membres de l'équipe */}
          {team.members && team.members.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Membres de l'équipe ({team.members.length})
                  </div>
                  <Button variant="outline" size="sm" onClick={handleOpenAddMemberModal}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Ajouter un membre
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {team.members.map((member) => (
                    <div key={`member-${member.id || member.user.id}`} className="flex items-center gap-4 p-3 rounded-lg border">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {member.user.prenom?.[0]}{member.user.nom?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {member.user.prenom} {member.user.nom}
                        </h4>
                        <p className="text-sm text-muted-foreground">{member.user.email}</p>
                        {member.joined_at && (
                          <p className="text-xs text-muted-foreground">
                            Rejoint le {formatDate(member.joined_at)}
                          </p>
                        )}
                      </div>
                      <Badge 
                        variant={member.user.id === team.leader_id ? "default" : "secondary"}
                      >
                        {member.user.id === team.leader_id ? "Leader" : member.role || "Membre"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistiques */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div key="members" className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {team.members?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Membres</div>
                </div>
                <div key="days" className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {team.created_at ? Math.floor((Date.now() - new Date(team.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Jours d'existence</div>
                </div>
                <div key="leader" className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">1</div>
                  <div className="text-sm text-muted-foreground">Leader</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>

      {/* Modal de modification de l'équipe */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier l'équipe</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'équipe {team?.name}
            </DialogDescription>
          </DialogHeader>
          <TeamForm
            team={team || undefined}
            onSuccess={() => {
              setEditModalOpen(false);
              onUpdated?.(team);
              toast({
                title: "Équipe modifiée",
                description: `L'équipe "${team.name}" a été mise à jour avec succès.`,
              });
            }}
            onCancel={() => setEditModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal d'ajout de membre */}
      <Dialog open={addMemberModalOpen} onOpenChange={setAddMemberModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un membre</DialogTitle>
            <DialogDescription>
              Sélectionnez un utilisateur à ajouter à l'équipe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user">Utilisateur</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un utilisateur..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.nom && user.prenom 
                        ? `${user.prenom} ${user.nom}`
                        : user.email
                      }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableUsers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Aucun utilisateur disponible pour cette équipe.
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setAddMemberModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddMember} disabled={!selectedUserId || loading}>
              {loading ? 'Ajout...' : 'Ajouter'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
