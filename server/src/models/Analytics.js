const mongoose = require('mongoose');

// Stores daily analytics snapshots per channel/post
const analyticsSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
  },
  platform: {
    type: String,
    enum: ['youtube', 'instagram'],
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  // Universal metrics
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  impressions: { type: Number, default: 0 },
  reach: { type: Number, default: 0 },
  saves: { type: Number, default: 0 },

  // YouTube-specific
  youtubeMetrics: {
    dislikes: Number,
    favorites: Number,
    estimatedMinutesWatched: Number,
    averageViewDuration: Number,
    averageViewPercentage: Number,
    annotationClickThroughRate: Number,
    annotationCloseRate: Number,
    subscribersGained: Number,
    subscribersLost: Number,
    cardClickRate: Number,
    cardTeaserClickRate: Number,
  },

  // Instagram-specific
  instagramMetrics: {
    profileVisits: Number,
    websiteClicks: Number,
    emailClicks: Number,
    follows: Number,
    storyReplies: Number,
    stickerTaps: Number,
    exits: Number,
    swipeAway: Number,
  },

  // Channel-level (when no post attached)
  channelMetrics: {
    subscriberCount: Number,
    followerCount: Number,
    totalVideoCount: Number,
    totalMediaCount: Number,
  },

  isChannelLevel: { type: Boolean, default: false },
}, {
  timestamps: true,
});

analyticsSchema.index({ owner: 1, date: -1 });
analyticsSchema.index({ channel: 1, date: -1 });
analyticsSchema.index({ post: 1, date: -1 });
analyticsSchema.index({ owner: 1, platform: 1, date: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
