'use client';

import { useState } from 'react';
import { User, Bell, CreditCard, Shield, Activity, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/types/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type TabValue = 'profile' | 'settings' | 'notifications' | 'billing' | 'security' | 'activity' | 'danger';

export function UserProfile() {
  const [activeTab, setActiveTab] = useState<TabValue>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@example.com',
    phone: '+33 6 12 34 56 78',
    timezone: 'Europe/Paris',
    language: 'Français',
    avatar: '/avatars/default.jpg'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // Logique de sauvegarde ici
    setIsEditing(false);
    // Afficher une notification de succès
  };

  return (
    <div className="space-y-6">
      {/* En-tête du profil */}
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:items-start">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={formData.avatar} alt={`${formData.firstName} ${formData.lastName}`} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-700 text-white text-2xl">
                {formData.firstName[0]}{formData.lastName[0]}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                <input type="file" className="hidden" accept="image/*" />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </label>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {formData.firstName} {formData.lastName}
            </h1>
            <p className="text-gray-600">{formData.email}</p>
            <p className="text-sm text-gray-500">Membre depuis Janvier 2023</p>
          </div>
        </div>
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave}>
                Enregistrer les modifications
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
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span className="hidden sm:inline">Paramètres</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Facturation</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Sécurité</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Activité</span>
          </TabsTrigger>
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
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input 
                    id="firstName" 
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input 
                    id="lastName" 
                    name="lastName"
                    value={formData.lastName}
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
                <Label htmlFor="phone">Téléphone</Label>
                <Input 
                  id="phone" 
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
            {isEditing && (
              <CardFooter className="flex justify-end space-x-2 border-t px-6 py-4">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSave}>
                  Enregistrer les modifications
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Préférences du compte</CardTitle>
              <CardDescription>
                Personnalisez les paramètres de votre compte.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Langue</h3>
                <p className="text-sm text-gray-500">
                  Sélectionnez votre langue préférée pour l'interface utilisateur.
                </p>
                <select 
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  disabled={!isEditing}
                >
                  <option>Français</option>
                  <option>English</option>
                  <option>Español</option>
                  <option>Deutsch</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Fuseau horaire</h3>
                <p className="text-sm text-gray-500">
                  Définissez votre fuseau horaire pour afficher les dates et heures correctement.
                </p>
                <select 
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  disabled={!isEditing}
                >
                  <option>Europe/Paris (GMT+1)</option>
                  <option>UTC (GMT+0)</option>
                  <option>America/New_York (GMT-5)</option>
                  <option>Asia/Tokyo (GMT+9)</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Sécurité du compte</CardTitle>
              <CardDescription>
                Gérez la sécurité de votre compte et vos paramètres de connexion.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium">Authentification à deux facteurs</h3>
                  <p className="text-sm text-gray-500">
                    Ajoutez une couche de sécurité supplémentaire à votre compte.
                  </p>
                </div>
                <Switch 
                  id="two-factor" 
                  checked={true}
                  onCheckedChange={() => {}}
                  disabled={!isEditing}
                />
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium mb-4">Sessions actives</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-md">
                        <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Windows 11 • Chrome</p>
                        <p className="text-xs text-gray-500">Paris, France • Il y a 2 heures</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" disabled={!isEditing}>
                      Déconnecter
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-md">
                        <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium">iPhone 13 • Safari</p>
                        <p className="text-xs text-gray-500">Lyon, France • Il y a 2 jours</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" disabled={!isEditing}>
                      Déconnecter
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Zone de danger</CardTitle>
              <CardDescription>
                Ces actions sont irréversibles. Soyez certain de ce que vous faites.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                <h3 className="text-sm font-medium text-red-800">Supprimer mon compte</h3>
                <p className="mt-1 text-sm text-red-700">
                  Une fois votre compte supprimé, toutes vos données seront définitivement effacées. Cette action ne peut pas être annulée.
                </p>
                <Button 
                  variant="destructive" 
                  className="mt-3"
                  onClick={() => {}}
                >
                  Supprimer mon compte
                </Button>
              </div>
              
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                <h3 className="text-sm font-medium text-amber-800">Exporter mes données</h3>
                <p className="mt-1 text-sm text-amber-700">
                  Téléchargez une copie de toutes vos données personnelles au format JSON.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-3 border-amber-300 text-amber-700 hover:bg-amber-50"
                  onClick={() => {}}
                >
                  Exporter mes données
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
