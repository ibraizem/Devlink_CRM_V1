'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Phone, Mail, Building2, ArrowLeft, Pencil, Trash2, Plus, Users, Home, Calendar, FileUp } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/use-toast';
import { leadService, LeadStatus } from '@/lib/services/leadService';
import { createClient } from '@/lib/utils/supabase/client';

// Chargement dynamique de la Sidebar
const Sidebar = dynamic(() => import('@/components/Sidebar'), {
  ssr: false,
  loading: () => <div>Chargement de la barre latérale...</div>
});

const supabase = createClient();

interface Note {
  id: string;
  contenu: string;
  type: string;
  created_at: string;
}

interface LeadData {
  id: string;
  statut: LeadStatus;
  notes?: Note[];
  [key: string]: any;
}

const statusOptions = [
  { value: 'nouveau', label: 'Nouveau', color: 'bg-blue-100 text-blue-800' },
  { value: 'en_cours', label: 'En cours', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'rdv_planifie', label: 'RDV Planifié', color: 'bg-purple-100 text-purple-800' },
  { value: 'converti', label: 'Converti', color: 'bg-green-100 text-green-800' },
  { value: 'sans_suite', label: 'Sans suite', color: 'bg-red-100 text-red-800' },
];

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const leadId = params.id as string;

  const [lead, setLead] = useState<LeadData | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Chargement des données
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Get lead data from the database
        const { data: leadData, error: leadError } = await supabase
          .from('fichier_donnees')
          .select('*, fichier:fichier_id(*)')
          .eq('id', leadId)
          .single();
          
        if (leadError) throw leadError;
        
        // Parse notes if they exist (stored as JSON string in the database)
        const leadRes = leadData as LeadData;
        const notesRes = leadData.notes 
          ? JSON.parse(leadData.notes as unknown as string) 
          : [];
        setLead(leadRes);
        setNotes(notesRes);
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données du lead',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (leadId) {
      loadData();
    }
  }, [leadId, toast]);

  // Gestion des mises à jour
  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!lead) return;
    
    try {
      await leadService.updateLeadData(leadId, { statut: newStatus });
      setLead({ ...lead, statut: newStatus });
      toast({
        title: 'Succès',
        description: 'Statut mis à jour avec succès',
      });
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !lead) return;
    
    try {
      // Add the note to the lead's notes array
      const updatedNotes = [...(lead.notes || []), {
        id: Date.now().toString(),
        contenu: newNote,
        type: 'interne',
        created_at: new Date().toISOString()
      }];
      
      // Update the lead with the new notes array
      // Store notes as a JSON string in the database
      await leadService.updateLeadData(leadId, { 
        notes: JSON.stringify(updatedNotes) 
      });
      
      // Update local state
      setLead({ ...lead, notes: updatedNotes });
      setNewNote('');
      
      toast({
        title: 'Succès',
        description: 'Note ajoutée avec succès',
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter la note',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-6">
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <p className="text-lg text-muted-foreground">Lead non trouvé</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => router.push('/leads')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const status = statusOptions.find(s => s.value === lead.statut) || 
                { label: lead.statut, color: 'bg-gray-100 text-gray-800' };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-6">
        <div className="container mx-auto space-y-6">
          {/* En-tête */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold">
                  {lead.nom} {lead.prenom}
                  {lead.entreprise && ` - ${lead.entreprise}`}
                </h1>
                <Badge className={status.color}>
                  {status.label}
                </Badge>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                <Pencil className="h-4 w-4 mr-2" />
                {isEditing ? 'Annuler' : 'Modifier'}
              </Button>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            
            {/* Contenu des onglets */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informations du contact</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Nom</Label>
                            <p>{lead.nom}</p>
                          </div>
                          <div>
                            <Label>Prénom</Label>
                            <p>{lead.prenom}</p>
                          </div>
                          <div>
                            <Label>Email</Label>
                            <p>{lead.email || 'Non renseigné'}</p>
                          </div>
                          <div>
                            <Label>Téléphone</Label>
                            <p>{lead.telephone || 'Non renseigné'}</p>
                          </div>
                        </div>
                        {lead.entreprise && (
                          <div>
                            <Label>Entreprise</Label>
                            <p>{lead.entreprise}</p>
                          </div>
                        )}
                        {lead.poste && (
                          <div>
                            <Label>Poste</Label>
                            <p>{lead.poste}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Statut</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select value={lead.statut} onValueChange={handleStatusChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="notes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Ajouter une note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        rows={3}
                      />
                      <div className="flex justify-end">
                        <Button onClick={handleAddNote}>
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter une note
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4 mt-6">
                      {notes.length > 0 ? (
                        notes.map((note) => (
                          <div key={note.id} className="border-b pb-4 mb-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">Utilisateur</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(note.created_at).toLocaleString('fr-FR')}
                                </p>
                              </div>
                            </div>
                            <p className="mt-2">{note.contenu}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">Aucune note pour le moment</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Historique</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Aucun historique disponible pour le moment.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Aucun document disponible pour le moment.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
