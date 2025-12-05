'use client'

import { useEffect, useState } from 'react'
import { Webhook, WebhookEventType, WebhookStatus } from '@/types/webhooks'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

interface WebhookDialogProps {
  open: boolean;
  webhook?: Webhook;
  onClose: () => void;
  onSave: () => void;
}

const EVENT_TYPES: { value: WebhookEventType; label: string; description: string }[] = [
  { value: 'lead.created', label: 'Lead créé', description: 'Déclenché quand un nouveau lead est créé' },
  { value: 'lead.updated', label: 'Lead mis à jour', description: 'Déclenché quand un lead est modifié' },
  { value: 'lead.deleted', label: 'Lead supprimé', description: 'Déclenché quand un lead est supprimé' },
  { value: 'lead.status_changed', label: 'Statut du lead changé', description: 'Déclenché quand le statut d\'un lead change' },
  { value: 'appointment.created', label: 'RDV créé', description: 'Déclenché quand un rendez-vous est créé' },
  { value: 'appointment.updated', label: 'RDV mis à jour', description: 'Déclenché quand un rendez-vous est modifié' },
  { value: 'appointment.cancelled', label: 'RDV annulé', description: 'Déclenché quand un rendez-vous est annulé' },
  { value: 'file.uploaded', label: 'Fichier uploadé', description: 'Déclenché quand un fichier est uploadé' },
  { value: 'file.deleted', label: 'Fichier supprimé', description: 'Déclenché quand un fichier est supprimé' },
];

export function WebhookDialog({ open, webhook, onClose, onSave }: WebhookDialogProps) {
  const [formData, setFormData] = useState<{
    name: string
    url: string
    description: string
    status: WebhookStatus
    events: WebhookEventType[]
    headers: string
    transform_enabled: boolean
    transform_script: string
    retry_enabled: boolean
    max_retries: number
    retry_delay: number
    timeout: number
  }>({
    name: '',
    url: '',
    description: '',
    status: 'active',
    events: [],
    headers: '{}',
    transform_enabled: false,
    transform_script: '',
    retry_enabled: true,
    max_retries: 3,
    retry_delay: 5,
    timeout: 30000,
  });
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (webhook) {
      setFormData({
        name: webhook.name,
        url: webhook.url,
        description: webhook.description || '',
        status: webhook.status,
        events: webhook.events,
        headers: JSON.stringify(webhook.headers || {}, null, 2),
        transform_enabled: webhook.transform_enabled,
        transform_script: webhook.transform_script || '',
        retry_enabled: webhook.retry_enabled,
        max_retries: webhook.max_retries,
        retry_delay: webhook.retry_delay,
        timeout: webhook.timeout,
      });
    } else {
      setFormData({
        name: '',
        url: '',
        description: '',
        status: 'active',
        events: [],
        headers: '{}',
        transform_enabled: false,
        transform_script: '',
        retry_enabled: true,
        max_retries: 3,
        retry_delay: 5,
        timeout: 30000,
      });
    }
  }, [webhook]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.url || formData.events.length === 0) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setSaving(true);
      let headers;
      try {
        headers = JSON.parse(formData.headers);
      } catch {
        toast.error('Format JSON invalide pour les en-têtes');
        return;
      }

      const data = {
        name: formData.name,
        url: formData.url,
        description: formData.description,
        status: formData.status,
        events: formData.events,
        headers,
        transform_enabled: formData.transform_enabled,
        transform_script: formData.transform_script,
        retry_enabled: formData.retry_enabled,
        max_retries: formData.max_retries,
        retry_delay: formData.retry_delay,
        timeout: formData.timeout,
      };

      const url = webhook ? `/api/webhooks/${webhook.id}` : '/api/webhooks';
      const method = webhook ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to save webhook');

      toast.success(webhook ? 'Webhook mis à jour' : 'Webhook créé');
      onSave();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement du webhook');
    } finally {
      setSaving(false);
    }
  };

  const toggleEvent = (event: WebhookEventType) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {webhook ? 'Modifier le webhook' : 'Nouveau webhook'}
          </DialogTitle>
          <DialogDescription>
            Configurez votre webhook pour recevoir des notifications en temps réel
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="events">Événements</TabsTrigger>
            <TabsTrigger value="transform">Transformation</TabsTrigger>
            <TabsTrigger value="advanced">Avancé</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Mon intégration"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com/webhook"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description de l'intégration..."
                rows={3}
              />
            </div>

            {webhook && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Clé secrète</CardTitle>
                  <CardDescription>
                    Utilisez cette clé pour vérifier l'authenticité des webhooks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-slate-100 rounded text-sm font-mono">
                      {showSecret ? webhook.secret_key : '••••••••••••••••'}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <p className="text-sm text-slate-600">
              Sélectionnez les événements qui déclencheront ce webhook *
            </p>
            <div className="space-y-3">
              {EVENT_TYPES.map((event) => (
                <div key={event.value} className="flex items-start space-x-3">
                  <Checkbox
                    id={event.value}
                    checked={formData.events.includes(event.value)}
                    onCheckedChange={() => toggleEvent(event.value)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={event.value} className="font-medium cursor-pointer">
                      {event.label}
                    </Label>
                    <p className="text-sm text-slate-500">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="transform" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Activer la transformation</Label>
                <p className="text-sm text-slate-500">
                  Transformez le payload avant l'envoi
                </p>
              </div>
              <Switch
                checked={formData.transform_enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, transform_enabled: checked })
                }
              />
            </div>

            {formData.transform_enabled && (
              <div className="space-y-2">
                <Label htmlFor="transform_script">Script de transformation (JavaScript)</Label>
                <Textarea
                  id="transform_script"
                  value={formData.transform_script}
                  onChange={(e) => setFormData({ ...formData, transform_script: e.target.value })}
                  placeholder="return { ...payload, custom_field: 'value' };"
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-slate-500">
                  Le payload est disponible via la variable <code>payload</code>. Retournez le nouveau payload transformé.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="headers">En-têtes HTTP personnalisés (JSON)</Label>
              <Textarea
                id="headers"
                value={formData.headers}
                onChange={(e) => setFormData({ ...formData, headers: e.target.value })}
                placeholder='{"Authorization": "Bearer token"}'
                rows={4}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Activer les tentatives de relance</Label>
                <p className="text-sm text-slate-500">
                  Réessayer automatiquement en cas d'échec
                </p>
              </div>
              <Switch
                checked={formData.retry_enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, retry_enabled: checked })
                }
              />
            </div>

            {formData.retry_enabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="max_retries">Nombre maximum de tentatives</Label>
                  <Input
                    id="max_retries"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.max_retries}
                    onChange={(e) => setFormData({ ...formData, max_retries: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retry_delay">Délai initial (secondes)</Label>
                  <Input
                    id="retry_delay"
                    type="number"
                    min="1"
                    value={formData.retry_delay}
                    onChange={(e) => setFormData({ ...formData, retry_delay: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-slate-500">
                    Le délai double à chaque tentative (backoff exponentiel)
                  </p>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (millisecondes)</Label>
              <Input
                id="timeout"
                type="number"
                min="1000"
                value={formData.timeout}
                onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) })}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
