import { Eye, ThumbsUp, MessageSquare, Share2, ExternalLink } from 'lucide-react';
import { formatNumber, formatRelativeTime, getStatusBadgeClass, getContentTypeIcon, truncate } from '../../utils/helpers';
import { CONTENT_TYPE_LABELS } from '../../types';
import type { Post } from '../../types';

interface Props { posts: Post[]; loading?: boolean; }

export default function RecentPostsTable({ posts, loading }: Props) {
  if (loading) return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse flex gap-3 items-center p-3 rounded-lg bg-[#1a1a1a]">
          <div className="w-12 h-9 bg-[#2f2f2f] rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-[#2f2f2f] rounded w-48" />
            <div className="h-3 bg-[#2f2f2f] rounded w-24" />
          </div>
        </div>
      ))}
    </div>
  );

  if (!posts?.length) return (
    <div className="text-center py-12 text-gray-500">
      <p className="text-sm">No posts yet. Start by uploading content!</p>
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-500 border-b border-[#2f2f2f]">
            <th className="text-left pb-3 font-medium pr-4">Content</th>
            <th className="text-left pb-3 font-medium pr-4">Type</th>
            <th className="text-right pb-3 font-medium pr-4"><Eye size={12} className="inline mr-1" />Views</th>
            <th className="text-right pb-3 font-medium pr-4"><ThumbsUp size={12} className="inline mr-1" />Likes</th>
            <th className="text-right pb-3 font-medium pr-4"><MessageSquare size={12} className="inline mr-1" />Comments</th>
            <th className="text-right pb-3 font-medium pr-4"><Share2 size={12} className="inline mr-1" />Shares</th>
            <th className="text-left pb-3 font-medium pr-4">Status</th>
            <th className="text-left pb-3 font-medium">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1f1f1f]">
          {posts.map(post => {
            const publishedPlatform = post.platforms.find(p => p.status === 'published');
            return (
              <tr key={post._id} className="table-row">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2 max-w-xs">
                    {post.thumbnailUrl
                      ? <img src={post.thumbnailUrl} className="w-12 h-9 rounded object-cover flex-shrink-0" alt="" />
                      : <div className="w-12 h-9 rounded bg-[#2f2f2f] flex items-center justify-center flex-shrink-0 text-lg">{getContentTypeIcon(post.contentType)}</div>}
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate text-xs leading-tight">{truncate(post.title || post.caption || 'Untitled', 50)}</p>
                      {publishedPlatform?.url && (
                        <a href={publishedPlatform.url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1 text-xs mt-0.5">
                          <ExternalLink size={10} /> View
                        </a>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4 text-xs text-gray-400 whitespace-nowrap">
                  {getContentTypeIcon(post.contentType)} {CONTENT_TYPE_LABELS[post.contentType]}
                </td>
                <td className="py-3 pr-4 text-right text-white">{formatNumber(post.analytics?.totalViews || 0)}</td>
                <td className="py-3 pr-4 text-right text-white">{formatNumber(post.analytics?.totalLikes || 0)}</td>
                <td className="py-3 pr-4 text-right text-white">{formatNumber(post.analytics?.totalComments || 0)}</td>
                <td className="py-3 pr-4 text-right text-white">{formatNumber(post.analytics?.totalShares || 0)}</td>
                <td className="py-3 pr-4">
                  <span className={getStatusBadgeClass(post.status)}>{post.status.replace('_', ' ')}</span>
                </td>
                <td className="py-3 text-xs text-gray-500 whitespace-nowrap">{formatRelativeTime(post.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
