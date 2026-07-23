import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatNumber } from '../../utils/helpers';

interface TrendChartProps {
  data: any[];
  metrics?: { key: string; color: string; label: string }[];
}

const defaultMetrics = [
  { key: 'views', color: '#ef4444', label: 'Views' },
  { key: 'likes', color: '#3b82f6', label: 'Likes' },
  { key: 'comments', color: '#22c55e', label: 'Comments' },
  { key: 'shares', color: '#f59e0b', label: 'Shares' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-[#2f2f2f] rounded-lg p-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-400">{p.name}:</span>
          <span className="text-white font-medium">{formatNumber(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function TrendChart({ data, metrics = defaultMetrics }: TrendChartProps) {
  if (!data?.length) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
        No data available for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={200} aspect={window.innerWidth < 640 ? 1.8 : 2.8}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false}
          interval={window.innerWidth < 640 ? 'preserveStartEnd' : 'preserveEnd'} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={formatNumber} width={40} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: '#9ca3af', paddingTop: 8 }}
          iconType="circle"
          iconSize={7}
        />
        {metrics.map(m => (
          <Line
            key={m.key}
            type="monotone"
            dataKey={m.key}
            stroke={m.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            name={m.label}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
