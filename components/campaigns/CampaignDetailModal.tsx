"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Users, DollarSign, Mail, Phone, MessageSquare, Share2, Megaphone, Calendar, Paperclip, Edit, Trash2, X, Eye } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Campaign, CampaignFile } from "@/lib/types/campaign";

interface CampaignDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | null;
  campaignFiles?: CampaignFile[];
  onEdit?: (campaign: Campaign) => void;
  onDelete?: (campaignId: string) => void;
  onPreviewFile?: (file: CampaignFile) => void;
}

const statusConfig = {
  draft: { label: "Brouillon", variant: "secondary" as const, color: "bg-gray-100 text-gray-800" },
  active: { label: "Active", variant: "default" as const, color: "bg-green-100 text-green-800" },
  paused: { label: "En pause", variant: "outline" as const, color: "bg-yellow-100 text-yellow-800" },
  completed: { label: "Terminée", variant: "default" as const, color: "bg-blue-100 text-blue-800" },
  cancelled: { label: "Annulée", variant: "destructive" as const, color: "bg-red-100 text-red-800" },
};

const channelIcons = {
  email: Mail,
  sms: MessageSquare,
  "appel sortant": Phone,
  "appel entrant": Phone,
  reseau_social: Share2,
  publicite: Megaphone,
  evenement: Calendar,
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Octets";
  const k = 1024;
  const sizes = ["Octets", "Ko", "Mo", "Go"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getFileIcon = (fileType: string) => {
  if (fileType.includes("pdf")) return "📄";
  if (fileType.includes("image")) return "🖼️";
  if (fileType.includes("word") || fileType.includes("document")) return "📝";
  if (fileType.includes("excel") || fileType.includes("spreadsheet")) return "📊";
  if (fileType.includes("powerpoint") || fileType.includes("presentation")) return "📈";
  return "📎";
};

export function CampaignDetailModal({ 
  isOpen, 
  onClose, 
  campaign, 
  campaignFiles = [],
  onEdit,
  onDelete,
  onPreviewFile
}: CampaignDetailModalProps) {
  if (!campaign) return null;

  const statusInfo = statusConfig[campaign.status as keyof typeof statusConfig] || statusConfig.draft;
  const StatusIcon = statusInfo.variant === "default" ? CalendarDays : CalendarDays;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(campaign);
      onClose();
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm("Êtes-vous sûr de vouloir supprimer cette campagne ?")) {
      onDelete(campaign.id);
      onClose();
    }
  };

  const channels = campaign.target_audience?.channels || [];
  const assignedTeam = campaign.target_audience?.assigned_team || null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex-1">
            <DialogTitle className="text-2xl font-bold">{campaign.name}</DialogTitle>
            <DialogDescription className="mt-2">
              Détails complets de la campagne
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Modifier
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Statut et informations principales */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <StatusIcon className="h-5 w-5" />
                  Informations principales
                </CardTitle>
                <Badge className={cn("px-3 py-1", statusInfo.color)}>
                  {statusInfo.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-gray-500 mb-1">Description</h4>
                <p className="text-gray-700">
                  {campaign.description || "Aucune description fournie"}
                </p>
              </div>
              
              {campaign.budget && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Budget:</span>
                  <span className="text-green-600 font-semibold">
                    {campaign.budget.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Créée le:</span>
                  <p className="font-medium">
                    {format(new Date(campaign.created_at), "dd MMMM yyyy à HH:mm", {
                      locale: fr,
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Modifiée le:</span>
                  <p className="font-medium">
                    {format(new Date(campaign.updated_at), "dd MMMM yyyy à HH:mm", {
                      locale: fr,
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Planning */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Planning
              </CardTitle>
              <CardDescription>
                Période de déroulement de la campagne
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-2">Date de début</h4>
                  {campaign.start_date ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">
                        {format(new Date(campaign.start_date), "dd MMMM yyyy", {
                          locale: fr,
                        })}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400">Non définie</span>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-2">Date de fin</h4>
                  {campaign.end_date ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-red-600" />
                      <span className="font-medium">
                        {format(new Date(campaign.end_date), "dd MMMM yyyy", {
                          locale: fr,
                        })}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400">Non définie</span>
                  )}
                </div>
              </div>
              
              {campaign.start_date && campaign.end_date && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Durée:{" "}
                    {Math.ceil(
                      (new Date(campaign.end_date).getTime() - 
                       new Date(campaign.start_date).getTime()) / 
                      (1000 * 60 * 60 * 24)
                    )} jours
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Canaux de diffusion */}
          {channels.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Canaux de diffusion
                </CardTitle>
                <CardDescription>
                  Canaux utilisés pour cette campagne
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {channels.map((channel: string) => {
                    const IconComponent = channelIcons[channel as keyof typeof channelIcons];
                    return (
                      <Badge
                        key={channel}
                        variant="outline"
                        className="flex items-center gap-1 px-3 py-1"
                      >
                        {IconComponent && <IconComponent className="h-3 w-3" />}
                        {channel}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Équipe assignée */}
          {assignedTeam && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Équipe assignée
                </CardTitle>
                <CardDescription>
                  Équipe responsable de cette campagne
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">{assignedTeam}</p>
                    <p className="text-sm text-gray-500">Équipe assignée</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fichiers associés */}
          {campaignFiles.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  Fichiers associés
                </CardTitle>
                <CardDescription>
                  Documents et ressources liés à cette campagne
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {campaignFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getFileIcon(file.file_type)}</span>
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.file_size)} •{" "}
                            {format(new Date(file.created_at), "dd MMM yyyy", {
                              locale: fr,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {onPreviewFile && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPreviewFile(file)}
                            className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Aperçu
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistiques */}
          {(campaign.total_leads !== undefined || campaign.converted_leads !== undefined) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Statistiques</CardTitle>
                <CardDescription>
                  Performance de la campagne
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {campaign.total_leads !== undefined && (
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {campaign.total_leads}
                      </p>
                      <p className="text-sm text-gray-600">Leads générés</p>
                    </div>
                  )}
                  {campaign.converted_leads !== undefined && (
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {campaign.converted_leads}
                      </p>
                      <p className="text-sm text-gray-600">Conversions</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}