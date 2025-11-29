'use client';

import { useState } from 'react';
import { Lead, updateLead, deleteLead } from '@/lib/types/leads';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, Trash2, Phone, Mail, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LeadInfoCard } from './LeadInfoCard';
import { ActivityTimeline } from './ActivityTimeline';
import { NotesSection } from './NotesSection';
import { AttachmentsSection } from './AttachmentsSection';
import { StatusHistorySection } from './StatusHistorySection';
import { CommunicationPanel } from './CommunicationPanel';
import { LeadEditDialog } from './LeadEditDialog';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface LeadDetailViewProps {
  lead: Lead;
  onUpdate: () => void;
}

export function LeadDetailView({ lead, onUpdate }: LeadDetailViewProps) {
  const router = useRouter();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await deleteLead(lead.id);
    
    if (error) {
      toast.error('Erreur lors de la suppression du lead');
      setDeleting(false);
      return;
    }

    toast.success('Lead supprimé avec succès');
    router.push('/dashboard/leads');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/dashboard/leads')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {lead.nom} {lead.prenom}
            </h1>
            <p className="text-sm text-slate-500">Lead ID: {lead.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setEditDialogOpen(true)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <LeadInfoCard lead={lead} onUpdate={onUpdate} />

          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="attachments">Pièces jointes</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="space-y-4">
              <ActivityTimeline leadId={lead.id} />
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <NotesSection leadId={lead.id} />
            </TabsContent>

            <TabsContent value="attachments" className="space-y-4">
              <AttachmentsSection leadId={lead.id} />
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <StatusHistorySection leadId={lead.id} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <CommunicationPanel lead={lead} />
        </div>
      </div>

      <LeadEditDialog
        lead={lead}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={onUpdate}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le lead</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce lead ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
