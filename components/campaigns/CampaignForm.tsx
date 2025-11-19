
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Campaign, 
  CampaignStatus, 
  CreateCampaignData, 
  CampaignFile 
} from '@/lib/types/campaign';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useTeams } from '@/hooks/useTeams';
import { useFileManager } from '@/hooks/useFileManager';
import { cn } from '@/lib/utils';
import { DatePickerField } from './DatePickerField';
import { Mail, MessageSquare, Phone, Share2, Megaphone, Radio, Users, Calendar, CalendarDays, Paperclip, Loader2, X, Save } from 'lucide-react';

interface ChannelOption {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const channelOptions: ChannelOption[] = [
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'sms', label: 'SMS', icon: MessageSquare },
  { id: 'appel sortant', label: 'Appels sortants', icon: Phone },
  { id: 'appel entrant', label: 'Appels entrants', icon: Phone },
  { id: 'reseau_social', label: 'Réseaux sociaux', icon: Share2 },
  { id: 'evenement', label: 'Événements', icon: Megaphone },
  { id: 'autre', label: 'Autre', icon: Radio },
];

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Octets";
  const k = 1024;
  const sizes = ["Octets", "Ko", "Mo", "Go"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Le nom de la campagne doit contenir au moins 2 caractères.',
  }),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']),
  start_date: z.date().nullable(),
  end_date: z.date().nullable(),
  budget: z.coerce.number().min(0).nullable(),
  channels: z.array(z.string()).default([]),
  target_audience: z.record(z.any()).optional(),
  team_id: z.string().uuid().nullable().optional(),
});

type CampaignFormValues = z.infer<typeof formSchema>;

