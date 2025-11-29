import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignService } from '@/lib/services/campaignService';
import { campaignExecutionEngine } from '@/lib/services/campaignExecutionEngine';
import type { Campaign, CampaignSequence, CampaignTask } from '@/types/campaign';

export function useCampaigns(filters?: { status?: string; created_by?: string }) {
  return useQuery({
    queryKey: ['campaigns', filters],
    queryFn: () => campaignService.getCampaigns(filters),
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignService.getCampaignById(id),
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) =>
      campaignService.createCampaign(campaign),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Campaign> }) =>
      campaignService.updateCampaign(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', variables.id] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => campaignService.deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useCampaignSequences(campaignId: string) {
  return useQuery({
    queryKey: ['campaign-sequences', campaignId],
    queryFn: () => campaignService.getSequences(campaignId),
    enabled: !!campaignId,
  });
}

export function useCreateSequence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sequence: Omit<CampaignSequence, 'id' | 'created_at' | 'updated_at'>) =>
      campaignService.createSequence(sequence),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-sequences', data.campaign_id] });
    },
  });
}

export function useUpdateSequence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CampaignSequence> }) =>
      campaignService.updateSequence(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-sequences'] });
    },
  });
}

export function useDeleteSequence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => campaignService.deleteSequence(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-sequences'] });
    },
  });
}

export function useCampaignLeads(campaignId: string, status?: string) {
  return useQuery({
    queryKey: ['campaign-leads', campaignId, status],
    queryFn: () => campaignService.getCampaignLeads(campaignId, status),
    enabled: !!campaignId,
  });
}

export function useEnrollLeads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, leadIds }: { campaignId: string; leadIds: string[] }) =>
      campaignService.enrollLeads(campaignId, leadIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-leads', variables.campaignId] });
    },
  });
}

export function useCampaignOutreaches(
  campaignId: string,
  filters?: { status?: string; channel?: string }
) {
  return useQuery({
    queryKey: ['campaign-outreaches', campaignId, filters],
    queryFn: () => campaignService.getOutreaches(campaignId, filters),
    enabled: !!campaignId,
  });
}

export function useCampaignTasks(
  campaignId: string,
  filters?: { status?: string; assigned_to?: string }
) {
  return useQuery({
    queryKey: ['campaign-tasks', campaignId, filters],
    queryFn: () => campaignService.getTasks(campaignId, filters),
    enabled: !!campaignId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (task: Omit<CampaignTask, 'id' | 'created_at' | 'updated_at'>) =>
      campaignService.createTask(task),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-tasks', data.campaign_id] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CampaignTask> }) =>
      campaignService.updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-tasks'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => campaignService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-tasks'] });
    },
  });
}

export function useCampaignProgress(campaignId: string) {
  return useQuery({
    queryKey: ['campaign-progress', campaignId],
    queryFn: () => campaignService.getCampaignProgress(campaignId),
    enabled: !!campaignId,
    refetchInterval: 30000,
  });
}

export function useStartCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (campaignId: string) => campaignExecutionEngine.startCampaign(campaignId),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
    },
  });
}

export function usePauseCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (campaignId: string) => campaignExecutionEngine.pauseCampaign(campaignId),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
    },
  });
}

export function useResumeCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (campaignId: string) => campaignExecutionEngine.resumeCampaign(campaignId),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
    },
  });
}

export function useCompleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (campaignId: string) => campaignExecutionEngine.completeCampaign(campaignId),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
    },
  });
}

export function useEmailTemplates() {
  return useQuery({
    queryKey: ['email-templates'],
    queryFn: () => campaignService.getEmailTemplates(),
  });
}

export function useSmsTemplates() {
  return useQuery({
    queryKey: ['sms-templates'],
    queryFn: () => campaignService.getSmsTemplates(),
  });
}
