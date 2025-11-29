'use client';

import { useState } from 'react';
import { Lead, logCommunication } from '@/lib/types/leads';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Mail, MessageCircle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface CommunicationPanelProps {
  lead: Lead;
}

type CommunicationType = 'appel' | 'email' | 'whatsapp' | 'sms';

export function CommunicationPanel({ lead }: CommunicationPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [commType, setCommType] = useState<CommunicationType>('appel');
  const [description, setDescription] = useState('');
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const openDialog = (type: CommunicationType) => {
    setCommType(type);
    setDescription('');
    setMetadata({});
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!description.trim()) {
      toast.error('Veuillez entrer une description');
      return;
    }

    setSaving(true);
    const { error } = await logCommunication(lead.id, commType, description, metadata);
    
    if (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } else {
      toast.success('Communication enregistrée avec succès');
      setDialogOpen(false);
    }
    
    setSaving(false);
  };

  const communicationButtons = [
    {
      type: 'appel' as CommunicationType,
      icon: Phone,
      label: 'Appel',
      color: 'bg-orange-500 hover:bg-orange-600',
      disabled: !lead.telephone,
    },
    {
      type: 'email' as CommunicationType,
      icon: Mail,
      label: 'Email',
      color: 'bg-red-500 hover:bg-red-600',
      disabled: !lead.email,
    },
    {
      type: 'whatsapp' as CommunicationType,
      icon: MessageCircle,
      label: 'WhatsApp',
      color: 'bg-green-600 hover:bg-green-700',
      disabled: !lead.telephone,
    },
    {
      type: 'sms' as CommunicationType,
      icon: MessageSquare,
      label: 'SMS',
      color: 'bg-blue-600 hover:bg-blue-700',
      disabled: !lead.telephone,
    },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Actions de communication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {communicationButtons.map(({ type, icon: Icon, label, color, disabled }) => (
            <Button
              key={type}
              onClick={() => openDialog(type)}
              disabled={disabled}
              className={`w-full ${color} text-white`}
              variant={disabled ? 'outline' : 'default'}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Informations de contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {lead.telephone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-slate-400" />
              <div className="flex-1">
                <p className="text-xs text-slate-500">Téléphone</p>
                <a href={`tel:${lead.telephone}`} className="text-sm hover:underline">
                  {lead.telephone}
                </a>
              </div>
            </div>
          )}

          {lead.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-slate-400" />
              <div className="flex-1">
                <p className="text-xs text-slate-500">Email</p>
                <a href={`mailto:${lead.email}`} className="text-sm hover:underline">
                  {lead.email}
                </a>
              </div>
            </div>
          )}

          {lead.telephone && (
            <>
              <div className="flex items-center gap-3">
                <MessageCircle className="h-4 w-4 text-slate-400" />
                <div className="flex-1">
                  <p className="text-xs text-slate-500">WhatsApp</p>
                  <a
                    href={`https://wa.me/${lead.telephone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:underline"
                  >
                    Ouvrir WhatsApp
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-slate-400" />
                <div className="flex-1">
                  <p className="text-xs text-slate-500">SMS</p>
                  <a href={`sms:${lead.telephone}`} className="text-sm hover:underline">
                    Envoyer SMS
                  </a>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Enregistrer {commType === 'appel' ? 'un appel' : 
                          commType === 'email' ? 'un email' :
                          commType === 'whatsapp' ? 'un message WhatsApp' :
                          'un SMS'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {commType === 'appel' && (
              <div>
                <Label htmlFor="duree">Durée de l'appel</Label>
                <Input
                  id="duree"
                  placeholder="ex: 5 minutes"
                  value={metadata.duree || ''}
                  onChange={(e) => setMetadata({ ...metadata, duree: e.target.value })}
                />
              </div>
            )}

            <div>
              <Label htmlFor="description">Description / Notes</Label>
              <Textarea
                id="description"
                placeholder="Décrivez la communication..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            {commType === 'appel' && (
              <div>
                <Label htmlFor="resultat">Résultat de l'appel</Label>
                <Input
                  id="resultat"
                  placeholder="ex: Intéressé, Rappeler plus tard, etc."
                  value={metadata.resultat || ''}
                  onChange={(e) => setMetadata({ ...metadata, resultat: e.target.value })}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
