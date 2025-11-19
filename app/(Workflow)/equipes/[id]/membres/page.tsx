import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { TeamActions } from '@/components/equipes/TeamActions';
import Sidebar from '@/components/Sidebar';

type TeamMember = {
  id: string;
  user: {
    id: string;
    nom: string | null;
    prenom: string | null;
    email: string;
    avatar_url: string | null;
  };
  role: string;
  joined_at: string;
};

type TeamWithMembers = {
  id: string;
  name: string;
  members: TeamMember[];
};

export default async function TeamMembersPage({
  params,
}: {
  params: { id: string };
}) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  // Vérifier si l'utilisateur est connecté
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Récupérer les données de l'équipe et de ses membres
  const { data: team } = await supabase
    .from('teams')
    .select(
      `
      id,
      name,
      members:team_members (
        id,
        role,
        joined_at,
        user:user_id (id, nom, prenom, email, avatar_url)
      )
    `
    )
    .eq('id', params.id)
    .single();

  if (!team) {
    notFound();
  }

  const teamData: TeamWithMembers = {
    ...team,
    members: team.members?.map((m: any) => ({
      ...m,
      user: m.user || null,
    })) || [],
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/equipes/${params.id}`}>
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{teamData.name}</h1>
                <p className="text-muted-foreground">
                  Gestion des membres de l'équipe
                </p>
              </div>
            </div>
            <TeamActions teamId={params.id} />
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">
                Membres de l'équipe
              </CardTitle>
              <Button asChild>
                <Link 
                  href={`/equipes/${params.id}/membres/ajouter`}
                  className="flex items-center"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Ajouter des membres
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {teamData.members.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Aucun membre</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Cette équipe n'a pas encore de membres.
                  </p>
                  <Button asChild>
                    <Link href={`/equipes/${params.id}/membres/ajouter`}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Ajouter des membres
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {teamData.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage
                            src={member.user.avatar_url || ''}
                            alt={`${member.user.prenom} ${member.user.nom}`}
                          />
                          <AvatarFallback>
                            {member.user.prenom?.[0]}
                            {member.user.nom?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {member.user.prenom} {member.user.nom}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={member.role === 'leader' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
