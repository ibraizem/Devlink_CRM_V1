import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TimeSeriesData } from '@/types/analytics';

interface TimeSeriesChartProps {
  data: TimeSeriesData[];
}

export function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Series Trends</CardTitle>
        <CardDescription>Leads, conversions, and RDV over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="leads" stroke="#8884d8" name="Leads" strokeWidth={2} />
            <Line type="monotone" dataKey="rdv" stroke="#82ca9d" name="RDV" strokeWidth={2} />
            <Line type="monotone" dataKey="conversions" stroke="#ffc658" name="Conversions" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
