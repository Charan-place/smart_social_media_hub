import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatNumber = (n: number): string => {
  if (!n) return '0';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
};

export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatRelativeTime = (date: string | Date): string => {
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d ago`;
  return formatDate(date);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export const truncate = (str: string, max = 60): string =>
  str.length > max ? `${str.slice(0, max)}…` : str;

export const getPlatformColor = (platform: string) =>
  platform === 'youtube' ? '#FF0000' : platform === 'instagram' ? '#E1306C' : '#888';

export const getStatusBadgeClass = (status: string): string => {
  const map: Record<string, string> = {
    published: 'badge-green',
    partially_published: 'badge-yellow',
    failed: 'badge-red',
    draft: 'badge-gray',
    scheduled: 'badge-blue',
    uploading: 'badge-blue',
    queued: 'badge-yellow',
  };
  return map[status] || 'badge-gray';
};

export const getContentTypeIcon = (type: string): string => {
  const map: Record<string, string> = {
    youtube_video: '📹',
    youtube_short: '⚡',
    instagram_post: '📸',
    instagram_reel: '🎬',
    instagram_story: '⭕',
  };
  return map[type] || '📄';
};
