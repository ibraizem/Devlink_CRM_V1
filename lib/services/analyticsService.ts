import { createClient } from '@/lib/utils/supabase/client';
import {
  ConversionFunnelData,
  ChannelPerformance,
  AgentPerformance,
  LeadSourceAttribution,
  TimeSeriesData,
  AnalyticsFilters,
  AnalyticsSummary,
} from '@/types/analytics';

const supabase = createClient();

export const analyticsService = {
  async getAnalyticsSummary(filters: AnalyticsFilters = {}): Promise<AnalyticsSummary> {
    try {
      let query = supabase.from('leads').select('*');

      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.from.toISOString())
          .lte('created_at', filters.dateRange.to.toISOString());
      }
      if (filters.agentId) query = query.eq('agent_id', filters.agentId);
      if (filters.source) query = query.eq('source', filters.source);
      if (filters.status) query = query.eq('statut', filters.status);

      const { data: leads, error } = await query;
      if (error) throw error;

      const totalLeads = leads?.length || 0;
      const totalConversions = leads?.filter(l => l.statut === 'recrute').length || 0;
      const totalRdv = leads?.filter(l => ['rdv_planifie', 'rdv_ok'].includes(l.statut)).length || 0;
      const rdvConverted = leads?.filter(l => l.statut === 'recrute' && l.dernier_contact).length || 0;

      return {
        totalLeads,
        totalConversions,
        conversionRate: totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0,
        totalRdv,
        rdvConversionRate: totalRdv > 0 ? (rdvConverted / totalRdv) * 100 : 0,
      };
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
      throw error;
    }
  },

  async getConversionFunnel(filters: AnalyticsFilters = {}): Promise<ConversionFunnelData[]> {
    try {
      let query = supabase.from('leads').select('statut');

      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.from.toISOString())
          .lte('created_at', filters.dateRange.to.toISOString());
      }
      if (filters.agentId) query = query.eq('agent_id', filters.agentId);
      if (filters.source) query = query.eq('source', filters.source);

      const { data, error } = await query;
      if (error) throw error;

      const total = data?.length || 0;
      const stages = [
        { stage: 'Total Leads', statuses: ['nouveau', 'rdv_planifie', 'rdv_ok', 'ko', 'a_replanifier', 'en_attente_doc', 'recrute', 'classe'] },
        { stage: 'Contacted', statuses: ['rdv_planifie', 'rdv_ok', 'ko', 'a_replanifier', 'en_attente_doc', 'recrute'] },
        { stage: 'RDV Planned', statuses: ['rdv_planifie', 'rdv_ok', 'en_attente_doc', 'recrute'] },
        { stage: 'RDV Confirmed', statuses: ['rdv_ok', 'en_attente_doc', 'recrute'] },
        { stage: 'Documents', statuses: ['en_attente_doc', 'recrute'] },
        { stage: 'Recruited', statuses: ['recrute'] },
      ];

      return stages.map((stage, index) => {
        const count = data?.filter(l => stage.statuses.includes(l.statut)).length || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        const prevCount = index > 0 ? (data?.filter(l => stages[index - 1].statuses.includes(l.statut)).length || 0) : total;
        const conversionRate = prevCount > 0 ? (count / prevCount) * 100 : 0;

        return {
          stage: stage.stage,
          count,
          percentage,
          conversionRate: index > 0 ? conversionRate : 100,
        };
      });
    } catch (error) {
      console.error('Error fetching conversion funnel:', error);
      throw error;
    }
  },

  async getChannelPerformance(filters: AnalyticsFilters = {}): Promise<ChannelPerformance[]> {
    try {
      let query = supabase.from('rendezvous').select('canal, lead_id, statut');

      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.from.toISOString())
          .lte('created_at', filters.dateRange.to.toISOString());
      }

      const { data: rdvData, error: rdvError } = await query;
      if (rdvError) throw rdvError;

      const channelMap = new Map<string, { leads: number; conversions: number }>();

      rdvData?.forEach(rdv => {
        if (!rdv.canal) return;
        const existing = channelMap.get(rdv.canal) || { leads: 0, conversions: 0 };
        existing.leads++;
        if (rdv.statut === 'termine') existing.conversions++;
        channelMap.set(rdv.canal, existing);
      });

      return Array.from(channelMap.entries()).map(([channel, data]) => ({
        channel,
        leads: data.leads,
        conversions: data.conversions,
        conversionRate: data.leads > 0 ? (data.conversions / data.leads) * 100 : 0,
      }));
    } catch (error) {
      console.error('Error fetching channel performance:', error);
      throw error;
    }
  },

  async getAgentPerformance(filters: AnalyticsFilters = {}): Promise<AgentPerformance[]> {
    try {
      let leadsQuery = supabase.from('leads').select('agent_id, statut, users_profile:agent_id(nom, prenom)');

      if (filters.dateRange) {
        leadsQuery = leadsQuery
          .gte('created_at', filters.dateRange.from.toISOString())
          .lte('created_at', filters.dateRange.to.toISOString());
      }

      const { data: leadsData, error: leadsError } = await leadsQuery;
      if (leadsError) throw leadsError;

      let rdvQuery = supabase.from('rendezvous').select('agent_id, statut');
      if (filters.dateRange) {
        rdvQuery = rdvQuery
          .gte('created_at', filters.dateRange.from.toISOString())
          .lte('created_at', filters.dateRange.to.toISOString());
      }

      const { data: rdvData, error: rdvError } = await rdvQuery;
      if (rdvError) throw rdvError;

      const agentMap = new Map<string, {
        name: string;
        totalLeads: number;
        convertedLeads: number;
        rdvPlanifies: number;
        rdvConverted: number;
      }>();

      leadsData?.forEach(lead => {
        if (!lead.agent_id) return;
        const profile = lead.users_profile as any;
        const name = profile ? `${profile.prenom} ${profile.nom}` : 'Unknown';
        const existing = agentMap.get(lead.agent_id) || {
          name,
          totalLeads: 0,
          convertedLeads: 0,
          rdvPlanifies: 0,
          rdvConverted: 0,
        };
        existing.totalLeads++;
        if (lead.statut === 'recrute') existing.convertedLeads++;
        agentMap.set(lead.agent_id, existing);
      });

      rdvData?.forEach(rdv => {
        if (!rdv.agent_id) return;
        const existing = agentMap.get(rdv.agent_id);
        if (existing) {
          existing.rdvPlanifies++;
          if (rdv.statut === 'termine') existing.rdvConverted++;
        }
      });

      return Array.from(agentMap.entries()).map(([agentId, data]) => ({
        agentId,
        agentName: data.name,
        totalLeads: data.totalLeads,
        convertedLeads: data.convertedLeads,
        conversionRate: data.totalLeads > 0 ? (data.convertedLeads / data.totalLeads) * 100 : 0,
        rdvPlanifies: data.rdvPlanifies,
        rdvConverted: data.rdvConverted,
      }));
    } catch (error) {
      console.error('Error fetching agent performance:', error);
      throw error;
    }
  },

  async getLeadSourceAttribution(filters: AnalyticsFilters = {}): Promise<LeadSourceAttribution[]> {
    try {
      let query = supabase.from('leads').select('source, statut');

      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.from.toISOString())
          .lte('created_at', filters.dateRange.to.toISOString());
      }
      if (filters.agentId) query = query.eq('agent_id', filters.agentId);

      const { data, error } = await query;
      if (error) throw error;

      const total = data?.length || 0;
      const sourceMap = new Map<string, { count: number; conversions: number }>();

      data?.forEach(lead => {
        const source = lead.source || 'Unknown';
        const existing = sourceMap.get(source) || { count: 0, conversions: 0 };
        existing.count++;
        if (lead.statut === 'recrute') existing.conversions++;
        sourceMap.set(source, existing);
      });

      return Array.from(sourceMap.entries()).map(([source, data]) => ({
        source,
        count: data.count,
        percentage: total > 0 ? (data.count / total) * 100 : 0,
        conversions: data.conversions,
        conversionRate: data.count > 0 ? (data.conversions / data.count) * 100 : 0,
      }));
    } catch (error) {
      console.error('Error fetching lead source attribution:', error);
      throw error;
    }
  },

  async getTimeSeriesData(filters: AnalyticsFilters = {}): Promise<TimeSeriesData[]> {
    try {
      const dateRange = filters.dateRange || {
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date(),
      };

      let leadsQuery = supabase
        .from('leads')
        .select('created_at, statut')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (filters.agentId) leadsQuery = leadsQuery.eq('agent_id', filters.agentId);
      if (filters.source) leadsQuery = leadsQuery.eq('source', filters.source);

      const { data: leadsData, error: leadsError } = await leadsQuery;
      if (leadsError) throw leadsError;

      let rdvQuery = supabase
        .from('rendezvous')
        .select('created_at')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (filters.agentId) rdvQuery = rdvQuery.eq('agent_id', filters.agentId);

      const { data: rdvData, error: rdvError } = await rdvQuery;
      if (rdvError) throw rdvError;

      const dateMap = new Map<string, { leads: number; conversions: number; rdv: number }>();

      leadsData?.forEach(lead => {
        const date = new Date(lead.created_at).toISOString().split('T')[0];
        const existing = dateMap.get(date) || { leads: 0, conversions: 0, rdv: 0 };
        existing.leads++;
        if (lead.statut === 'recrute') existing.conversions++;
        dateMap.set(date, existing);
      });

      rdvData?.forEach(rdv => {
        const date = new Date(rdv.created_at).toISOString().split('T')[0];
        const existing = dateMap.get(date) || { leads: 0, conversions: 0, rdv: 0 };
        existing.rdv++;
        dateMap.set(date, existing);
      });

      return Array.from(dateMap.entries())
        .map(([date, data]) => ({
          date,
          leads: data.leads,
          conversions: data.conversions,
          rdv: data.rdv,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error fetching time series data:', error);
      throw error;
    }
  },
};
