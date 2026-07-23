import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart2, Eye, ThumbsUp, MessageSquare, Share2, Youtube, Instagram, Download } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import StatCard from '../components/common/StatCard';
import TrendChart from '../components/dashboard/TrendChart';
import RecentPostsTable from '../components/dashboard/RecentPostsTable';
import { analyticsApi, postsApi, channelsApi } from '../api/client';
import { formatNumber } from '../utils/helpers';
import type { DateRange } from '../types';

const ranges: { label: string; value: DateRange }[] = [
  { label: '7d',  value: '7d'   },
  { label: '28d', value: '28d'  },
  { label: '90d', value: '90d'  },
  { label: '1yr', value: '365d' },
];

export default function Analytics() {
  const [range,     setRange]     = useState<DateRange>('28d');
  const [platform,  setPlatform]  = useState<'all' | 'youtube' | 'instagram'>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'channels'>('overview');

  const { data: analyticsData, isLoading } = useQuery({
    queryKey:  ['analytics-overview', range, platform],
    queryFn:   () => analyticsApi.getOverview({ range, platform: platform === 'all' ? undefined : platform }),
  });
  const { data: topPostsData } = useQuery({ queryKey: ['top-posts', 'views'],    queryFn: () => analyticsApi.getTopPosts('views', 20) });
  const { data: postsData    } = useQuery({ queryKey: ['posts-all'],             queryFn: () => postsApi.getAll({ limit: 50 }) });
  const { data: channelsData } = useQuery({ queryKey: ['channels'],              queryFn: channelsApi.getAll });

  const totals   = analyticsData?.totals || [];
  const ytTotals = totals.find((t: any) => t._id === 'youtube')   || {};
  const igTotals = totals.find((t: any) => t._id === 'instagram') || {};

  const combined = {
    views:    (ytTotals.totalViews    || 0) + (igTotals.totalViews    || 0),
    likes:    (ytTotals.totalLikes    || 0) + (igTotals.totalLikes    || 0),
    comments: (ytTotals.totalComments || 0) + (igTotals.totalComments || 0),
    shares:   (ytTotals.totalShares   || 0) + (igTotals.totalShares   || 0),
  };

  const chartData = (analyticsData?.daily || []).map((d: any) => ({
    date:     new Date(d._id.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    views:    d.views    || 0,
    likes:    d.likes    || 0,
    comments: d.comments || 0,
    shares:   d.shares   || 0,
  }));

  const exportCsv = () => {
    const posts = postsData?.posts || [];
    const rows = [
      ['Title', 'Type', 'Status', 'Views', 'Likes', 'Comments', 'Shares', 'Published'],
      ...posts.map((p: any) => [
        p.title || p.caption?.slice(0, 50) || 'Untitled',
        p.contentType, p.status,
        p.analytics?.totalViews    || 0,
        p.analytics?.totalLikes    || 0,
        p.analytics?.totalComments || 0,
        p.analytics?.totalShares   || 0,
        p.createdAt,
      ]),
    ];
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `analytics-${range}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Analytics" subtitle="Performance across all channels" />

      <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">

        {/* Filters — stack vertically on mobile */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          {/* Date range */}
          <div className="flex gap-1 bg-[#1a1a1a] p-1 rounded-lg border border-[#2f2f2f] flex-wrap">
            {ranges.map(r => (
              <button key={r.value} onClick={() => setRange(r.value)}
                className={`px-2.5 py-1.5 text-xs rounded-md transition-colors font-medium ${
                  range === r.value ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
                }`}>
                {r.label}
              </button>
            ))}
          </div>
          {/* Platform filter */}
          <div className="flex gap-1 bg-[#1a1a1a] p-1 rounded-lg border border-[#2f2f2f] flex-wrap">
            {[
              { v: 'all',       l: 'All' },
              { v: 'youtube',   l: '▶ YouTube' },
              { v: 'instagram', l: '◉ Instagram' },
            ].map(p => (
              <button key={p.v} onClick={() => setPlatform(p.v as any)}
                className={`px-2.5 py-1.5 text-xs rounded-md transition-colors font-medium ${
                  platform === p.v ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
                }`}>
                {p.l}
              </button>
            ))}
          </div>
          {/* Export */}
          <button onClick={exportCsv}
            className="btn-secondary text-xs gap-1.5 sm:ml-auto self-start">
            <Download size={13} /> Export CSV
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Total Views"    value={combined.views}    loading={isLoading} icon={<Eye          size={18} className="text-red-400"    />} iconBg="bg-red-900/20"    />
          <StatCard label="Total Likes"    value={combined.likes}    loading={isLoading} icon={<ThumbsUp     size={18} className="text-blue-400"   />} iconBg="bg-blue-900/20"   />
          <StatCard label="Total Comments" value={combined.comments} loading={isLoading} icon={<MessageSquare size={18} className="text-green-400" />} iconBg="bg-green-900/20"  />
          <StatCard label="Total Shares"   value={combined.shares}   loading={isLoading} icon={<Share2       size={18} className="text-yellow-400" />} iconBg="bg-yellow-900/20" />
        </div>

        {/* Platform breakdown — stack on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Youtube size={18} className="text-red-500" />
              <span className="font-semibold text-sm">YouTube Performance</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Views',    value: ytTotals.totalViews    || 0 },
                { label: 'Likes',    value: ytTotals.totalLikes    || 0 },
                { label: 'Comments', value: ytTotals.totalComments || 0 },
                { label: 'Shares',   value: ytTotals.totalShares   || 0 },
              ].map(s => (
                <div key={s.label} className="bg-[#0f0f0f] rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                  <p className="text-base sm:text-lg font-bold text-white">{formatNumber(s.value)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Instagram size={18} className="text-pink-500" />
              <span className="font-semibold text-sm">Instagram Performance</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Views',    value: igTotals.totalViews    || 0 },
                { label: 'Likes',    value: igTotals.totalLikes    || 0 },
                { label: 'Comments', value: igTotals.totalComments || 0 },
                { label: 'Saves',    value: igTotals.totalSaves    || 0 },
              ].map(s => (
                <div key={s.label} className="bg-[#0f0f0f] rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                  <p className="text-base sm:text-lg font-bold text-white">{formatNumber(s.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="card">
          <h2 className="font-semibold text-white mb-4 text-sm sm:text-base">Performance Over Time</h2>
          <TrendChart data={chartData} />
        </div>

        {/* Tabs — horizontal scroll on mobile */}
        <div>
          <div className="flex border-b border-[#2f2f2f] mb-4 overflow-x-auto scrollbar-hide">
            {[
              { id: 'posts',    label: 'All Posts'  },
              { id: 'channels', label: 'By Channel' },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                className={`tab ${activeTab === t.id ? 'active' : ''}`}>
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === 'posts' && (
            <div className="card overflow-hidden">
              <div className="-mx-4 sm:-mx-5">
                <RecentPostsTable posts={postsData?.posts || []} />
              </div>
            </div>
          )}

          {activeTab === 'channels' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {(channelsData?.channels || []).map((ch: any) => (
                <div key={ch._id} className="card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-[#2f2f2f] overflow-hidden flex items-center justify-center flex-shrink-0">
                      {ch.avatar ? <img src={ch.avatar} className="w-full h-full object-cover" alt="" /> : ch.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{ch.name}</p>
                      <p className="text-xs text-gray-500">{ch.platform}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    {[
                      { label: 'Views',    value: ch.analyticsCache?.totalViews    || 0 },
                      { label: 'Likes',    value: ch.analyticsCache?.totalLikes    || 0 },
                      { label: 'Comments', value: ch.analyticsCache?.totalComments || 0 },
                      { label: 'Shares',   value: ch.analyticsCache?.totalShares   || 0 },
                    ].map(s => (
                      <div key={s.label} className="bg-[#0f0f0f] rounded-lg p-2">
                        <p className="text-xs text-gray-500">{s.label}</p>
                        <p className="text-sm font-bold text-white">{formatNumber(s.value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {!channelsData?.channels?.length && (
                <div className="col-span-full text-center py-8 text-gray-500 text-sm">No channels connected yet.</div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
