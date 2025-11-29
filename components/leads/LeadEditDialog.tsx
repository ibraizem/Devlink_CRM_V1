'use client';

import { useState, useEffect } from 'react';
import { Lead, updateLead, getAgents } from '@/lib/types/leads';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface LeadEditDialogProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function LeadEditDialog({ lead, open, onOpenChange, onSuccess }: LeadEditDialogProps) {
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [agents, setAgents] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData({
        nom: lead.nom,
        prenom: lead.prenom,
        email: lead.email,
        telephone: lead.telephone,
        adresse: lead.adresse,
        entreprise: lead.entreprise,
        notes: lead.notes,
        agent_id: lead.agent_id,
      });
      loadAgents();
    }
  }, [open, lead]);

  const loadAgents = async () => {
    const { data } = await getAgents();
    if (data) setAgents(data);
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateLead(lead.id, formData);
    
    if (error) {
      toast.error('Erreur lors de la mise à jour du lead');
    } else {
      toast.success('Lead mis à jour avec succès');
      onSuccess();
      onOpenChange(false);
    }
    
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le lead</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                value={formData.nom || ''}
                onChange={(e) => handleChange('nom', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="prenom">Prénom</Label>
              <Input
                id="prenom"
                value={formData.prenom || ''}
                onChange={(e) => handleChange('prenom', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                value={formData.telephone || ''}
                onChange={(e) => handleChange('telephone', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="adresse">Adresse</Label>
            <Input
              id="adresse"
              value={formData.adresse || ''}
              onChange={(e) => handleChange('adresse', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="entreprise">Entreprise</Label>
            <Input
              id="entreprise"
              value={formData.entreprise || ''}
              onChange={(e) => handleChange('entreprise', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="agent">Agent assigné</Label>
            <Select
              value={formData.agent_id || ''}
              onValueChange={(value) => handleChange('agent_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.nom} {agent.prenom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
