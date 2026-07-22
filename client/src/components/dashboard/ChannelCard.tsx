import { Youtube, Instagram, Users, Eye, ExternalLink } from 'lucide-react';
import { formatNumber } from '../../utils/helpers';
import type { Channel } from '../../types';

export default function ChannelCard({ channel }: { channel: Channel }) {
  const isYT = channel.platform === 'youtube';

  return (
    <div className="card hover:border-[#3f3f3f] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-[#2f2f2f] flex items-center justify-center overflow-hidden">
              {channel.avatar
                ? <img src={channel.avatar} alt={channel.name} className="w-full h-full object-cover" />
                : <span className="text-sm font-bold">{channel.name[0]}</span>}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${isYT ? 'bg-red-600' : 'bg-pink-600'}`}>
              {isYT ? <Youtube size={10} className="text-white" /> : <Instagram size={10} className="text-white" />}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">{channel.name}</p>
            <p className="text-xs text-gray-500">{channel.handle ? `@${channel.handle}` : channel.platform}</p>
          </div>
        </div>
        {channel.url && (
          <a href={channel.url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#0f0f0f] rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 text-gray-500 mb-1">
            <Users size={12} />
            <span className="text-xs">{isYT ? 'Subscribers' : 'Followers'}</span>
          </div>
          <p className="text-sm font-bold text-white">
            {formatNumber(isYT
              ? (channel.youtubeData?.subscriberCount || 0)
              : (channel.instagramData?.followersCount || 0))}
          </p>
        </div>
        <div className="bg-[#0f0f0f] rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 text-gray-500 mb-1">
            <Eye size={12} />
            <span className="text-xs">{isYT ? 'Total Views' : 'Posts'}</span>
          </div>
          <p className="text-sm font-bold text-white">
            {formatNumber(isYT
              ? (channel.youtubeData?.viewCount || 0)
              : (channel.instagramData?.mediaCount || 0))}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Views', value: channel.analyticsCache?.totalViews || 0 },
          { label: 'Likes', value: channel.analyticsCache?.totalLikes || 0 },
          { label: 'Comments', value: channel.analyticsCache?.totalComments || 0 },
        ].map(stat => (
          <div key={stat.label}>
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-sm font-semibold text-white">{formatNumber(stat.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
