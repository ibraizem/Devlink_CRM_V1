import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { ConversionFunnelData } from '@/types/analytics';

interface ConversionFunnelTabProps {
  data: ConversionFunnelData[];
}

export function ConversionFunnelTab({ data }: ConversionFunnelTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
        <CardDescription>Lead progression through sales stages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((stage, index) => (
            <div key={stage.stage} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{stage.stage}</span>
                <span className="text-muted-foreground">
                  {stage.count} ({stage.percentage.toFixed(1)}%)
                  {index > 0 && (
                    <span className="ml-2 text-xs text-green-600">
                      ↓ {stage.conversionRate?.toFixed(1)}%
                    </span>
                  )}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${stage.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
