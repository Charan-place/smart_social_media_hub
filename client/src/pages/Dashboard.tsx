import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, ThumbsUp, MessageSquare, Share2, Youtube, Instagram, Upload, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import StatCard from '../components/common/StatCard';
import ChannelCard from '../components/dashboard/ChannelCard';
import TrendChart from '../components/dashboard/TrendChart';
import RecentPostsTable from '../components/dashboard/RecentPostsTable';
import { channelsApi, postsApi, analyticsApi } from '../api/client';
import { formatNumber } from '../utils/helpers';
import type { DateRange } from '../types';
import { useAuthStore } from '../store/authStore';

const dateRanges: { label: string; value: DateRange }[] = [
  { label: '7d',  value: '7d'   },
  { label: '28d', value: '28d'  },
  { label: '90d', value: '90d'  },
  { label: '1yr', value: '365d' },
];

export default function Dashboard() {
  const { user } = useAuthStore();
  const [range, setRange] = useState<DateRange>('28d');

  const { data: summaryData,   isLoading: summaryLoading   } = useQuery({ queryKey: ['channels-summary'], queryFn: channelsApi.getSummary });
  const { data: postsData,     isLoading: postsLoading     } = useQuery({ queryKey: ['posts', { limit: 10 }], queryFn: () => postsApi.getAll({ limit: 10 }) });
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({ queryKey: ['analytics-overview', range], queryFn: () => analyticsApi.getOverview({ range }) });

  const summary  = summaryData?.summary;
  const channels = summaryData?.channels || [];

  const chartData = (analyticsData?.daily || []).map((d: any) => ({
    date:     new Date(d._id.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    views:    d.views    || 0,
    likes:    d.likes    || 0,
    comments: d.comments || 0,
    shares:   d.shares   || 0,
  }));

  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Dashboard" subtitle={`Welcome back, ${user?.name?.split(' ')[0]}!`} />

      <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in">

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          <Link to="/upload"    className="btn-primary text-sm gap-2"><Upload   size={16} /> Upload Content</Link>
          <Link to="/analytics" className="btn-secondary text-sm gap-2"><BarChart2 size={16} /> View Analytics</Link>
        </div>

        {/* Stat cards — 2 cols on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Total Views"    value={summary?.totalViews    || 0} loading={summaryLoading} icon={<Eye         size={18} className="text-red-400"    />} iconBg="bg-red-900/20"   />
          <StatCard label="Total Likes"    value={summary?.totalLikes    || 0} loading={summaryLoading} icon={<ThumbsUp    size={18} className="text-blue-400"   />} iconBg="bg-blue-900/20"  />
          <StatCard label="Total Comments" value={summary?.totalComments || 0} loading={summaryLoading} icon={<MessageSquare size={18} className="text-green-400" />} iconBg="bg-green-900/20" />
          <StatCard label="Total Shares"   value={summary?.totalShares   || 0} loading={summaryLoading} icon={<Share2      size={18} className="text-yellow-400" />} iconBg="bg-yellow-900/20"/>
        </div>

        {/* Platform totals — stack on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Youtube size={18} className="text-red-500" />
              <span className="font-semibold text-sm">YouTube</span>
              <span className="badge-gray ml-auto">{summary?.youtube?.count || 0} channels</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-xs text-gray-500">Subscribers</p>
                <p className="text-lg font-bold">{formatNumber(summary?.youtube?.totalSubscribers || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Views</p>
                <p className="text-lg font-bold">{formatNumber(summary?.youtube?.totalViews || 0)}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Instagram size={18} className="text-pink-500" />
              <span className="font-semibold text-sm">Instagram</span>
              <span className="badge-gray ml-auto">{summary?.instagram?.count || 0} accounts</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-xs text-gray-500">Followers</p>
                <p className="text-lg font-bold">{formatNumber(summary?.instagram?.totalFollowers || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Channels</p>
                <p className="text-lg font-bold">{summary?.totalChannels || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="card">
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <h2 className="font-semibold text-white text-sm sm:text-base">Performance Trend</h2>
            {/* Date range — wrapping flex so buttons never overflow */}
            <div className="flex flex-wrap gap-1">
              {dateRanges.map(r => (
                <button
                  key={r.value}
                  onClick={() => setRange(r.value)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors font-medium ${
                    range === r.value ? 'bg-red-600 text-white' : 'bg-[#2f2f2f] text-gray-400 hover:text-white'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          {analyticsLoading
            ? <div className="h-48 sm:h-64 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#2f2f2f] border-t-red-500 rounded-full animate-spin" />
              </div>
            : <TrendChart data={chartData} />}
        </div>

        {/* Channels grid */}
        {channels.length > 0 && (
          <div>
            <h2 className="font-semibold text-white mb-3 text-sm sm:text-base">Connected Channels</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {channels.map((ch: any) => <ChannelCard key={ch._id} channel={ch} />)}
            </div>
          </div>
        )}

        {/* No channels CTA */}
        {!summaryLoading && channels.length === 0 && (
          <div className="card text-center py-10">
            <p className="text-gray-400 mb-3 text-sm">No channels connected yet.</p>
            <Link to="/settings" className="btn-primary text-sm">Connect Channels →</Link>
          </div>
        )}

        {/* Recent posts */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white text-sm sm:text-base">Recent Posts</h2>
            <Link to="/analytics" className="text-xs text-red-400 hover:text-red-300 whitespace-nowrap">View all →</Link>
          </div>
          <div className="-mx-4 sm:-mx-5">
            <RecentPostsTable posts={postsData?.posts || []} loading={postsLoading} />
          </div>
        </div>

      </div>
    </div>
  );
}
