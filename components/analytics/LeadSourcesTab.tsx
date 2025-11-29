import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { LeadSourceAttribution } from '@/types/analytics';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

interface LeadSourcesTabProps {
  data: LeadSourceAttribution[];
}

export function LeadSourcesTab({ data }: LeadSourcesTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Lead Sources</CardTitle>
          <CardDescription>Distribution of lead sources</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.source}: ${entry.percentage.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Source Performance</CardTitle>
          <CardDescription>Conversion rates by source</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data
              .sort((a, b) => b.conversionRate - a.conversionRate)
              .map((source) => (
                <div key={source.source} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{source.source}</div>
                    <div className="text-sm text-muted-foreground">{source.count} leads</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{source.conversionRate.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">{source.conversions} conversions</div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
