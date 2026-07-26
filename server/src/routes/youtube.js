const express = require('express');
const router = express.Router();
const ytService = require('../services/youtubeService');
const analyticsService = require('../services/analyticsService');
const User = require('../models/User');
const Channel = require('../models/Channel');
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');
const { uploadMemory } = require('../config/cloudinary');
const { uploadLimiter } = require('../middleware/rateLimit');
const { formatDateRange } = require('../utils/helpers');
const { encrypt, decrypt } = require('../utils/crypto');

// GET /api/youtube/auth — initiate YouTube OAuth
router.get('/auth', protect, (req, res) => {
  const url = ytService.getAuthUrl(req.user._id.toString());
  res.json({ success: true, url });
});

// GET /api/youtube/callback — handle YouTube OAuth callback
// NOTE: no `protect` here — this is a redirect from Google, so no cookie/JWT is present.
// The user identity comes from the `state` param set during /auth (contains the user's MongoDB _id).
router.get('/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query;
    if (!code) return res.redirect(`${process.env.CLIENT_URL}/settings?error=no_code`);

    const tokens = await ytService.exchangeCode(code);
    const channels = await ytService.getChannelInfo(tokens);

    if (!channels || channels.length === 0)
      return res.redirect(`${process.env.CLIENT_URL}/settings?error=no_channel`);

    for (const ch of channels) {
      const channelData = {
        channelId: ch.id,
        channelName: ch.snippet.title,
        channelAvatar: ch.snippet.thumbnails?.default?.url || '',
        accessToken: encrypt(tokens.access_token),
        refreshToken: encrypt(tokens.refresh_token),
        tokenExpiry: new Date(tokens.expiry_date),
        connectedAt: new Date(),
      };

      // Save/update token in user
      await User.findByIdAndUpdate(userId, {
        $pull: { youtubeTokens: { channelId: ch.id } },
      });
      await User.findByIdAndUpdate(userId, {
        $push: { youtubeTokens: channelData },
      });

      // Upsert channel document
      await Channel.findOneAndUpdate(
        { platformId: ch.id, platform: 'youtube' },
        {
          owner: userId,
          platform: 'youtube',
          platformId: ch.id,
          name: ch.snippet.title,
          handle: ch.snippet.customUrl || '',
          avatar: ch.snippet.thumbnails?.default?.url || '',
          description: ch.snippet.description || '',
          url: `https://youtube.com/channel/${ch.id}`,
          youtubeData: {
            subscriberCount: parseInt(ch.statistics?.subscriberCount || 0),
            videoCount: parseInt(ch.statistics?.videoCount || 0),
            viewCount: parseInt(ch.statistics?.viewCount || 0),
            country: ch.snippet?.country || '',
            customUrl: ch.snippet?.customUrl || '',
            publishedAt: ch.snippet?.publishedAt,
          },
          lastSynced: new Date(),
        },
        { upsert: true, new: true }
      );
    }

    res.redirect(`${process.env.CLIENT_URL}/settings?success=youtube_connected`);
  } catch (err) {
    console.error('YouTube callback error:', err);
    res.redirect(`${process.env.CLIENT_URL}/settings?error=youtube_failed`);
  }
});

// POST /api/youtube/upload — upload video to YouTube
router.post('/upload', protect, uploadLimiter, uploadMemory.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]), async (req, res) => {
  try {
    const { channelIds, settings, postId } = req.body;
    const parsedChannelIds = JSON.parse(channelIds || '[]');
    const parsedSettings = JSON.parse(settings || '{}');
    const videoFile = req.files?.video?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    if (!videoFile) return res.status(400).json({ success: false, message: 'Video file is required.' });

    const user = await User.findById(req.user._id);
    const results = [];

    for (const channelId of parsedChannelIds) {
      const tokenEntry = user.youtubeTokens?.find(t => t.channelId === channelId);
      if (!tokenEntry) { results.push({ channelId, status: 'failed', error: 'Channel not connected.' }); continue; }

      try {
        // Decrypt tokens
        const decryptedAccess = decrypt(tokenEntry.accessToken);
        const decryptedRefresh = decrypt(tokenEntry.refreshToken);

        // Refresh token if needed
        let tokens = { access_token: decryptedAccess, refresh_token: decryptedRefresh };
        if (new Date(tokenEntry.tokenExpiry) < new Date()) {
          tokens = await ytService.refreshAccessToken(decryptedRefresh);
          await User.findOneAndUpdate(
            { _id: req.user._id, 'youtubeTokens.channelId': channelId },
            { $set: { 'youtubeTokens.$.accessToken': encrypt(tokens.access_token), 'youtubeTokens.$.tokenExpiry': new Date(tokens.expiry_date) } }
          );
        }

        const videoData = await ytService.uploadVideo(tokens, videoFile.buffer, parsedSettings);

        if (thumbnailFile && videoData.id) {
          try { await ytService.setThumbnail(tokens, videoData.id, thumbnailFile.buffer); } catch (_) {}
        }

        results.push({
          channelId,
          status: 'published',
          videoId: videoData.id,
          url: `https://youtube.com/watch?v=${videoData.id}`,
        });

        // Update post platforms status
        if (postId) {
          const channel = await Channel.findOne({ platformId: channelId, platform: 'youtube' });
          await Post.findByIdAndUpdate(postId, {
            $set: {
              'platforms.$[elem].status': 'published',
              'platforms.$[elem].platformPostId': videoData.id,
              'platforms.$[elem].url': `https://youtube.com/watch?v=${videoData.id}`,
              'platforms.$[elem].publishedAt': new Date(),
            },
          }, { arrayFilters: [{ 'elem.platformChannelId': channelId }] });
        }
      } catch (e) {
        results.push({ channelId, status: 'failed', error: e.message });
      }
    }

    const allPublished = results.every(r => r.status === 'published');
    const somePublished = results.some(r => r.status === 'published');
    if (postId) {
      await Post.findByIdAndUpdate(postId, {
        status: allPublished ? 'published' : somePublished ? 'partially_published' : 'failed',
      });
    }

    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/youtube/videos/:channelId — get videos for a channel
router.get('/videos/:channelId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const tokenEntry = user.youtubeTokens?.find(t => t.channelId === req.params.channelId);
    if (!tokenEntry) return res.status(404).json({ success: false, message: 'Channel not connected.' });

    const tokens = { access_token: decrypt(tokenEntry.accessToken), refresh_token: decrypt(tokenEntry.refreshToken) };
    const videos = await ytService.getChannelVideos(tokens, req.params.channelId, 50);
    res.json({ success: true, videos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/youtube/analytics/:channelId
router.get('/analytics/:channelId', protect, async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    const { startDate, endDate } = formatDateRange(range);

    const user = await User.findById(req.user._id);
    const tokenEntry = user.youtubeTokens?.find(t => t.channelId === req.params.channelId);
    if (!tokenEntry) return res.status(404).json({ success: false, message: 'Channel not connected.' });

    const tokens = { access_token: decrypt(tokenEntry.accessToken), refresh_token: decrypt(tokenEntry.refreshToken) };
    const analytics = await ytService.getChannelAnalytics(tokens, req.params.channelId, startDate, endDate);
    const categories = await ytService.getVideoCategories(tokens);
    res.json({ success: true, analytics, categories, startDate, endDate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/youtube/categories
router.get('/categories', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.youtubeTokens?.length) return res.json({ success: true, categories: [] });
    const tokens = { access_token: decrypt(user.youtubeTokens[0].accessToken) };
    const categories = await ytService.getVideoCategories(tokens);
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
