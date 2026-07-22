import { cn, formatNumber } from '../../utils/helpers';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg?: string;
  change?: number;
  suffix?: string;
  loading?: boolean;
}

export default function StatCard({ label, value, icon, iconBg = 'bg-red-900/30', change, suffix = '', loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="stat-card animate-pulse">
        <div className="h-4 bg-[#2f2f2f] rounded w-24 mb-4" />
        <div className="h-8 bg-[#2f2f2f] rounded w-32" />
      </div>
    );
  }

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <p className="text-sm text-gray-400">{label}</p>
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', iconBg)}>
          {icon}
        </div>
      </div>
      <div className="mt-2">
        <p className="text-2xl font-bold text-white">{formatNumber(value)}{suffix}</p>
      </div>
      {change !== undefined && (
        <div className={cn('flex items-center gap-1 text-xs mt-1', change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-gray-500')}>
          {change > 0 ? <TrendingUp size={12} /> : change < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
          <span>{change > 0 ? '+' : ''}{change.toFixed(1)}% vs last period</span>
        </div>
      )}
    </div>
  );
}
