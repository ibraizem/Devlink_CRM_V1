'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Shield, Activity, AlertTriangle, Save, X, Camera, Eye, EyeOff, RefreshCw, CircleUser, Building, Users, Target, FileText } from 'lucide-react';
import { avatarService } from '@/lib/services/avatarService';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { userService } from '@/lib/services/userService';
import { useUserActivities } from '@/hooks/useUserActivities';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';

type TabValue = 'profile' | 'settings' | 'security' | 'activity' | 'danger' | 'organization';

interface UserProfileData {
  id: string;
  email: string;
  nom: string | null;
  prenom: string | null;
  avatar_url: string | null;
  role: string;
  actif: boolean;
  telephone: string | null;
  created_at: string;
  updated_at: string;
}

interface UserProfileProps {
  initialTab?: TabValue;
}

// Interfaces pour les données de l'organisation
interface OrganizationUser {
  id: string;
  email: string;
  nom: string | null;
  prenom: string | null;
  avatar_url: string | null;
  role: 'admin' | 'manager' | 'commercial';
  actif: boolean;
  telephone: string | null;
  created_at: string;
  updated_at: string;
}

interface OrganizationTeam {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  leader_id: string | null;
}

interface OrganizationCampaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  team_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface OrganizationFile {
  id: string;
  nom: string;
  type: string;
  nb_lignes: number;
  statut: string;
  date_import: string;
  created_by: string | null;
}

