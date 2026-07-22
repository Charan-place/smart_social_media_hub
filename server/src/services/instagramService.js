const axios = require('axios');

const GRAPH_API = 'https://graph.facebook.com/v18.0';

// Generate Instagram OAuth URL
const getAuthUrl = (userId) => {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID,
    redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
    scope: 'instagram_basic,instagram_content_publish,instagram_manage_insights,pages_read_engagement',
    response_type: 'code',
    state: userId,
  });
  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
};

// Exchange code for access token
const exchangeCode = async (code) => {
  const res = await axios.post(`${GRAPH_API}/oauth/access_token`, {
    client_id: process.env.META_APP_ID,
    client_secret: process.env.META_APP_SECRET,
    redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
    code,
  });
  return res.data; // { access_token, token_type }
};

// Get long-lived token
const getLongLivedToken = async (shortToken) => {
  const res = await axios.get(`${GRAPH_API}/oauth/access_token`, {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      fb_exchange_token: shortToken,
    },
  });
  return res.data;
};

// Get user's Instagram accounts linked to Facebook
const getInstagramAccounts = async (accessToken) => {
  const pagesRes = await axios.get(`${GRAPH_API}/me/accounts`, {
    params: { access_token: accessToken, fields: 'id,name,instagram_business_account' },
  });

  const accounts = [];
  for (const page of pagesRes.data.data || []) {
    if (page.instagram_business_account) {
      const igRes = await axios.get(`${GRAPH_API}/${page.instagram_business_account.id}`, {
        params: { access_token: accessToken, fields: 'id,username,name,profile_picture_url,followers_count,media_count,account_type' },
      });
      accounts.push({ ...igRes.data, pageAccessToken: accessToken });
    }
  }
  return accounts;
};

// Get account info
const getAccountInfo = async (accountId, accessToken) => {
  const res = await axios.get(`${GRAPH_API}/${accountId}`, {
    params: {
      access_token: accessToken,
      fields: 'id,username,name,biography,profile_picture_url,followers_count,follows_count,media_count,account_type,website',
    },
  });
  return res.data;
};

// Create media container for IMAGE post
const createImageContainer = async (accountId, accessToken, imageUrl, caption) => {
  const res = await axios.post(`${GRAPH_API}/${accountId}/media`, {
    image_url: imageUrl,
    caption,
    access_token: accessToken,
  });
  return res.data.id; // container ID
};

// Create media container for VIDEO/REEL
const createVideoContainer = async (accountId, accessToken, videoUrl, caption, settings = {}) => {
  const params = {
    video_url: videoUrl,
    caption,
    media_type: 'REELS',
    access_token: accessToken,
  };
  if (settings.shareToFeed !== undefined) params.share_to_feed = settings.shareToFeed;
  if (settings.audioName) params.audio_name = settings.audioName;
  if (settings.coverUrl) params.cover_url = settings.coverUrl;

  const res = await axios.post(`${GRAPH_API}/${accountId}/media`, params);
  return res.data.id;
};

// Create carousel container
const createCarouselContainer = async (accountId, accessToken, imageUrls, caption) => {
  const childIds = [];
  for (const url of imageUrls) {
    const res = await axios.post(`${GRAPH_API}/${accountId}/media`, {
      image_url: url,
      is_carousel_item: true,
      access_token: accessToken,
    });
    childIds.push(res.data.id);
  }
  const carousel = await axios.post(`${GRAPH_API}/${accountId}/media`, {
    media_type: 'CAROUSEL',
    children: childIds.join(','),
    caption,
    access_token: accessToken,
  });
  return carousel.data.id;
};

// Check container status
const checkContainerStatus = async (containerId, accessToken) => {
  const res = await axios.get(`${GRAPH_API}/${containerId}`, {
    params: { fields: 'status_code,status', access_token: accessToken },
  });
  return res.data; // { status_code: 'FINISHED' | 'IN_PROGRESS' | 'ERROR', status: '...' }
};

// Publish media container
const publishContainer = async (accountId, accessToken, containerId) => {
  const res = await axios.post(`${GRAPH_API}/${accountId}/media_publish`, {
    creation_id: containerId,
    access_token: accessToken,
  });
  return res.data.id; // media ID
};

// Get media URL after publish
const getMediaUrl = async (mediaId, accessToken) => {
  const res = await axios.get(`${GRAPH_API}/${mediaId}`, {
    params: { fields: 'id,permalink,thumbnail_url,media_url', access_token: accessToken },
  });
  return res.data;
};

// Get media insights
const getMediaInsights = async (mediaId, accessToken, mediaType = 'IMAGE') => {
  const metrics = mediaType === 'VIDEO' || mediaType === 'REELS'
    ? 'plays,reach,saved,video_views,impressions,likes,comments,shares'
    : 'impressions,reach,saved,likes,comments,shares';

  const res = await axios.get(`${GRAPH_API}/${mediaId}/insights`, {
    params: { metric: metrics, access_token: accessToken },
  });
  return res.data.data;
};

// Get account insights
const getAccountInsights = async (accountId, accessToken, since, until) => {
  const res = await axios.get(`${GRAPH_API}/${accountId}/insights`, {
    params: {
      metric: 'impressions,reach,profile_views,follower_count,email_contacts,website_clicks',
      period: 'day',
      since,
      until,
      access_token: accessToken,
    },
  });
  return res.data.data;
};

// Get account media list
const getAccountMedia = async (accountId, accessToken, limit = 20) => {
  const res = await axios.get(`${GRAPH_API}/${accountId}/media`, {
    params: {
      fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
      limit,
      access_token: accessToken,
    },
  });
  return res.data.data;
};

// Poll until container is ready (for videos)
const waitForContainer = async (containerId, accessToken, maxAttempts = 20) => {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await checkContainerStatus(containerId, accessToken);
    if (status.status_code === 'FINISHED') return true;
    if (status.status_code === 'ERROR') throw new Error(`Container error: ${status.status}`);
    await new Promise(r => setTimeout(r, 5000)); // wait 5s between checks
  }
  throw new Error('Container processing timed out.');
};

module.exports = {
  getAuthUrl,
  exchangeCode,
  getLongLivedToken,
  getInstagramAccounts,
  getAccountInfo,
  createImageContainer,
  createVideoContainer,
  createCarouselContainer,
  checkContainerStatus,
  publishContainer,
  getMediaUrl,
  getMediaInsights,
  getAccountInsights,
  getAccountMedia,
  waitForContainer,
};
