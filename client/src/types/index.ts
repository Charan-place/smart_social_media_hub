export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  isActive: boolean;
  preferences: {
    defaultPlatforms: ('youtube' | 'instagram')[];
    timezone: string;
    emailNotifications: boolean;
  };
  createdAt: string;
  lastLogin?: string;
  connectedChannelsCount?: number;
}

export interface Admin {
  _id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin';
  permissions: Record<string, boolean>;
  isActive: boolean;
  lastLogin?: string;
}

export interface Channel {
  _id: string;
  owner: string;
  platform: 'youtube' | 'instagram';
  platformId: string;
  name: string;
  handle?: string;
  avatar?: string;
  description?: string;
  url?: string;
  youtubeData?: {
    subscriberCount: number;
    videoCount: number;
    viewCount: number;
    country?: string;
    customUrl?: string;
  };
  instagramData?: {
    followersCount: number;
    followingCount: number;
    mediaCount: number;
    accountType: string;
    website?: string;
  };
  analyticsCache?: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    lastUpdated?: string;
  };
  isActive: boolean;
  lastSynced?: string;
  createdAt: string;
}

export type ContentType = 'youtube_video' | 'youtube_short' | 'instagram_post' | 'instagram_reel' | 'instagram_story';
export type PostStatus = 'draft' | 'queued' | 'uploading' | 'published' | 'partially_published' | 'scheduled' | 'failed';
export type PlatformStatus = 'pending' | 'uploading' | 'processing' | 'published' | 'scheduled' | 'failed' | 'draft';

export interface YouTubeSettings {
  title?: string;
  description?: string;
  tags?: string[];
  categoryId?: string;
  privacyStatus?: 'public' | 'private' | 'unlisted';
  madeForKids?: boolean;
  ageRestricted?: boolean;
  license?: 'youtube' | 'creativeCommon';
  embeddable?: boolean;
  publicStatsViewable?: boolean;
  notifySubscribers?: boolean;
  language?: string;
  thumbnailUrl?: string;
  recordingDate?: string;
}

export interface InstagramSettings {
  caption?: string;
  locationName?: string;
  locationId?: string;
  altText?: string;
  collaborators?: string[];
  disableComments?: boolean;
  shareToFacebook?: boolean;
  shareToTwitter?: boolean;
  coverImageUrl?: string;
  audioName?: string;
  isSharedToFeed?: boolean;
}

export interface PostPlatform {
  platform: 'youtube' | 'instagram';
  channelId?: Channel;
  platformChannelId?: string;
  platformPostId?: string;
  url?: string;
  status: PlatformStatus;
  error?: string;
  publishedAt?: string;
  scheduledFor?: string;
}

export interface Post {
  _id: string;
  owner: string;
  contentType: ContentType;
  title?: string;
  caption?: string;
  hashtags: string[];
  mediaUrl?: string;
  mediaType?: 'video' | 'image' | 'carousel';
  thumbnailUrl?: string;
  duration?: number;
  platforms: PostPlatform[];
  youtubeSettings?: YouTubeSettings;
  instagramSettings?: InstagramSettings;
  status: PostStatus;
  scheduledFor?: string;
  analytics: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalImpressions?: number;
    totalReach?: number;
    lastUpdated?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsData {
  date: string;
  platform: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves?: number;
  reach?: number;
  impressions?: number;
}

export interface DashboardSummary {
  totalChannels: number;
  youtube: { count: number; totalSubscribers: number; totalViews: number };
  instagram: { count: number; totalFollowers: number };
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  channels: Channel[];
}

export type DateRange = '7d' | '28d' | '30d' | '90d' | '365d';

export interface PaginatedResponse<T> {
  success: boolean;
  data?: T[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  youtube_video: 'YouTube Video',
  youtube_short: 'YouTube Short',
  instagram_post: 'Instagram Post',
  instagram_reel: 'Instagram Reel',
  instagram_story: 'Instagram Story',
};

export const YOUTUBE_CATEGORIES = [
  { id: '1', label: 'Film & Animation' },
  { id: '2', label: 'Autos & Vehicles' },
  { id: '10', label: 'Music' },
  { id: '15', label: 'Pets & Animals' },
  { id: '17', label: 'Sports' },
  { id: '19', label: 'Travel & Events' },
  { id: '20', label: 'Gaming' },
  { id: '22', label: 'People & Blogs' },
  { id: '23', label: 'Comedy' },
  { id: '24', label: 'Entertainment' },
  { id: '25', label: 'News & Politics' },
  { id: '26', label: 'Howto & Style' },
  { id: '27', label: 'Education' },
  { id: '28', label: 'Science & Technology' },
  { id: '29', label: 'Nonprofits & Activism' },
];
