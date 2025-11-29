'use client';

import { useState } from 'react';
import { Lead, updateLead } from '@/lib/types/leads';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail, Phone, MapPin, Calendar, User, Building } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LeadInfoCardProps {
  lead: Lead;
  onUpdate: () => void;
}

const statusConfig = {
  nouveau: { label: 'Nouveau', color: 'bg-blue-500' },
  en_cours: { label: 'En cours', color: 'bg-yellow-500' },
  traite: { label: 'Traité', color: 'bg-green-500' },
  abandonne: { label: 'Abandonné', color: 'bg-red-500' },
};

export function LeadInfoCard({ lead, onUpdate }: LeadInfoCardProps) {
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    const { error } = await updateLead(lead.id, { statut: newStatus });
    
    if (error) {
      toast.error('Erreur lors de la mise à jour du statut');
    } else {
      toast.success('Statut mis à jour avec succès');
      onUpdate();
    }
    
    setUpdating(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Informations du lead</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Statut:</span>
            <Select
              value={lead.statut}
              onValueChange={handleStatusChange}
              disabled={updating}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${config.color}`} />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {lead.email && (
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Email</p>
                <p className="text-sm font-medium">{lead.email}</p>
              </div>
            </div>
          )}

          {lead.telephone && (
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Téléphone</p>
                <p className="text-sm font-medium">{lead.telephone}</p>
              </div>
            </div>
          )}

          {lead.adresse && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Adresse</p>
                <p className="text-sm font-medium">{lead.adresse}</p>
              </div>
            </div>
          )}

          {lead.users_profile && (
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Agent assigné</p>
                <p className="text-sm font-medium">
                  {lead.users_profile.nom} {lead.users_profile.prenom}
                </p>
              </div>
            </div>
          )}

          {lead.entreprise && (
            <div className="flex items-start gap-3">
              <Building className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Entreprise</p>
                <p className="text-sm font-medium">{lead.entreprise}</p>
              </div>
            </div>
          )}

          {lead.created_at && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Date de création</p>
                <p className="text-sm font-medium">
                  {format(new Date(lead.created_at), 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>
          )}
        </div>

        {lead.notes && (
          <div className="pt-4 border-t">
            <p className="text-sm text-slate-500 mb-2">Notes initiales</p>
            <p className="text-sm">{lead.notes}</p>
          </div>
        )}

        {Object.keys(lead).some(key => 
          !['id', 'nom', 'prenom', 'email', 'telephone', 'adresse', 'entreprise', 
            'statut', 'notes', 'created_at', 'updated_at', 'agent_id', 'users_profile'].includes(key)
        ) && (
          <div className="pt-4 border-t">
            <p className="text-sm text-slate-500 mb-2">Champs personnalisés</p>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(lead).map(([key, value]) => {
                if (['id', 'nom', 'prenom', 'email', 'telephone', 'adresse', 'entreprise', 
                     'statut', 'notes', 'created_at', 'updated_at', 'agent_id', 'users_profile'].includes(key)) {
                  return null;
                }
                return (
                  <div key={key}>
                    <p className="text-xs text-slate-500">{key}</p>
                    <p className="text-sm font-medium">{String(value)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
