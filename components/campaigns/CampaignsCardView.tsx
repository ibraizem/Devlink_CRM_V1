"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Campaign, CampaignStatus } from '@/lib/types/campaign';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Target,
  ArrowRight,
  MoreVertical,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CampaignsCardViewProps {
  campaigns: Campaign[];
  onView: (campaign: Campaign) => void;
  onEdit: (campaign: Campaign) => void;
  onDelete: (campaignId: string) => void;
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800 border-gray-200',
  active: 'bg-blue-100 text-blue-800 border-blue-200',
  paused: 'bg-amber-100 text-amber-800 border-amber-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels = {
  draft: 'Brouillon',
  active: 'Active',
  paused: 'En pause',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

export function CampaignsCardView({ campaigns, onView, onEdit, onDelete }: CampaignsCardViewProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Non défini';
    return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-amber-500';
    return 'bg-gray-400';
  };

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Target className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune campagne trouvée</h3>
        <p className="text-gray-500">Commencez par créer votre première campagne</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {campaigns.map((campaign) => {
        const progress = campaign.progress || 0;
        const daysRemaining = getDaysRemaining(campaign.end_date);
        
        return (
          <Card 
            key={campaign.id} 
            className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-white/80 backdrop-blur-sm hover:scale-[1.02] cursor-pointer overflow-hidden"
            onClick={() => onView(campaign)}
          >
            {/* En-tête avec statut */}
            <div className="relative">
              <div className="absolute top-4 right-4 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/50">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(campaign); }}>
                      <Eye className="h-4 w-4 mr-2" />
                      Voir les détails
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(campaign); }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); onDelete(campaign.id); }}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-600"></div>
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {campaign.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {campaign.description || 'Aucune description'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-3">
                  <Badge className={`${statusColors[campaign.status]} text-xs font-medium`}>
                    {statusLabels[campaign.status]}
                  </Badge>
                  {daysRemaining !== null && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span className={daysRemaining < 0 ? 'text-red-500' : daysRemaining <= 7 ? 'text-amber-500' : ''}>
                        {daysRemaining < 0 ? `En retard de ${Math.abs(daysRemaining)}j` : 
                         daysRemaining === 0 ? 'Dernier jour' : 
                         `${daysRemaining}j restants`}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
            </div>

            <CardContent className="pt-0 space-y-4">
              {/* Progression */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progression</span>
                  <span className="text-sm font-semibold text-blue-600">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${getProgressColor(progress)}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Informations clés */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="p-1.5 bg-blue-50 rounded">
                    <Calendar className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Début</p>
                    <p className="font-medium text-gray-700">{formatDate(campaign.start_date)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <div className="p-1.5 bg-purple-50 rounded">
                    <Calendar className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Fin</p>
                    <p className="font-medium text-gray-700">{formatDate(campaign.end_date)}</p>
                  </div>
                </div>
              </div>

              {/* Budget et équipe */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                {campaign.budget && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-gray-700">
                      {new Intl.NumberFormat('fr-FR', { 
                        style: 'currency', 
                        currency: 'EUR',
                        maximumFractionDigits: 0
                      }).format(campaign.budget)}
                    </span>
                  </div>
                )}
                
                {campaign.team_id && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Users className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-gray-700">Équipe #{campaign.team_id}</span>
                  </div>
                )}
              </div>

              {/* Bouton d'action */}
              <Button 
                variant="outline" 
                className="w-full group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors"
                onClick={(e) => { e.stopPropagation(); onView(campaign); }}
              >
                <span>Voir les détails</span>
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
