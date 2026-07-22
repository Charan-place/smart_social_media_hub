const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  platform: {
    type: String,
    enum: ['youtube', 'instagram'],
    required: true,
  },
  platformId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  handle: String,
  avatar: String,
  description: String,
  url: String,

  // YouTube-specific
  youtubeData: {
    subscriberCount: Number,
    videoCount: Number,
    viewCount: Number,
    country: String,
    customUrl: String,
    publishedAt: Date,
  },

  // Instagram-specific
  instagramData: {
    followersCount: Number,
    followingCount: Number,
    mediaCount: Number,
    accountType: { type: String, enum: ['PERSONAL', 'BUSINESS', 'MEDIA_CREATOR'] },
    website: String,
  },

  isActive: { type: Boolean, default: true },
  lastSynced: Date,

  // Cached analytics summary
  analyticsCache: {
    totalViews: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    totalComments: { type: Number, default: 0 },
    totalShares: { type: Number, default: 0 },
    lastUpdated: Date,
  },
}, {
  timestamps: true,
});

channelSchema.index({ owner: 1, platform: 1 });
channelSchema.index({ platformId: 1, platform: 1 }, { unique: true });

module.exports = mongoose.model('Channel', channelSchema);
