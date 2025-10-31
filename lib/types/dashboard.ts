export type ActivityType = 'call' | 'email' | 'meeting' | 'task';
export type ActivityStatus = 'completed' | 'scheduled' | 'pending';

export interface ActivityItem {
  id: string | number;
  type: ActivityType;
  title: string;
  time: string;
  status: ActivityStatus;
  color: string;
  description?: string;
}

export interface StatItem {
  title: string;
  value: string;
  trend: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  iconBg?: string;
  href: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  className?: string;
}
