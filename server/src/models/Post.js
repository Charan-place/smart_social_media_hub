const mongoose = require('mongoose');

// YouTube-specific settings embedded schema
const youtubeSettingsSchema = new mongoose.Schema({
  title: { type: String, maxlength: 100 },
  description: String,
  tags: [String],
  categoryId: { type: String, default: '22' }, // 22 = People & Blogs
  privacyStatus: { type: String, enum: ['public', 'private', 'unlisted'], default: 'public' },
  madeForKids: { type: Boolean, default: false },
  ageRestricted: { type: Boolean, default: false },
  license: { type: String, enum: ['youtube', 'creativeCommon'], default: 'youtube' },
  embeddable: { type: Boolean, default: true },
  publicStatsViewable: { type: Boolean, default: true },
  notifySubscribers: { type: Boolean, default: true },
  language: { type: String, default: 'en' },
  thumbnailUrl: String,
  thumbnailCloudinaryId: String,
  defaultLanguage: { type: String, default: 'en' },
  recordingDate: Date,
  location: {
    locationDescription: String,
    latitude: Number,
    longitude: Number,
  },
}, { _id: false });

// Instagram-specific settings embedded schema
const instagramSettingsSchema = new mongoose.Schema({
  caption: String,
  locationName: String,
  locationId: String,
  altText: String,
  collaborators: [String], // usernames
  disableComments: { type: Boolean, default: false },
  shareToFacebook: { type: Boolean, default: false },
  shareToTwitter: { type: Boolean, default: false },
  coverImageUrl: String, // For reels - custom cover
  audioName: String,     // For reels
  isSharedToFeed: { type: Boolean, default: true }, // For reels
  productTags: [{
    merchantId: String,
    productId: String,
  }],
  userTags: [{
    username: String,
    x: Number,
    y: Number,
  }],
}, { _id: false });

const postSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Content type
  contentType: {
    type: String,
    enum: ['youtube_video', 'youtube_short', 'instagram_post', 'instagram_reel', 'instagram_story'],
    required: true,
  },

  // Shared fields
  title: { type: String, trim: true, maxlength: 200 },
  caption: { type: String, maxlength: 2200 },
  hashtags: [{ type: String, trim: true }],

  // Media
  mediaUrl: String,           // Cloudinary or direct URL
  mediaPublicId: String,      // Cloudinary public ID
  mediaType: { type: String, enum: ['video', 'image', 'carousel'] },
  thumbnailUrl: String,
  duration: Number,           // seconds
  fileSize: Number,           // bytes
  resolution: String,         // e.g. "1920x1080"

  // Platform publishing
  platforms: [{
    platform: { type: String, enum: ['youtube', 'instagram'] },
    channelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' },
    platformChannelId: String,  // YouTube channel ID or Instagram account ID
    platformPostId: String,     // ID of the post on the platform after publishing
    url: String,                // Live URL of the post
    status: {
      type: String,
      enum: ['pending', 'uploading', 'processing', 'published', 'scheduled', 'failed', 'draft'],
      default: 'pending',
    },
    error: String,
    publishedAt: Date,
    scheduledFor: Date,
  }],

  // Platform-specific settings
  youtubeSettings: youtubeSettingsSchema,
  instagramSettings: instagramSettingsSchema,

  // Overall status
  status: {
    type: String,
    enum: ['draft', 'queued', 'uploading', 'published', 'partially_published', 'scheduled', 'failed'],
    default: 'draft',
  },
  scheduledFor: Date,

  // Analytics snapshot (periodically updated)
  analytics: {
    totalViews: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    totalComments: { type: Number, default: 0 },
    totalShares: { type: Number, default: 0 },
    totalImpressions: { type: Number, default: 0 },
    totalReach: { type: Number, default: 0 },
    averageWatchTime: Number,
    clickThroughRate: Number,
    lastUpdated: Date,
  },

  notes: String,
  tags: [String],  // Internal tags for organization
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

postSchema.index({ owner: 1, createdAt: -1 });
postSchema.index({ status: 1 });
postSchema.index({ scheduledFor: 1, status: 1 });
postSchema.index({ 'platforms.status': 1 });

module.exports = mongoose.model('Post', postSchema);
