'use client';

import { useState, useEffect, useCallback } from 'react';
import { LeadViewConfig, ViewTemplate } from '@/types/leads';
import { viewService } from '@/lib/services/viewService';
import { toast } from 'sonner';

export function useLeadViews(userId: string | null) {
  const [userViews, setUserViews] = useState<LeadViewConfig[]>([]);
  const [sharedViews, setSharedViews] = useState<LeadViewConfig[]>([]);
  const [templateViews, setTemplateViews] = useState<ViewTemplate[]>([]);
  const [currentView, setCurrentView] = useState<LeadViewConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const loadViews = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [user, shared] = await Promise.all([
        viewService.getUserViews(userId),
        viewService.getSharedViews(userId),
      ]);

      setUserViews(user);
      setSharedViews(shared);
      setTemplateViews(viewService.getDefaultTemplates());
    } catch (error) {
      console.error('Error loading views:', error);
      toast.error('Erreur lors du chargement des vues');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadViews();
  }, [loadViews]);

  const createView = useCallback(async (view: Omit<LeadViewConfig, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newView = await viewService.createView(view);
      setUserViews(prev => [newView, ...prev]);
      toast.success('Vue créée avec succès');
      return newView;
    } catch (error) {
      console.error('Error creating view:', error);
      toast.error('Erreur lors de la création de la vue');
      throw error;
    }
  }, []);

  const updateView = useCallback(async (id: string, updates: Partial<LeadViewConfig>) => {
    try {
      const updatedView = await viewService.updateView(id, updates);
      setUserViews(prev => prev.map(v => v.id === id ? updatedView : v));
      if (currentView?.id === id) {
        setCurrentView(updatedView);
      }
      toast.success('Vue mise à jour avec succès');
      return updatedView;
    } catch (error) {
      console.error('Error updating view:', error);
      toast.error('Erreur lors de la mise à jour de la vue');
      throw error;
    }
  }, [currentView]);

  const deleteView = useCallback(async (id: string) => {
    try {
      await viewService.deleteView(id);
      setUserViews(prev => prev.filter(v => v.id !== id));
      if (currentView?.id === id) {
        setCurrentView(null);
      }
      toast.success('Vue supprimée avec succès');
    } catch (error) {
      console.error('Error deleting view:', error);
      toast.error('Erreur lors de la suppression de la vue');
      throw error;
    }
  }, [currentView]);

  const duplicateView = useCallback(async (viewId: string, newName?: string) => {
    if (!userId) return;

    try {
      const duplicated = await viewService.duplicateView(viewId, userId, newName);
      setUserViews(prev => [duplicated, ...prev]);
      toast.success('Vue dupliquée avec succès');
      return duplicated;
    } catch (error) {
      console.error('Error duplicating view:', error);
      toast.error('Erreur lors de la duplication de la vue');
      throw error;
    }
  }, [userId]);

  const shareViewWithTeam = useCallback(async (viewId: string, shared: boolean) => {
    try {
      await viewService.shareViewWithTeam(viewId, shared);
      setUserViews(prev => prev.map(v => 
        v.id === viewId 
          ? { ...v, shared_with_team: shared, is_shared: shared } 
          : v
      ));
      toast.success(shared ? 'Vue partagée avec l\'équipe' : 'Partage annulé');
    } catch (error) {
      console.error('Error sharing view:', error);
      toast.error('Erreur lors du partage de la vue');
      throw error;
    }
  }, []);

  const shareViewWithUsers = useCallback(async (viewId: string, userIds: string[]) => {
    try {
      await viewService.shareViewWithUsers(viewId, userIds);
      setUserViews(prev => prev.map(v => 
        v.id === viewId 
          ? { ...v, shared_with_users: userIds, is_shared: userIds.length > 0 } 
          : v
      ));
      toast.success('Vue partagée avec les utilisateurs sélectionnés');
    } catch (error) {
      console.error('Error sharing view with users:', error);
      toast.error('Erreur lors du partage de la vue');
      throw error;
    }
  }, []);

  const createFromTemplate = useCallback(async (template: ViewTemplate, customName?: string) => {
    if (!userId) return;

    try {
      const newView = await viewService.createViewFromTemplate(template, userId, customName);
      setUserViews(prev => [newView, ...prev]);
      toast.success('Vue créée à partir du template');
      return newView;
    } catch (error) {
      console.error('Error creating view from template:', error);
      toast.error('Erreur lors de la création de la vue');
      throw error;
    }
  }, [userId]);

  const applyView = useCallback((view: LeadViewConfig | null) => {
    setCurrentView(view);
  }, []);

  return {
    userViews,
    sharedViews,
    templateViews,
    currentView,
    loading,
    createView,
    updateView,
    deleteView,
    duplicateView,
    shareViewWithTeam,
    shareViewWithUsers,
    createFromTemplate,
    applyView,
    refreshViews: loadViews,
  };
}
