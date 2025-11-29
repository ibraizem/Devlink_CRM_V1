import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Target, Award, TrendingUp } from 'lucide-react';
import type { AnalyticsSummary, AgentPerformance } from '@/types/analytics';

interface AnalyticsStatsProps {
  summary: AnalyticsSummary | null;
  agentData: AgentPerformance[];
}

export function AnalyticsStats({ summary, agentData }: AnalyticsStatsProps) {
  const avgAgentConversion =
    agentData.length > 0
      ? (agentData.reduce((sum, a) => sum + a.conversionRate, 0) / agentData.length).toFixed(1)
      : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary?.totalLeads || 0}</div>
          <p className="text-xs text-muted-foreground">In selected period</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversions</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary?.totalConversions || 0}</div>
          <p className="text-xs text-muted-foreground">
            {summary?.conversionRate.toFixed(1)}% conversion rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">RDV Scheduled</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary?.totalRdv || 0}</div>
          <p className="text-xs text-muted-foreground">
            {summary?.rdvConversionRate.toFixed(1)}% RDV to recruit
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Performance</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgAgentConversion}%</div>
          <p className="text-xs text-muted-foreground">Avg. agent conversion</p>
        </CardContent>
      </Card>
    </div>
  );
}
