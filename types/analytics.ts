export interface DateRange {
  from: Date;
  to: Date;
}

export interface ConversionFunnelData {
  stage: string;
  count: number;
  percentage: number;
  conversionRate?: number;
}

export interface ChannelPerformance {
  channel: string;
  leads: number;
  conversions: number;
  conversionRate: number;
  revenue?: number;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  averageResponseTime?: number;
  rdvPlanifies: number;
  rdvConverted: number;
}

export interface LeadSourceAttribution {
  source: string;
  count: number;
  percentage: number;
  conversions: number;
  conversionRate: number;
}

export interface TimeSeriesData {
  date: string;
  leads: number;
  conversions: number;
  rdv: number;
}

export interface AnalyticsFilters {
  dateRange?: DateRange;
  agentId?: string;
  source?: string;
  channel?: string;
  status?: string;
}

export interface AnalyticsSummary {
  totalLeads: number;
  totalConversions: number;
  conversionRate: number;
  totalRdv: number;
  rdvConversionRate: number;
  averageTimeToConversion?: number;
}

export interface ExportData {
  format: 'csv' | 'xlsx' | 'pdf';
  data: any[];
  filename: string;
}