export function UserProfile({ initialTab }: UserProfileProps = {}) {
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab || 'profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<Partial<UserProfileData>>({});
  
  // État pour le formulaire de changement de mot de passe
  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  
  // Utilisation du hook pour les activités
  const activities = useUserActivities(userData.id || '', 10);
  
  // Vérification des permissions admin
  const { isAdmin, loading: permissionsLoading } = usePermissions();

  // Fonctions utilitaires pour formater les activités
  const getActivityTitle = (activityType: string) => {
    switch (activityType) {
      case 'login':
        return 'Connexion réussie';
      case 'password_change':
        return 'Mot de passe modifié';
      case 'profile_update':
        return 'Profil mis à jour';
      case 'email_verification':
        return 'Email vérifié';
      default:
        return 'Activité enregistrée';
    }
  };

  const getActivityDescription = (details: any) => {
    if (details?.ip_address) {
      return `Depuis l'adresse IP: ${details.ip_address}`;
    }
    return 'Activité enregistrée';
  };

  // Fonction pour formater la date relative
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    }
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    role: 'user',
    actif: true,
    avatar_url: null as string | null
  });
  
  // Utilisation de l'instance supabase importée

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Récupérer les données du profil utilisateur
          const { data: profile, error } = await supabase
            .from('users_profile')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) throw error;
          
          if (profile) {
            setUserData(profile);
            setFormData({
              nom: profile.nom || '',
              prenom: profile.prenom || '',
              email: profile.email,
              telephone: profile.telephone || '',
              role: profile.role,
              actif: profile.actif,
              avatar_url: profile.avatar_url
            });
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        toast.error('Erreur lors du chargement du profil');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // Utiliser le service d'avatar pour gérer le téléchargement
      const { publicUrl, filePath } = await avatarService.uploadAvatar(userData.id || '', file);

      // Mettre à jour l'avatar dans le formulaire
      setFormData(prev => ({
        ...prev,
        avatar_url: filePath // Stocker le filePath pour pouvoir générer l'URL plus tard
      }));

      // Mettre à jour l'avatar dans l'état utilisateur
      if (userData) {
        setUserData({
          ...userData,
          avatar_url: filePath // Stocker le filePath pour pouvoir générer l'URL plus tard
        });
      }

      toast.success('Avatar mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors du téléchargement de l\'avatar:', error);
      toast.error('Erreur lors de la mise à jour de l\'avatar');
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('users_profile')
        .update({
          nom: formData.nom,
          prenom: formData.prenom,
          telephone: formData.telephone,
          avatar_url: formData.avatar_url,
          actif: formData.actif,
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.id);

      if (error) throw error;

      // Mettre à jour les données utilisateur
      setUserData(prev => ({
        ...prev,
        ...formData
      }));

      setIsEditing(false);
      toast.success('Profil mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast.error('Erreur lors de la mise à jour du profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Réinitialiser le formulaire avec les données utilisateur actuelles
    if (userData) {
      setFormData({
        nom: userData.nom || '',
        prenom: userData.prenom || '',
        email: userData.email || '',
        telephone: userData.telephone || '',
        role: userData.role || 'user',
        actif: userData.actif ?? true,
        avatar_url: userData.avatar_url || null
      });
    }
    setIsEditing(false);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setChangePasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    // Validation
    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      setPasswordError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (changePasswordData.newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    try {
      setIsLoading(true);
      
      // Vérifier d'abord le mot de passe actuel en se reconnectant
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email || '',
        password: changePasswordData.currentPassword
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Le mot de passe actuel est incorrect');
        }
        throw signInError;
      }

      // Si la vérification est réussie, mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: changePasswordData.newPassword
      });

      if (updateError) throw updateError;

      // Enregistrer l'activité de changement de mot de passe
      if (userData.id) {
        try {
          await userService.logActivity(userData.id, 'password_change', {
            ip_address: null, // Vous pouvez ajouter l'IP ici si nécessaire
            user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
          });
          console.log('Activité de changement de mot de passe enregistrée');
        } catch (activityError) {
          console.error('Erreur lors de l\'enregistrement de l\'activité:', activityError);
          // On continue même en cas d'erreur d'enregistrement de l'activité
        }
      }

      // Réinitialiser le formulaire
      setChangePasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      setPasswordSuccess('Votre mot de passe a été mis à jour avec succès');
      
      // Effacer le message de succès après 5 secondes
      setTimeout(() => {
        setPasswordSuccess(null);
      }, 5000);

    } catch (error: any) {
      console.error('Erreur lors du changement de mot de passe:', error);
      setPasswordError(error.message || 'Une erreur est survenue lors du changement de mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête du profil */}
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:items-start">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage 
                src={(() => {
                  let avatarUrl = formData.avatar_url || '';
                  
                  // Si avatar_url est une URL complète, extraire le chemin relatif
                  if (avatarUrl.includes('storage/v1/object/public/user_avatars/')) {
                    avatarUrl = avatarUrl.replace('https://nzlwbtslfljjkozzyaej.supabase.co/storage/v1/object/public/user_avatars/', '');
                  }
                  
                  // Ne retourner une URL que si avatar_url n'est pas vide
                  return avatarUrl ? avatarService.getAvatarUrl(avatarUrl) || '' : '';
                })()} 
                alt={`${formData.prenom ?? ''} ${formData.nom ?? ''}`} 
                onError={(e) => {
                  console.error('Avatar image failed to load:', e.currentTarget.src);
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={() => {
                  console.log('Avatar image loaded successfully');
                }}
              />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-700 text-white text-2xl">
                {formData.prenom?.[0] || ''}{formData.nom?.[0] || ''}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleAvatarUpload}
                />
                <Camera className="h-4 w-4" />
              </label>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {formData.prenom ?? ''} {formData.nom ?? ''}
            </h1>
            <p className="text-gray-600">{formData.email}</p>
            {userData?.created_at && (
              <p className="text-sm text-gray-500">
                Membre depuis {new Date(userData.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </p>
            )}
            <div className="mt-1 flex items-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                formData.role === 'admin' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {formData.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
              </span>
              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                formData.actif 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {formData.actif ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer les modifications
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Modifier le profil
            </Button>
          )}
        </div>
      </div>

      {/* Navigation par onglets */}
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as TabValue)}
        className="w-full"
      >
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <CircleUser className="h-4 w-4" />
            <span className="hidden sm:inline">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span className="hidden sm:inline">Paramètres</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Sécurité</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Activité</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="organization" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span className="hidden sm:inline">Organisation</span>
            </TabsTrigger>
          )}
          <TabsTrigger 
            value="danger" 
            className="flex items-center gap-2 text-red-600 data-[state=active]:text-red-600 data-[state=active]:border-red-600"
          >
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Zone de danger</span>
          </TabsTrigger>
        </TabsList>

        {/* Contenu des onglets */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Gérez vos informations personnelles et coordonnées.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input 
                    id="prenom" 
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom</Label>
                  <Input 
                    id="nom" 
                    name="nom"
                    value={formData.nom}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <div className="flex">
                  <Input 
                    id="email" 
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={cn(
                      "disabled:opacity-100",
                      isEditing ? "rounded-r-none" : ""
                    )}
                  />
                  {isEditing && (
                    <Button 
                      variant="outline" 
                      className="rounded-l-none border-l-0"
                      onClick={() => {}}
                    >
                      Changer
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input 
                  id="telephone" 
                  name="telephone"
                  type="tel"
                  value={formData.telephone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
              {isEditing && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="actif"
                      name="actif"
                      checked={formData.actif}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, actif: checked }))
                      }
                    />
                    <Label htmlFor="actif">
                      {formData.actif ? 'Compte actif' : 'Compte désactivé'}
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500">
                    {formData.actif 
                      ? 'L\'utilisateur peut se connecter et utiliser l\'application.'
                      : 'L\'utilisateur ne pourra plus se connecter.'}
                  </p>
                </div>
              )}
            </CardContent>
            {isEditing && (
              <CardFooter className="flex justify-end space-x-2 border-t px-6 py-4">
                <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres</CardTitle>
              <CardDescription>
                Personnalisez vos préférences d'application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Notifications par email</Label>
                      <p className="text-sm text-muted-foreground">Recevoir des notifications par email</p>
                    </div>
                    <Switch id="email-notifications" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-notifications">Notifications push</Label>
                      <p className="text-sm text-muted-foreground">Activer les notifications push</p>
                    </div>
                    <Switch id="push-notifications" defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Sécurité du compte</CardTitle>
              <CardDescription>
                Gérez la sécurité de votre compte et vos identifiants de connexion.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Changer de mot de passe</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Mettez à jour votre mot de passe pour sécuriser votre compte.
                    </p>
                    
                    {passwordError && (
                      <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
                        {passwordError}
                      </div>
                    )}
                    
                    {passwordSuccess && (
                      <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-md">
                        {passwordSuccess}
                      </div>
                    )}
                    
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            name="currentPassword"
                            type={showPassword.current ? 'text' : 'password'}
                            value={changePasswordData.currentPassword}
                            onChange={handlePasswordChange}
                            required
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('current')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                          >
                            {showPassword.current ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            name="newPassword"
                            type={showPassword.new ? 'text' : 'password'}
                            value={changePasswordData.newPassword}
                            onChange={handlePasswordChange}
                            required
                            minLength={8}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('new')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                          >
                            {showPassword.new ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Le mot de passe doit contenir au moins 8 caractères.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showPassword.confirm ? 'text' : 'password'}
                            value={changePasswordData.confirmPassword}
                            onChange={handlePasswordChange}
                            required
                            minLength={8}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('confirm')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                          >
                            {showPassword.confirm ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <Button 
                          type="submit" 
                          disabled={isLoading || 
                            !changePasswordData.currentPassword || 
                            !changePasswordData.newPassword || 
                            !changePasswordData.confirmPassword}
                        >
                          {isLoading ? 'Enregistrement...' : 'Mettre à jour le mot de passe'}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Activité récente</CardTitle>
                  <CardDescription>
                    Votre activité récente sur la plateforme.
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => activities.refresh()}
                  disabled={activities.loading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${activities.loading ? 'animate-spin' : ''}`} />
                  {activities.loading ? 'Chargement...' : 'Rafraîchir'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activities.loading && !activities.activities?.length ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : activities.error ? (
                <div className="p-4 bg-red-50 text-red-700 rounded-md">
                  <p>Erreur lors du chargement des activités : {activities.error.message}</p>
                </div>
              ) : !activities.activities?.length ? (
                <div className="text-center p-8 text-gray-500">
                  Aucune activité récente à afficher.
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.activities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className={`p-2 rounded-full ${
                        activity.activity_type === 'login' ? 'bg-blue-100 text-blue-600' :
                        activity.activity_type === 'password_change' ? 'bg-green-100 text-green-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {activity.activity_type === 'login' ? (
                          <Activity className="h-4 w-4" />
                        ) : activity.activity_type === 'password_change' ? (
                          <Shield className="h-4 w-4" />
                        ) : (
                          <Bell className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {getActivityTitle(activity.activity_type)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getActivityDescription(activity.details)}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(activity.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="organization">
            <OrganizationView />
          </TabsContent>
        )}
        
        <TabsContent value="danger">
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Zone de danger</CardTitle>
              <CardDescription>
                Actions irréversibles. Soyez certain de ce que vous faites.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Exporter mes données</h4>
                    <p className="text-sm text-muted-foreground">
                      Téléchargez une copie de toutes vos données personnelles au format JSON.
                    </p>
                    <Button variant="outline" className="mt-2">
                      Exporter mes données
                    </Button>
                  </div>
                </div>
                
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-destructive">Supprimer mon compte</h4>
                    <p className="text-sm text-muted-foreground">
                      Cette action est irréversible. Toutes vos données seront définitivement supprimées et ne pourront pas être récupérées.
                    </p>
                    <Button 
                      variant="destructive" 
                      className="mt-2"
                      onClick={async () => {
                        if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
                          try {
                            const { error } = await supabase.rpc('delete_user_account');
                            if (error) throw error;
                            await supabase.auth.signOut();
                            window.location.href = '/';
                          } catch (error) {
                            console.error('Erreur lors de la suppression du compte:', error);
                            toast.error('Une erreur est survenue lors de la suppression du compte');
                          }
                        }
                      }}
                    >
                      Supprimer mon compte
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Composant OrganizationView pour les administrateurs
function OrganizationView() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [teams, setTeams] = useState<OrganizationTeam[]>([]);
  const [campaigns, setCampaigns] = useState<OrganizationCampaign[]>([]);
  const [files, setFiles] = useState<OrganizationFile[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeams: 0,
    totalCampaigns: 0,
    totalFiles: 0,
    activeUsers: 0,
    totalLeads: 0
  });

  const loadOrganizationData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Pour le diagnostic, utiliser le service role (admin) pour contourner les RLS
      // TODO: Remplacer par des requêtes normales une fois les RLS corrigés
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session utilisateur:', session?.user?.id, session?.user?.role);
      
      // Charger toutes les données en parallèle
      const [
        usersResponse,
        teamsResponse,
        campaignsResponse,
        filesResponse,
        leadsResponse
      ] = await Promise.all([
        supabase.from('users_profile').select('*'),
        supabase.from('teams').select('id, name, description, leader_id, created_at, updated_at, created_by'),
        supabase.from('campaigns').select('*'),
        supabase.from('fichiers_import').select('*'),
        supabase.from('leads').select('*')
      ]);

      // Log de diagnostic pour les erreurs
      console.log('Réponses Supabase:', {
        users: { data: usersResponse.data, error: usersResponse.error },
        teams: { data: teamsResponse.data, error: teamsResponse.error },
        campaigns: { data: campaignsResponse.data, error: campaignsResponse.error },
        files: { data: filesResponse.data, error: filesResponse.error },
        leads: { data: leadsResponse.data, error: leadsResponse.error }
      });

      // Afficher les erreurs spécifiques dans la console
      if (campaignsResponse.error) {
        console.error('Erreur campaigns:', campaignsResponse.error);
        toast.error(`Erreur campaigns: ${campaignsResponse.error.message}`);
      }
      if (leadsResponse.error) {
        console.error('Erreur leads:', leadsResponse.error);
        toast.error(`Erreur leads: ${leadsResponse.error.message}`);
      }

      if (usersResponse.data) {
        setUsers(usersResponse.data);
      }
      
      if (teamsResponse.data) {
        setTeams(teamsResponse.data);
      }
      
      if (campaignsResponse.data) {
        setCampaigns(campaignsResponse.data);
      }
      
      if (filesResponse.data) {
        console.log('Fichiers récupérés:', filesResponse.data.length, filesResponse.data);
        setFiles(filesResponse.data);
      } else {
        console.log('Aucun fichier récupéré ou erreur:', filesResponse.error);
      }

      // Calculer les statistiques
      setStats({
        totalUsers: usersResponse.data?.length || 0,
        totalTeams: teamsResponse.data?.length || 0,
        totalCampaigns: campaignsResponse.data?.length || 0,
        totalFiles: filesResponse.data?.length || 0,
        activeUsers: usersResponse.data?.filter(u => u.actif).length || 0,
        totalLeads: leadsResponse.data?.length || 0
      });

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données de l\'organisation');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrganizationData();
  }, [loadOrganizationData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-gray-500">{stats.activeUsers} actifs</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Équipes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeams}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Campagnes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Fichiers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFiles}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Taux d'activité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Utilisateurs et leurs rôles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Utilisateurs et leurs rôles
          </CardTitle>
          <CardDescription>
            Vue d'ensemble de tous les utilisateurs de l'organisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage 
                      src={(() => {
                        if (!user.avatar_url) return undefined;
                        let avatarUrl = user.avatar_url;
                        if (avatarUrl.includes('storage/v1/object/public/user_avatars/')) {
                          avatarUrl = avatarUrl.replace('https://nzlwbtslfljjkozzyaej.supabase.co/storage/v1/object/public/user_avatars/', '');
                        }
                        return avatarService.getAvatarUrl(avatarUrl) || undefined;
                      })()} 
                    />
                    <AvatarFallback>
                      {user.nom?.[0] || user.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {user.nom ?? ''} {user.prenom ?? ''}
                    </p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin' ? 'bg-red-100 text-red-800' :
                    user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {user.role}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.actif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.actif ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Équipes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Équipes
          </CardTitle>
          <CardDescription>
            Vue d'ensemble de toutes les équipes de l'organisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teams.map((team) => (
              <div key={team.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{team.name}</h4>
                    <p className="text-sm text-gray-500">{team.description || ''}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    Créée le {new Date(team.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Campagnes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Campagnes
          </CardTitle>
          <CardDescription>
            Vue d'ensemble de toutes les campagnes de l'organisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{campaign.name}</h4>
                    <p className="text-sm text-gray-500">{campaign.description || ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                      campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {campaign.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(campaign.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fichiers importés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Fichiers importés
          </CardTitle>
          <CardDescription>
            Vue d'ensemble de tous les fichiers importés dans l'organisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {files.map((file) => (
              <div key={file.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{file.nom}</h4>
                    <p className="text-sm text-gray-500">
                      {file.nb_lignes} lignes • {file.type}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      file.statut === 'traité' ? 'bg-green-100 text-green-800' :
                      file.statut === 'en_cours' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {file.statut}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(file.date_import).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
