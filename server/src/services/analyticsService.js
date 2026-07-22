const Analytics = require('../models/Analytics');
const Post = require('../models/Post');
const Channel = require('../models/Channel');

// Store analytics snapshot for a post
const savePostAnalytics = async (ownerId, postId, channelId, platform, metrics, date = new Date()) => {
  const dateKey = new Date(date.toDateString()); // Normalize to start of day
  await Analytics.findOneAndUpdate(
    { owner: ownerId, post: postId, date: dateKey, platform },
    { $set: { ...metrics, owner: ownerId, post: postId, channel: channelId, platform, date: dateKey } },
    { upsert: true, new: true }
  );
};

// Store channel-level analytics
const saveChannelAnalytics = async (ownerId, channelId, platform, metrics, date = new Date()) => {
  const dateKey = new Date(date.toDateString());
  await Analytics.findOneAndUpdate(
    { owner: ownerId, channel: channelId, date: dateKey, platform, isChannelLevel: true },
    { $set: { ...metrics, owner: ownerId, channel: channelId, platform, date: dateKey, isChannelLevel: true } },
    { upsert: true, new: true }
  );
};

// Get aggregated analytics for a user across all platforms
const getUserAnalytics = async (ownerId, startDate, endDate, platform = null) => {
  const match = {
    owner: ownerId,
    date: { $gte: new Date(startDate), $lte: new Date(endDate) },
  };
  if (platform) match.platform = platform;

  const daily = await Analytics.aggregate([
    { $match: match },
    {
      $group: {
        _id: { date: '$date', platform: '$platform' },
        views: { $sum: '$views' },
        likes: { $sum: '$likes' },
        comments: { $sum: '$comments' },
        shares: { $sum: '$shares' },
        saves: { $sum: '$saves' },
        reach: { $sum: '$reach' },
        impressions: { $sum: '$impressions' },
      },
    },
    { $sort: { '_id.date': 1 } },
  ]);

  const totals = await Analytics.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$platform',
        totalViews: { $sum: '$views' },
        totalLikes: { $sum: '$likes' },
        totalComments: { $sum: '$comments' },
        totalShares: { $sum: '$shares' },
        totalSaves: { $sum: '$saves' },
        totalReach: { $sum: '$reach' },
        totalImpressions: { $sum: '$impressions' },
      },
    },
  ]);

  return { daily, totals };
};

// Get analytics for a specific channel
const getChannelAnalyticsFromDB = async (channelId, startDate, endDate) => {
  return Analytics.find({
    channel: channelId,
    date: { $gte: new Date(startDate), $lte: new Date(endDate) },
  }).sort({ date: 1 });
};

// Get analytics for a specific post
const getPostAnalyticsFromDB = async (postId, startDate, endDate) => {
  return Analytics.find({
    post: postId,
    date: { $gte: new Date(startDate), $lte: new Date(endDate) },
  }).sort({ date: 1 });
};

// Update post analytics cache
const updatePostAnalyticsCache = async (postId, metrics) => {
  await Post.findByIdAndUpdate(postId, {
    $set: {
      'analytics.totalViews': metrics.totalViews || 0,
      'analytics.totalLikes': metrics.totalLikes || 0,
      'analytics.totalComments': metrics.totalComments || 0,
      'analytics.totalShares': metrics.totalShares || 0,
      'analytics.lastUpdated': new Date(),
    },
  });
};

// Update channel analytics cache
const updateChannelAnalyticsCache = async (channelId, metrics) => {
  await Channel.findByIdAndUpdate(channelId, {
    $set: {
      'analyticsCache.totalViews': metrics.totalViews || 0,
      'analyticsCache.totalLikes': metrics.totalLikes || 0,
      'analyticsCache.totalComments': metrics.totalComments || 0,
      'analyticsCache.totalShares': metrics.totalShares || 0,
      'analyticsCache.lastUpdated': new Date(),
      lastSynced: new Date(),
    },
  });
};

// Top performing posts
const getTopPosts = async (ownerId, limit = 10, metric = 'views') => {
  const sortField = `analytics.total${metric.charAt(0).toUpperCase() + metric.slice(1)}`;
  return Post.find({
    owner: ownerId,
    status: { $in: ['published', 'partially_published'] },
  })
    .sort({ [sortField]: -1 })
    .limit(limit)
    .populate('platforms.channelId', 'name avatar platform');
};

module.exports = {
  savePostAnalytics,
  saveChannelAnalytics,
  getUserAnalytics,
  getChannelAnalyticsFromDB,
  getPostAnalyticsFromDB,
  updatePostAnalyticsCache,
  updateChannelAnalyticsCache,
  getTopPosts,
};
