import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { AgentPerformance } from '@/types/analytics';

interface AgentPerformanceTabProps {
  data: AgentPerformance[];
}

export function AgentPerformanceTab({ data }: AgentPerformanceTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Performance</CardTitle>
        <CardDescription>Individual agent metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data
            .sort((a, b) => b.conversionRate - a.conversionRate)
            .map((agent) => (
              <div key={agent.agentId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <div>
                  <div className="font-medium">{agent.agentName}</div>
                  <div className="text-sm text-muted-foreground">
                    {agent.totalLeads} leads • {agent.rdvPlanifies} RDV
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{agent.conversionRate.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">
                    {agent.convertedLeads} conversions
                  </div>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
