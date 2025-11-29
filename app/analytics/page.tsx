'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/lib/utils/supabase/client';
import { analyticsService } from '@/lib/services/analyticsService';
import { getAgents } from '@/lib/types/leads';
import type { AnalyticsSummary, ConversionFunnelData, ChannelPerformance, AgentPerformance, LeadSourceAttribution, TimeSeriesData, AnalyticsFilters, DateRange } from '@/types/analytics';
import { AnalyticsStats } from '@/components/analytics/AnalyticsStats';
import { TimeSeriesChart } from '@/components/analytics/TimeSeriesChart';
import { ConversionFunnelTab } from '@/components/analytics/ConversionFunnelTab';
import { ChannelPerformanceTab } from '@/components/analytics/ChannelPerformanceTab';
import { AgentPerformanceTab } from '@/components/analytics/AgentPerformanceTab';
import { LeadSourcesTab } from '@/components/analytics/LeadSourcesTab';

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [funnelData, setFunnelData] = useState<ConversionFunnelData[]>([]);
  const [channelData, setChannelData] = useState<ChannelPerformance[]>([]);
  const [agentData, setAgentData] = useState<AgentPerformance[]>([]);
  const [sourceData, setSourceData] = useState<LeadSourceAttribution[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: {
      from: new Date(new Date().setDate(new Date().getDate() - 30)),
      to: new Date(),
    },
  });

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      loadData();
      loadAgents();
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (filters) loadData();
  }, [filters]);

  const loadAgents = async () => {
    const { data } = await getAgents();
    if (data) setAgents(data);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryRes, funnelRes, channelRes, agentRes, sourceRes, timeSeriesRes] =
        await Promise.all([
          analyticsService.getAnalyticsSummary(filters),
          analyticsService.getConversionFunnel(filters),
          analyticsService.getChannelPerformance(filters),
          analyticsService.getAgentPerformance(filters),
          analyticsService.getLeadSourceAttribution(filters),
          analyticsService.getTimeSeriesData(filters),
        ]);
      setSummary(summaryRes);
      setFunnelData(funnelRes);
      setChannelData(channelRes);
      setAgentData(agentRes);
      setSourceData(sourceRes);
      setTimeSeriesData(timeSeriesRes);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    setFilters({ ...filters, dateRange: range });
  };

  const handleExport = () => {
    const dataToExport = {
      summary,
      funnel: funnelData,
      channels: channelData,
      agents: agentData,
      sources: sourceData,
      timeSeries: timeSeriesData,
    };
    const jsonStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
              <p className="text-slate-600 mt-2">Performance insights and metrics</p>
            </div>
            <div className="flex gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[280px] justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'LLL dd, y')} -{' '}
                          {format(dateRange.to, 'LLL dd, y')}
                        </>
                      ) : (
                        format(dateRange.from, 'LLL dd, y')
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={{ from: dateRange?.from, to: dateRange?.to }}
                    onSelect={(range: any) => {
                      if (range?.from && range?.to) {
                        handleDateRangeChange({ from: range.from, to: range.to });
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              <Select
                value={filters.agentId || 'all'}
                onValueChange={(value) =>
                  setFilters({ ...filters, agentId: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Agents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.prenom} {agent.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleExport} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-slate-600">Loading analytics...</div>
            </div>
          ) : (
            <>
              <AnalyticsStats summary={summary} agentData={agentData} />

              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
                  <TabsTrigger value="channels">Channels</TabsTrigger>
                  <TabsTrigger value="agents">Agents</TabsTrigger>
                  <TabsTrigger value="sources">Sources</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <TimeSeriesChart data={timeSeriesData} />
                </TabsContent>

                <TabsContent value="funnel" className="space-y-6">
                  <ConversionFunnelTab data={funnelData} />
                </TabsContent>

                <TabsContent value="channels" className="space-y-6">
                  <ChannelPerformanceTab data={channelData} />
                </TabsContent>

                <TabsContent value="agents" className="space-y-6">
                  <AgentPerformanceTab data={agentData} />
                </TabsContent>

                <TabsContent value="sources" className="space-y-6">
                  <LeadSourcesTab data={sourceData} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
