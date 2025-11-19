import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, Target, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { TeamActions } from '@/components/equipes/TeamActions';

type TeamWithDetails = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  leader: {
    id: string;
    nom: string | null;
    prenom: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
  members: Array<{
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
  }>;
  campaigns: Array<{
    id: string;
    name: string;
    status: string;
    start_date: string;
    end_date: string;
  }>;
};

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: team } = await supabase
    .from('teams')
    .select('name')
    .eq('id', params.id)
    .single();

  return {
    title: `${team?.name || 'Équipe'} | DevLink CRM`,
  };
}

export default async function TeamDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: team } = await supabase
    .from('teams')
    .select(
      `
      *,
      leader:leader_id (id, nom, prenom, email, avatar_url),
      members:team_members (
        id,
        role,
        joined_at,
        user:user_id (id, nom, prenom, email, avatar_url)
      ),
      campaigns:team_campaigns (
        id,
        campaign:campaign_id (id, name, status, start_date, end_date)
      )
    `
    )
    .eq('id', params.id)
    .single();

  if (!team) {
    notFound();
  }

  // Formater les données pour le typage
  const teamData: TeamWithDetails = {
    ...team,
    members: team.members?.map((m: any) => ({
      ...m,
      user: m.user || null,
    })) || [],
    campaigns: team.campaigns?.map((c: any) => ({
      id: c.campaign.id,
      name: c.campaign.name,
      status: c.campaign.status,
      start_date: c.campaign.start_date,
      end_date: c.campaign.end_date,
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
            <Link href="/equipes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{teamData.name}</h1>
            <p className="text-muted-foreground">
              Gestion de l'équipe et des membres
            </p>
          </div>
        </div>
        
        <TeamActions teamId={params.id} />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="members">Membres ({teamData.members.length})</TabsTrigger>
          <TabsTrigger value="campaigns">
            Campagnes ({teamData.campaigns.length})
          </TabsTrigger>
          <TabsTrigger value="activity">Activité</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Responsable</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {teamData.leader ? (
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={teamData.leader.avatar_url || ''} />
                      <AvatarFallback>
                        {teamData.leader.prenom?.[0]}
                        {teamData.leader.nom?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {teamData.leader.prenom} {teamData.leader.nom}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {teamData.leader.email}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucun responsable</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Membres</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamData.members.length}</div>
                <p className="text-xs text-muted-foreground">
                  {teamData.members.length === 1
                    ? '1 membre dans cette équipe'
                    : `${teamData.members.length} membres dans cette équipe`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Campagnes</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {teamData.campaigns.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {teamData.campaigns.length === 1
                    ? '1 campagne active'
                    : `${teamData.campaigns.length} campagnes actives`}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              {teamData.description ? (
                <p className="text-muted-foreground">{teamData.description}</p>
              ) : (
                <p className="text-muted-foreground italic">
                  Aucune description fournie pour cette équipe.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Membres de l'équipe</CardTitle>
              <Button asChild size="sm">
                <Link href={`/equipes/${params.id}/membres/ajouter`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un membre
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {teamData.members.length > 0 ? (
                  <div className="divide-y">
                    {teamData.members.map((member) => (
                      <div
                        key={member.user.id}
                        className="flex items-center justify-between py-4"
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage src={member.user.avatar_url || ''} />
                            <AvatarFallback>
                              {member.user.prenom?.[0]}
                              {member.user.nom?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {member.user.prenom} {member.user.nom}
                              {member.role === 'leader' && (
                                <Badge variant="secondary" className="ml-2">
                                  Responsable
                                </Badge>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {member.user.email}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Membre depuis{' '}
                          {new Date(member.joined_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium text-foreground">
                      Aucun membre dans cette équipe
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Commencez par ajouter des membres à cette équipe.
                    </p>
                    <div className="mt-6">
                      <Button asChild>
                        <Link href={`/equipes/${params.id}/membres/ajouter`}>
                          <Plus className="mr-2 h-4 w-4" />
                          Ajouter des membres
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Campagnes de l'équipe</CardTitle>
              <Button asChild size="sm">
                <Link href={`/campagnes/nouvelle?team_id=${params.id}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle campagne
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {teamData.campaigns.length > 0 ? (
                <div className="space-y-4">
                  {teamData.campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{campaign.name}</h3>
                          <Badge variant="outline">{campaign.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(campaign.start_date).toLocaleDateString(
                            'fr-FR'
                          )}{' '}
                          -{' '}
                          {new Date(campaign.end_date).toLocaleDateString(
                            'fr-FR'
                          )}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/campagnes/${campaign.id}`}>
                          Voir la campagne
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Target className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium text-foreground">
                    Aucune campagne associée
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Créez une campagne pour cette équipe.
                  </p>
                  <div className="mt-6">
                    <Button asChild>
                      <Link href={`/campagnes/nouvelle?team_id=${params.id}`}>
                        <Plus className="mr-2 h-4 w-4" />
                        Créer une campagne
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  L'activité de l'équipe s'affichera ici.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </div>
  );
}
