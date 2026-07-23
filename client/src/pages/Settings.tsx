import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Youtube, Instagram, Link, Unlink, User, Lock, Bell, CheckCircle2, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Navbar from '../components/layout/Navbar';
import { usersApi, youtubeApi, instagramApi, channelsApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function Settings() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('accounts');
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    if (success === 'youtube_connected') toast.success('YouTube channel connected!');
    else if (success === 'instagram_connected') toast.success('Instagram account connected!');
    else if (error === 'youtube_failed') toast.error('YouTube connection failed. Try again.');
    else if (error === 'instagram_failed') toast.error('Instagram connection failed. Try again.');
    else if (error === 'no_ig_account') toast.error('No Instagram Business account found. Make sure your Instagram is linked to a Facebook page.');
  }, []);

  const { data: channelsData, refetch: refetchChannels } = useQuery({
    queryKey: ['channels'],
    queryFn: channelsApi.getAll,
  });
  const channels = channelsData?.channels || [];

  const connectYouTube = async () => {
    try {
      const res = await youtubeApi.getAuthUrl();
      window.location.href = res.url;
    } catch { toast.error('Failed to start YouTube connection.'); }
  };

  const connectInstagram = async () => {
    try {
      const res = await instagramApi.getAuthUrl();
      window.location.href = res.url;
    } catch { toast.error('Failed to start Instagram connection.'); }
  };

  const disconnectChannel = async (channelId: string) => {
    if (!confirm('Disconnect this channel? You can reconnect anytime.')) return;
    try {
      await channelsApi.delete(channelId);
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      toast.success('Channel disconnected.');
    } catch { toast.error('Failed to disconnect.'); }
  };

  // Profile form
  const { register: regProfile, handleSubmit: handleProfile, formState: { errors: profileErrors } } = useForm({
    defaultValues: { name: user?.name || '', email: user?.email || '' },
  });

  const updateProfile = async (data: any) => {
    try {
      const res = await usersApi.updateProfile({ name: data.name });
      updateUser({ name: res.user.name });
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile.'); }
  };

  // Password form
  const { register: regPw, handleSubmit: handlePw, reset: resetPw, watch: watchPw } = useForm<{ currentPassword: string; newPassword: string; confirmPassword: string }>();
  const changePassword = async (data: any) => {
    if (data.newPassword !== data.confirmPassword) { toast.error('Passwords do not match.'); return; }
    try {
      const { authApi } = await import('../api/client');
      await authApi.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      resetPw();
      toast.success('Password changed!');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to change password.'); }
  };

  const ytChannels = channels.filter((c: any) => c.platform === 'youtube');
  const igAccounts = channels.filter((c: any) => c.platform === 'instagram');

  const tabs = [
    { id: 'accounts', label: 'Connected Accounts' },
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'notifications', label: 'Notifications' },
  ];

  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Settings" />
      <div className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full">
        {/* Tabs — horizontal scroll on narrow screens */}
        <div className="flex border-b border-[#2f2f2f] mb-5 sm:mb-6 overflow-x-auto scrollbar-hide -mx-4 sm:-mx-6 px-4 sm:px-6">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`tab ${activeTab === t.id ? 'active' : ''}`}>{t.label}</button>
          ))}
        </div>

        {/* Connected Accounts */}
        {activeTab === 'accounts' && (
          <div className="space-y-6">
            {/* YouTube */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Youtube size={20} className="text-red-500" />
                  <h3 className="font-semibold text-white">YouTube Channels</h3>
                  <span className="badge-gray">{ytChannels.length}/5</span>
                </div>
                {ytChannels.length < 5 && (
                  <button onClick={connectYouTube} className="btn-primary text-sm flex items-center gap-1.5">
                    <Link size={14} /> Connect
                  </button>
                )}
              </div>

              {ytChannels.length === 0 ? (
                <div className="border-2 border-dashed border-[#2f2f2f] rounded-xl p-8 text-center">
                  <Youtube size={32} className="text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 mb-3">No YouTube channels connected yet</p>
                  <button onClick={connectYouTube} className="btn-primary text-sm">Connect YouTube Channel</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {ytChannels.map((ch: any) => (
                    <div key={ch._id} className="flex items-center gap-3 p-3 bg-[#0f0f0f] rounded-lg border border-[#2f2f2f]">
                      <div className="w-9 h-9 rounded-full bg-[#2f2f2f] overflow-hidden flex-shrink-0">
                        {ch.avatar ? <img src={ch.avatar} className="w-full h-full object-cover" alt="" /> : <span className="flex items-center justify-center h-full text-xs font-bold">{ch.name[0]}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{ch.name}</p>
                        <p className="text-xs text-gray-500">{ch.youtubeData?.subscriberCount?.toLocaleString()} subscribers · {ch.youtubeData?.videoCount} videos</p>
                      </div>
                      <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
                      <button onClick={() => disconnectChannel(ch._id)} className="text-gray-500 hover:text-red-400 transition-colors p-1">
                        <Unlink size={14} />
                      </button>
                    </div>
                  ))}
                  {ytChannels.length < 5 && (
                    <button onClick={connectYouTube} className="w-full border border-dashed border-[#2f2f2f] rounded-lg p-3 text-sm text-gray-500 hover:border-red-600 hover:text-red-400 transition-colors">
                      + Connect another channel
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Instagram */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Instagram size={20} className="text-pink-500" />
                  <h3 className="font-semibold text-white">Instagram Accounts</h3>
                  <span className="badge-gray">{igAccounts.length}/5</span>
                </div>
                {igAccounts.length < 5 && (
                  <button onClick={connectInstagram} className="btn-primary text-sm flex items-center gap-1.5">
                    <Link size={14} /> Connect
                  </button>
                )}
              </div>

              {igAccounts.length === 0 ? (
                <div className="border-2 border-dashed border-[#2f2f2f] rounded-xl p-8 text-center">
                  <Instagram size={32} className="text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 mb-1">No Instagram accounts connected yet</p>
                  <p className="text-xs text-gray-600 mb-3">Requires a Professional (Business/Creator) Instagram account linked to a Facebook page</p>
                  <button onClick={connectInstagram} className="btn-primary text-sm">Connect Instagram Account</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {igAccounts.map((ch: any) => (
                    <div key={ch._id} className="flex items-center gap-3 p-3 bg-[#0f0f0f] rounded-lg border border-[#2f2f2f]">
                      <div className="w-9 h-9 rounded-full bg-[#2f2f2f] overflow-hidden flex-shrink-0">
                        {ch.avatar ? <img src={ch.avatar} className="w-full h-full object-cover" alt="" /> : <span className="flex items-center justify-center h-full text-xs font-bold">{ch.name[0]}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">@{ch.handle}</p>
                        <p className="text-xs text-gray-500">{ch.instagramData?.followersCount?.toLocaleString()} followers · {ch.instagramData?.accountType}</p>
                      </div>
                      <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
                      <button onClick={() => disconnectChannel(ch._id)} className="text-gray-500 hover:text-red-400 transition-colors p-1">
                        <Unlink size={14} />
                      </button>
                    </div>
                  ))}
                  {igAccounts.length < 5 && (
                    <button onClick={connectInstagram} className="w-full border border-dashed border-[#2f2f2f] rounded-lg p-3 text-sm text-gray-500 hover:border-pink-600 hover:text-pink-400 transition-colors">
                      + Connect another account
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile */}
        {activeTab === 'profile' && (
          <div className="card">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><User size={18} /> Profile Information</h3>
            <form onSubmit={handleProfile(updateProfile)} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input className="input" {...regProfile('name', { required: true })} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" {...regProfile('email')} disabled />
                <p className="text-xs text-gray-600 mt-1">Email cannot be changed here</p>
              </div>
              <button type="submit" className="btn-primary">Save Profile</button>
            </form>
          </div>
        )}

        {/* Security */}
        {activeTab === 'security' && (
          <div className="card">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Lock size={18} /> Change Password</h3>
            {user?.googleId && !user?.email && (
              <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-lg mb-4 text-sm text-blue-400">
                You signed in with Google. Set a password to also enable email login.
              </div>
            )}
            <form onSubmit={handlePw(changePassword)} className="space-y-4">
              {user && (
                <div>
                  <label className="label">Current Password</label>
                  <input type="password" className="input" {...regPw('currentPassword', { required: 'Required' })} />
                </div>
              )}
              <div>
                <label className="label">New Password</label>
                <input type="password" className="input" {...regPw('newPassword', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })} />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input type="password" className="input" {...regPw('confirmPassword', { required: 'Required' })} />
              </div>
              <button type="submit" className="btn-primary">Change Password</button>
            </form>
          </div>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div className="card">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Bell size={18} /> Notifications</h3>
            <div className="space-y-3">
              {[
                { label: 'Email on publish success', desc: 'Get notified when your content is published' },
                { label: 'Email on publish failure', desc: 'Get alerted when publishing fails' },
                { label: 'Weekly analytics digest', desc: 'Summary of your performance every Monday' },
                { label: 'New channel milestone', desc: 'When you reach subscriber/follower milestones' },
              ].map(n => (
                <div key={n.label} className="flex items-center justify-between py-3 border-b border-[#1f1f1f] last:border-0">
                  <div>
                    <p className="text-sm text-white">{n.label}</p>
                    <p className="text-xs text-gray-500">{n.desc}</p>
                  </div>
                  <button className="toggle bg-red-600">
                    <span className="inline-block w-3 h-3 rounded-full bg-white shadow transform translate-x-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
