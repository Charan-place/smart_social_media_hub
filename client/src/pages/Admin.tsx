import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Youtube, Instagram, FileVideo, BarChart2, UserCheck, UserX, ShieldCheck, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatNumber, formatRelativeTime } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function Admin() {
  const navigate = useNavigate();
  const { admin, logoutAdmin } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [userSearch, setUserSearch] = useState('');

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getStats,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', userSearch],
    queryFn: () => adminApi.getUsers({ search: userSearch || undefined }),
  });

  const { data: channelsData } = useQuery({
    queryKey: ['admin-channels'],
    queryFn: () => adminApi.getChannels(),
  });

  const { data: postsData } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: () => adminApi.getPosts(),
  });

  const toggleUserMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleUser(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User updated.'); },
    onError: () => toast.error('Failed to update user.'),
  });

  const stats = statsData?.stats || {};

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Admin Sidebar */}
      <aside className="w-52 bg-[#0a0a0a] border-r border-[#1f1f1f] flex flex-col">
        <div className="px-4 py-5 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-red-400" />
            <div>
              <p className="text-xs font-bold text-white">Admin Panel</p>
              <p className="text-xs text-gray-600">{admin?.role}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart2 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'channels', label: 'Channels', icon: Youtube },
            { id: 'posts', label: 'Posts', icon: FileVideo },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`sidebar-item w-full ${activeTab === id ? 'active' : ''}`}>
              <Icon size={16} />{label}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-[#1f1f1f]">
          <div className="px-2 mb-2">
            <p className="text-xs font-medium text-white truncate">{admin?.name}</p>
            <p className="text-xs text-gray-600 truncate">{admin?.email}</p>
          </div>
          <button onClick={handleLogout} className="sidebar-item w-full text-red-400 hover:bg-red-950/20">
            <LogOut size={14} />Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
            <span className="badge-red">{admin?.role?.replace('_', ' ')}</span>
          </div>

          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Users" value={stats.totalUsers || 0} loading={statsLoading}
                  icon={<Users size={18} className="text-blue-400" />} iconBg="bg-blue-900/20" />
                <StatCard label="Connected Channels" value={stats.totalChannels || 0} loading={statsLoading}
                  icon={<Youtube size={18} className="text-red-400" />} iconBg="bg-red-900/20" />
                <StatCard label="Total Posts" value={stats.totalPosts || 0} loading={statsLoading}
                  icon={<FileVideo size={18} className="text-green-400" />} iconBg="bg-green-900/20" />
                <StatCard label="Active Users" value={stats.activeUsers || 0} loading={statsLoading}
                  icon={<UserCheck size={18} className="text-yellow-400" />} iconBg="bg-yellow-900/20" />
              </div>

              {/* Recent users */}
              <div className="card">
                <h3 className="font-semibold text-white mb-4">Recent Registrations</h3>
                <div className="space-y-2">
                  {(statsData?.recentUsers || []).map((u: any) => (
                    <div key={u._id} className="flex items-center gap-3 p-3 bg-[#0f0f0f] rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{u.name[0]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">{formatRelativeTime(u.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Posts by type */}
              <div className="card">
                <h3 className="font-semibold text-white mb-4">Content Breakdown</h3>
                <div className="grid grid-cols-3 gap-3">
                  {(statsData?.postsByType || []).map((t: any) => (
                    <div key={t._id} className="bg-[#0f0f0f] rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">{t._id?.replace('_', ' ')}</p>
                      <p className="text-lg font-bold text-white">{t.count}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users */}
          {activeTab === 'users' && (
            <div className="space-y-4 animate-fade-in">
              <input
                className="input max-w-xs"
                placeholder="Search users..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
              />
              <div className="card overflow-hidden p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-[#2f2f2f] bg-[#0f0f0f]">
                      <th className="text-left py-3 px-4 font-medium">User</th>
                      <th className="text-left py-3 px-4 font-medium">Role</th>
                      <th className="text-left py-3 px-4 font-medium">Last Login</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersLoading
                      ? <tr><td colSpan={5} className="py-8 text-center"><LoadingSpinner /></td></tr>
                      : (usersData?.users || []).map((u: any) => (
                        <tr key={u._id} className="table-row">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{u.name[0]}</div>
                              <div>
                                <p className="font-medium text-white text-xs">{u.name}</p>
                                <p className="text-gray-500 text-xs">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4"><span className="badge-gray text-xs">{u.role}</span></td>
                          <td className="py-3 px-4 text-xs text-gray-500">{u.lastLogin ? formatRelativeTime(u.lastLogin) : 'Never'}</td>
                          <td className="py-3 px-4">
                            <span className={u.isActive ? 'badge-green' : 'badge-red'}>{u.isActive ? 'Active' : 'Inactive'}</span>
                          </td>
                          <td className="py-3 px-4">
                            <button onClick={() => toggleUserMutation.mutate(u._id)}
                              className={`text-xs px-2 py-1 rounded-md border transition-colors ${u.isActive ? 'border-red-900/30 text-red-400 hover:bg-red-950/20' : 'border-green-900/30 text-green-400 hover:bg-green-950/20'}`}>
                              {u.isActive ? <><UserX size={11} className="inline mr-1" />Deactivate</> : <><UserCheck size={11} className="inline mr-1" />Activate</>}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Channels */}
          {activeTab === 'channels' && (
            <div className="card overflow-hidden p-0 animate-fade-in">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-[#2f2f2f] bg-[#0f0f0f]">
                    <th className="text-left py-3 px-4 font-medium">Channel</th>
                    <th className="text-left py-3 px-4 font-medium">Platform</th>
                    <th className="text-left py-3 px-4 font-medium">Owner</th>
                    <th className="text-right py-3 px-4 font-medium">Followers</th>
                  </tr>
                </thead>
                <tbody>
                  {(channelsData?.channels || []).map((ch: any) => (
                    <tr key={ch._id} className="table-row">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#2f2f2f] overflow-hidden flex-shrink-0">
                            {ch.avatar ? <img src={ch.avatar} className="w-full h-full object-cover" alt="" /> : <span className="flex items-center justify-center h-full text-xs">{ch.name[0]}</span>}
                          </div>
                          <p className="text-xs font-medium text-white">{ch.name}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`badge ${ch.platform === 'youtube' ? 'badge-red' : 'bg-pink-900/30 text-pink-400'}`}>
                          {ch.platform}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-400">{ch.owner?.name}</td>
                      <td className="py-3 px-4 text-right text-xs text-white">
                        {formatNumber(ch.youtubeData?.subscriberCount || ch.instagramData?.followersCount || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Posts */}
          {activeTab === 'posts' && (
            <div className="card overflow-hidden p-0 animate-fade-in">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-[#2f2f2f] bg-[#0f0f0f]">
                    <th className="text-left py-3 px-4 font-medium">Post</th>
                    <th className="text-left py-3 px-4 font-medium">Type</th>
                    <th className="text-left py-3 px-4 font-medium">Owner</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-right py-3 px-4 font-medium">Views</th>
                  </tr>
                </thead>
                <tbody>
                  {(postsData?.posts || []).map((p: any) => (
                    <tr key={p._id} className="table-row">
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-xs font-medium text-white truncate">{p.title || p.caption?.slice(0, 60) || 'Untitled'}</p>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-400">{p.contentType?.replace('_', ' ')}</td>
                      <td className="py-3 px-4 text-xs text-gray-400">{p.owner?.name}</td>
                      <td className="py-3 px-4">
                        <span className={`badge ${p.status === 'published' ? 'badge-green' : p.status === 'failed' ? 'badge-red' : 'badge-gray'}`}>{p.status}</span>
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-white">{formatNumber(p.analytics?.totalViews || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
