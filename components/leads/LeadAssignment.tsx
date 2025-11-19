import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Users } from 'lucide-react';

interface Lead {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone: string;
  agent_id?: string;
}

interface Agent {
  id: string;
  nom: string;
  prenom: string;
  email: string;
}

interface LeadAssignmentProps {
  leads: Lead[];
  onAssignmentComplete?: () => void;
}

export function LeadAssignment({ leads, onAssignmentComplete }: LeadAssignmentProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { permissions, checkPermission, getAssignableAgents } = usePermissions();
  const [canAssignLeads, setCanAssignLeads] = useState(false);

  useEffect(() => {
    const checkAssignPermission = async () => {
      if (permissions) {
        const hasPermission = await checkPermission('canAssignLeads');
        setCanAssignLeads(hasPermission);
      }
    };
    checkAssignPermission();
  }, [permissions, checkPermission]);

  useEffect(() => {
    if (canAssignLeads) {
      loadAssignableAgents();
    }
  }, [canAssignLeads]);

  const loadAssignableAgents = async () => {
    try {
      const agentIds = await getAssignableAgents();
      if (agentIds.length === 0) return;

      const { data, error } = await supabase
        .from('users_profile')
        .select('id, nom, prenom, email')
        .in('id', agentIds)
        .eq('actif', true);

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des agents:', error);
    }
  };

  const handleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleAssignLeads = async () => {
    if (!selectedAgent || selectedLeads.length === 0) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({ agent_id: selectedAgent })
        .in('id', selectedLeads);

      if (error) throw error;

      setSelectedLeads([]);
      setSelectedAgent('');
      onAssignmentComplete?.();
    } catch (error) {
      console.error('Erreur lors de l\'assignation des leads:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!canAssignLeads) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Vous n'avez pas les permissions pour assigner des leads.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Assigner des leads
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sélection de l'agent */}
        <div>
          <label className="text-sm font-medium mb-2 block">Agent commercial</label>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un agent..." />
            </SelectTrigger>
            <SelectContent>
              {agents.map(agent => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.prenom} {agent.nom} ({agent.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Liste des leads à assigner */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Leads à assigner ({selectedLeads.length} sélectionnés)
          </label>
          <div className="border rounded-md max-h-60 overflow-y-auto">
            {leads.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                Aucun lead disponible pour l'assignation
              </div>
            ) : (
              <div className="divide-y">
                {leads.map(lead => (
                  <div
                    key={lead.id}
                    className="p-3 hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleLeadSelection(lead.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">
                          {lead.prenom} {lead.nom}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {lead.telephone} {lead.email && `• ${lead.email}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {lead.agent_id && (
                          <Badge variant="outline">Déjà assigné</Badge>
                        )}
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => {}}
                          className="rounded"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bouton d'assignation */}
        <Button
          onClick={handleAssignLeads}
          disabled={!selectedAgent || selectedLeads.length === 0 || loading}
          className="w-full"
        >
          {loading ? 'Assignation...' : `Assigner ${selectedLeads.length} lead(s)`}
        </Button>
      </CardContent>
    </Card>
  );
}
