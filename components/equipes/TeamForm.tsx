'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Team } from '@/lib/types/teams';
import { UserProfile } from '@/lib/types/user';
import { toast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Save, X } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  description: z.string().optional(),
  members: z.array(z.string()).min(1, 'Sélectionnez au moins un membre'),
  leader_id: z.string().nullable().default(null),
}).refine(data => !data.leader_id || data.members.includes(data.leader_id), {
  message: 'Le leader doit être sélectionné parmi les membres',
  path: ['leader_id']
});

type TeamFormValues = z.infer<typeof formSchema>;

interface TeamFormProps {
  team?: Team;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TeamForm({ team, onSuccess, onCancel }: TeamFormProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const router = useRouter();

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: team?.name || '',
      description: team?.description || '',
      members: team?.members?.map((m: any) => m.user?.id).filter(Boolean) || [],
      leader_id: team?.leader_id || null,
    },
  });

  const selectedMembers = form.watch('members') || [];

  // Charger la liste des utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .order('prenom', { ascending: true });

      if (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        toast({
          title: 'Erreur lors du chargement des utilisateurs',
          variant: 'destructive',
        });
        return;
      }

      setUsers(data || []);
    };

    fetchUsers();
  }, [supabase]);

  // Fonction pour vérifier si le nom d'équipe existe déjà pour cet utilisateur
  const checkTeamNameExists = async (name: string): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('teams')
      .select('id')
      .eq('name', name)
      .eq('created_by', user.id)
      .single();
    
    return !error && !!data;
  };

  // Fonction pour générer un nom alternatif
  const generateAlternativeName = (originalName: string): string => {
    const timestamp = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/[/:]/g, '-');
    
    return `${originalName} - ${timestamp}`;
  };

  const onSubmit = async (values: TeamFormValues) => {
    if (team) {
      // Mise à jour d'une équipe existante
      try {
        const { error: updateTeamError } = await supabase
          .from('teams')
          .update({
            name: values.name,
            description: values.description,
            leader_id: values.leader_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', team.id);

        if (updateTeamError) throw updateTeamError;

        // Mettre à jour les membres
        const { error: deleteMembersError } = await supabase
          .from('team_members')
          .delete()
          .eq('team_id', team.id);

        if (deleteMembersError) throw deleteMembersError;

        if (values.members && values.members.length > 0) {
          // Exclure le leader de la liste des membres pour éviter le doublon
          const membersWithoutLeader = values.members.filter(memberId => memberId !== values.leader_id);
          
          if (membersWithoutLeader.length > 0) {
            const { error: insertMembersError } = await supabase
              .from('team_members')
              .insert(
                membersWithoutLeader.map((memberId) => ({
                  team_id: team.id,
                  user_id: memberId,
                  role: 'member'
                }))
              );

            if (insertMembersError) throw insertMembersError;
          }
        }

        toast({
          title: '✅ Équipe mise à jour',
          description: `"${values.name}" a été mise à jour avec ${values.members?.length || 0} membre(s).`,
        });

        onSuccess?.();
      } catch (error: any) {
        toast({
          title: '❌ Erreur lors de la mise à jour',
          description: error.message || 'Impossible de mettre à jour l\'équipe. Veuillez réessayer.',
          variant: 'destructive',
        });
      }
    } else {
      // Création d'une nouvelle équipe
      // Vérifier si le nom existe déjà
      const nameExists = await checkTeamNameExists(values.name);
      
      if (nameExists) {
        const alternativeName = generateAlternativeName(values.name);
        
        toast({
          title: 'Nom déjà utilisé',
          description: `Le nom "${values.name}" est déjà pris. Suggestion: "${alternativeName}"`,
          variant: 'destructive',
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                form.setValue('name', alternativeName);
                toast({
                  title: 'Nom mis à jour',
                  description: `Le nom a été changé en: ${alternativeName}`,
                });
              }}
            >
              Utiliser ce nom
            </Button>
          ),
        });
        
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data: newTeam, error: createError } = await supabase
          .from('teams')
          .insert([
            {
              name: values.name,
              description: values.description,
              leader_id: values.leader_id,
              created_by: user?.id,
            },
          ])
          .select()
          .single();

        if (createError) throw createError;

        // Ajout des membres à la nouvelle équipe
        if (values.members && values.members.length > 0) {
          // Exclure le leader de la liste des membres pour éviter le doublon
          const membersWithoutLeader = values.members.filter(memberId => memberId !== values.leader_id);
          
          if (membersWithoutLeader.length > 0) {
            const { error: insertMembersError } = await supabase
              .from('team_members')
              .insert(
                membersWithoutLeader.map((memberId: string) => ({
                  team_id: newTeam.id,
                  user_id: memberId,
                  role: 'member'
                }))
              );

            if (insertMembersError) throw insertMembersError;
          }
        }

        toast({
          title: '🎉 Équipe créée',
          description: `"${values.name}" a été créée avec ${values.members?.length || 0} membre(s).`,
        });

        onSuccess?.();
        return newTeam;
      } catch (error: any) {
        toast({
          title: '❌ Erreur lors de la création',
          description: error.message || 'Impossible de créer l\'équipe. Veuillez réessayer.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom de l'équipe</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Équipe commerciale" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="members"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Membres de l'équipe</FormLabel>
                <Select
                  onValueChange={(value) => {
                    const currentMembers = form.getValues('members') || [];
                    if (currentMembers.includes(value)) {
                      field.onChange(currentMembers.filter(id => id !== value));
                    } else {
                      field.onChange([...currentMembers, value]);
                    }
                  }}
                  value=""
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez les membres" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {users.map((user) => {
                      const isSelected = selectedMembers.includes(user.id);
                      return (
                        <div 
                          key={user.id} 
                          className="relative flex items-center px-2 py-1.5 text-sm rounded hover:bg-accent cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            const currentMembers = form.getValues('members') || [];
                            if (isSelected) {
                              field.onChange(currentMembers.filter(id => id !== user.id));
                              // Si le leader décoché était le leader actuel, on le retire
                              if (form.getValues('leader_id') === user.id) {
                                form.setValue('leader_id', null);
                              }
                            } else {
                              field.onChange([...currentMembers, user.id]);
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          {user.prenom} {user.nom} ({user.email})
                        </div>
                      );
                    })}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedMembers.map(userId => {
                    const user = users.find(u => u.id === userId);
                    return user ? (
                      <div key={userId} className="bg-gray-100 px-2 py-1 rounded-full text-sm flex items-center">
                        {user.prenom} {user.nom}
                        <button
                          type="button"
                          onClick={() => {
                            const newMembers = selectedMembers.filter(id => id !== userId);
                            form.setValue('members', newMembers);
                            if (form.getValues('leader_id') === userId) {
                              form.setValue('leader_id', null);
                            }
                          }}
                          className="ml-1 text-gray-500 hover:text-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="leader_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsable</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value === 'no-leader' ? null : value);
                  }}
                  value={field.value || 'no-leader'}
                  disabled={selectedMembers.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        selectedMembers.length === 0 
                          ? 'Sélectionnez d\'abord des membres' 
                          : 'Sélectionner un responsable'
                      } />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="no-leader">Aucun responsable</SelectItem>
                    {users
                      .filter(user => selectedMembers.includes(user.id))
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.prenom} {user.nom} ({user.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Décrivez le rôle et les responsabilités de cette équipe"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            <X className="mr-2 h-4 w-4" />
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {team ? 'Mettre à jour' : 'Créer l\'équipe'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