interface CampaignFormProps {
  initialData?: Campaign;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CampaignForm({ initialData, onSuccess, onCancel }: CampaignFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { createCampaign, updateCampaign, loading, syncCampaignFilesComplete } = useCampaigns();
  const { teams, fetchTeams } = useTeams();
  const { files, isLoading: filesLoading } = useFileManager();
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const isEditMode = !!initialData;

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      status: (initialData?.status as CampaignStatus) || 'draft',
      start_date: initialData?.start_date ? new Date(initialData.start_date) : null,
      end_date: initialData?.end_date ? new Date(initialData.end_date) : null,
      budget: initialData?.budget || null,
      channels: initialData?.channels || [],
      target_audience: initialData?.target_audience || {},
      team_id: initialData?.team_id || null,
    },
  });

  useEffect(() => {
    fetchTeams().catch(() => {});
  }, []);

  // Gestion sélection fichiers
  const handleFileToggle = (fileId: string) => {
    setSelectedFileIds(prev =>
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  };
  const handleClearFiles = () => setSelectedFileIds([]);

  const onSubmit = async (data: CampaignFormValues) => {
    try {
      // Récupérer les objets fichiers complets basés sur les IDs sélectionnés
      const selectedFiles = files.filter(file => selectedFileIds.includes(file.id));
      
      // Convertir FileData en CampaignFile
      const campaignFiles: CampaignFile[] = selectedFiles.map(file => ({
        id: file.id,
        name: file.nom,
        file_url: file.chemin,
        file_type: file.mime_type,
        file_size: file.taille,
        created_at: file.date_import,
        updated_at: file.date_import,
      }));
      
      const campaignData: CreateCampaignData = {
        ...data,
        start_date: data.start_date?.toISOString() || null,
        end_date: data.end_date?.toISOString() || null,
        files: campaignFiles,
        associated_file_id: selectedFileIds.length > 0 ? selectedFileIds[0] : null,
        file_name: selectedFileIds.length > 0 ? selectedFiles[0]?.nom || null : null,
      };

      if (isEditMode && initialData) {
        await updateCampaign({
          id: initialData.id,
          ...campaignData,
        });
        
        // Mettre à jour aussi campaign_files et campaign_file_links pour la rétrocompatibilité
        if (selectedFileIds.length > 0) {
          try {
            await syncCampaignFilesComplete(initialData.id, selectedFileIds);
          } catch (fileError) {
            console.warn('Erreur lors de la synchronisation des fichiers:', fileError);
            // Ne pas bloquer la mise à jour si la liaison échoue
          }
        }
        
        toast({
          title: 'Campagne mise à jour',
          description: 'La campagne a été mise à jour avec succès.',
        });
      } else {
        const created = await createCampaign(campaignData);
        
        // Alimenter aussi campaign_files et campaign_file_links pour la rétrocompatibilité
        if (created?.id && selectedFileIds.length > 0) {
          try {
            await syncCampaignFilesComplete(created.id, selectedFileIds);
          } catch (fileError) {
            console.warn('Erreur lors de la synchronisation des fichiers:', fileError);
            // Ne pas bloquer la création si la liaison échoue
          }
        }
        
        toast({
          title: 'Campagne créée',
          description: 'La campagne a été créée avec succès.',
        });
      }
      
      if (onSuccess) onSuccess();
      if (onCancel) onCancel();
      
    } catch (error: any) {
      // Gérer les erreurs de nom dupliqué avec suggestion
      if (error.message && error.message.includes('Suggestion:')) {
        const match = error.message.match(/Suggestion: "([^"]+)"/);
        if (match) {
          const suggestedName = match[1];
          toast({
            title: 'Nom déjà utilisé',
            description: error.message,
            variant: 'destructive',
            action: (
              <Button
                onClick={() => form.setValue('name', suggestedName)}
                variant="outline"
                size="sm"
              >
                Utiliser la suggestion
              </Button>
            ),
          });
        } else {
          toast({
            title: 'Erreur',
            description: error.message,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Erreur',
          description: error.message || 'Une erreur est survenue',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête du formulaire */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">
          {isEditMode ? 'Modifier la campagne' : 'Créer une nouvelle campagne'}
        </h2>
        <p className="text-sm text-gray-600">
          {isEditMode 
            ? 'Modifiez les informations de votre campagne' 
            : 'Remplissez les informations pour créer une nouvelle campagne'
          }
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Section Informations principales */}
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de la campagne</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Campagne de lancement produit" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un statut" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              Brouillon
                            </div>
                          </SelectItem>
                          <SelectItem value="active">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              Active
                            </div>
                          </SelectItem>
                          <SelectItem value="paused">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              En pause
                            </div>
                          </SelectItem>
                          <SelectItem value="completed">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              Terminée
                            </div>
                          </SelectItem>
                          <SelectItem value="cancelled">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              Annulée
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="team_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Équipe assignée</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(v === 'none' ? null : v)}
                        value={field.value ?? 'none'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Aucune équipe (optionnel)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              Aucune équipe
                            </div>
                          </SelectItem>
                          {teams.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-blue-600" />
                                {t.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Décrivez les objectifs, le public cible et les détails de votre campagne..."
                        className="min-h-[120px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Section Planning */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Planning
              </CardTitle>
              <CardDescription>
                Définissez les dates de début et de fin de votre campagne
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DatePickerField
                    control={form.control}
                    name="start_date"
                    label="Date de début"
                    minDate={new Date()}
                    placeholder="Sélectionner une date de début"
                  />
                  <DatePickerField
                    control={form.control}
                    name="end_date"
                    label="Date de fin"
                    minDate={form.watch('start_date') || new Date()}
                    placeholder="Sélectionner une date de fin"
                    showDuration={true}
                    startDateFieldName="start_date"
                  />
                </div>
              
              {/* Informations complémentaires sur les dates */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <CalendarDays className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Conseils pour le planning</p>
                    <ul className="mt-1 text-xs space-y-1">
                      <li>• La date de début doit être antérieure à la date de fin</li>
                      <li>• Les dates ne peuvent pas être dans le passé</li>
                      <li>• Vous pourrez modifier ces dates ultérieurement</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

          {/* Section Canaux de diffusion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-blue-600" />
                Canaux de diffusion
              </CardTitle>
              <CardDescription>
                Sélectionnez les canaux que vous souhaitez utiliser pour cette campagne
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="channels"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {channelOptions.map((channel) => (
                        <FormField
                          key={channel.id}
                          control={form.control}
                          name="channels"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={channel.id}
                                className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-gray-50 transition-colors"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(channel.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, channel.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value: string) => value !== channel.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  <div className="flex items-center gap-2">
                                    <channel.icon className="h-4 w-4" />
                                    <span>{channel.label}</span>
                                  </div>
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Section Fichiers associés */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5 text-blue-600" />
                Fichiers associés
              </CardTitle>
              <CardDescription>
                Associez des fichiers importés à cette campagne
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filesLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin" />
                  <p className="text-sm">Chargement des fichiers...</p>
                </div>
              ) : files.length > 0 ? (
                <div className="space-y-4">
                  <div className="max-h-64 overflow-y-auto border rounded-lg">
                    <div className="p-2 space-y-1">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => handleFileToggle(file.id)}
                        >
                          <Checkbox
                            checked={selectedFileIds.includes(file.id)}
                            onCheckedChange={() => handleFileToggle(file.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.nom}
                            </p>
                            <p className="text-xs text-gray-500">
                              {file.mime_type} • {formatFileSize(file.taille || 0)} • {file.nb_lignes || 0} lignes
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Paperclip className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Aucun fichier disponible</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Importez des fichiers d'abord pour les associer à cette campagne
                  </p>
                </div>
              )}
              
              {selectedFileIds.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700">
                        {selectedFileIds.length} fichier{selectedFileIds.length > 1 ? 's' : ''} sélectionné{selectedFileIds.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClearFiles}
                      className="text-green-700 border-green-300 hover:bg-green-100"
                    >
                      Effacer
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="sticky bottom-0 bg-white border-t pt-4 mt-6">
            <div className="flex justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel || (() => router.back())}
                disabled={loading}
                className="flex items-center gap-2 px-6"
              >
                <X className="h-4 w-4" />
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="flex items-center gap-2 px-6 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isEditMode ? 'Mettre à jour' : 'Créer'} la campagne
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
