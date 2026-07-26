const { google } = require('googleapis');
const { Readable } = require('stream');
const User = require('../models/User');
const Channel = require('../models/Channel');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.SERVER_URL}/api/youtube/callback`
);

const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

// Generate YouTube OAuth URL
const getAuthUrl = (userId) => {
  const scopes = [
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/yt-analytics.readonly',
  ];
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: userId,
    prompt: 'consent',
  });
};

// Exchange code for tokens
const exchangeCode = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

// Set credentials for a specific user's channel
const setCredentials = (tokens) => {
  oauth2Client.setCredentials(tokens);
};

// Refresh access token
const refreshAccessToken = async (refreshToken) => {
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
};

// Get channel info
const getChannelInfo = async (tokens) => {
  setCredentials(tokens);
  const response = await youtube.channels.list({
    part: ['snippet', 'statistics', 'brandingSettings'],
    mine: true,
  });
  return response.data.items;
};

// Upload a video to YouTube
const uploadVideo = async (tokens, videoBuffer, settings) => {
  setCredentials(tokens);
  const {
    title,
    description,
    tags = [],
    categoryId = '22',
    privacyStatus = 'public',
    madeForKids = false,
    license = 'youtube',
    embeddable = true,
    publicStatsViewable = true,
    notifySubscribers = true,
    language = 'en',
    scheduledPublishTime,
  } = settings;

  const requestBody = {
    snippet: {
      title,
      description,
      tags,
      categoryId,
      defaultLanguage: language,
      defaultAudioLanguage: language,
    },
    status: {
      privacyStatus: scheduledPublishTime ? 'private' : privacyStatus,
      selfDeclaredMadeForKids: madeForKids,
      license,
      embeddable,
      publicStatsViewable,
    },
  };

  if (scheduledPublishTime) {
    requestBody.status.publishAt = scheduledPublishTime;
  }

  // Google API requires a readable stream, not a raw Buffer
  const videoStream = Readable.from(videoBuffer);

  const response = await youtube.videos.insert({
    part: ['snippet', 'status'],
    notifySubscribers,
    requestBody,
    media: {
      body: videoStream,
    },
  });

  return response.data;
};

// Upload a thumbnail
const setThumbnail = async (tokens, videoId, thumbnailBuffer) => {
  setCredentials(tokens);
  const thumbnailStream = Readable.from(thumbnailBuffer);
  const response = await youtube.thumbnails.set({
    videoId,
    media: {
      body: thumbnailStream,
    },
  });
  return response.data;
};

// Get video analytics
const getVideoAnalytics = async (tokens, videoId, startDate, endDate) => {
  setCredentials(tokens);
  const youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth: oauth2Client });

  const response = await youtubeAnalytics.reports.query({
    ids: 'channel==MINE',
    startDate,
    endDate,
    metrics: 'views,likes,dislikes,comments,shares,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,subscribersLost',
    dimensions: 'day',
    filters: `video==${videoId}`,
    sort: 'day',
  });
  return response.data;
};

// Get channel analytics
const getChannelAnalytics = async (tokens, channelId, startDate, endDate) => {
  setCredentials(tokens);
  const youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth: oauth2Client });

  const response = await youtubeAnalytics.reports.query({
    ids: `channel==${channelId}`,
    startDate,
    endDate,
    metrics: 'views,likes,comments,shares,estimatedMinutesWatched,subscribersGained,subscribersLost',
    dimensions: 'day',
    sort: 'day',
  });
  return response.data;
};

// Get video details/stats
const getVideoDetails = async (tokens, videoIds) => {
  setCredentials(tokens);
  const response = await youtube.videos.list({
    part: ['snippet', 'statistics', 'contentDetails', 'status'],
    id: videoIds,
  });
  return response.data.items;
};

// Get all videos for a channel
const getChannelVideos = async (tokens, channelId, maxResults = 50) => {
  setCredentials(tokens);
  const response = await youtube.search.list({
    part: ['snippet'],
    channelId,
    maxResults,
    order: 'date',
    type: ['video'],
  });
  const videoIds = response.data.items.map(item => item.id.videoId);
  if (videoIds.length === 0) return [];
  return getVideoDetails(tokens, videoIds);
};

// YouTube video categories
const getVideoCategories = async (tokens, regionCode = 'US') => {
  setCredentials(tokens);
  const response = await youtube.videoCategories.list({
    part: ['snippet'],
    regionCode,
    hl: 'en',
  });
  return response.data.items;
};

module.exports = {
  getAuthUrl,
  exchangeCode,
  setCredentials,
  refreshAccessToken,
  getChannelInfo,
  uploadVideo,
  setThumbnail,
  getVideoAnalytics,
  getChannelAnalytics,
  getVideoDetails,
  getChannelVideos,
  getVideoCategories,
};
