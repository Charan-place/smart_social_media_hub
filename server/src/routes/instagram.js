const express = require('express');
const router = express.Router();
const igService = require('../services/instagramService');
const { cloudinary } = require('../config/cloudinary');
const User = require('../models/User');
const Channel = require('../models/Channel');
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimit');
const { formatDateRange } = require('../utils/helpers');
const { encrypt, decrypt } = require('../utils/crypto');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });

// GET /api/instagram/auth
router.get('/auth', protect, (req, res) => {
  const url = igService.getAuthUrl(req.user._id.toString());
  res.json({ success: true, url });
});

// GET /api/instagram/callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query;
    if (!code) return res.redirect(`${process.env.CLIENT_URL}/settings?error=no_code`);

    const shortToken = await igService.exchangeCode(code);
    const longToken = await igService.getLongLivedToken(shortToken.access_token);
    const accounts = await igService.getInstagramAccounts(longToken.access_token);

    if (!accounts || accounts.length === 0)
      return res.redirect(`${process.env.CLIENT_URL}/settings?error=no_ig_account`);

    for (const acc of accounts) {
      const tokenData = {
        accountId: acc.id,
        username: acc.username,
        accountAvatar: acc.profile_picture_url || '',
        accessToken: encrypt(longToken.access_token),
        tokenExpiry: new Date(Date.now() + (longToken.expires_in || 5184000) * 1000),
        connectedAt: new Date(),
      };

      await User.findByIdAndUpdate(userId, { $pull: { instagramTokens: { accountId: acc.id } } });
      await User.findByIdAndUpdate(userId, { $push: { instagramTokens: tokenData } });

      await Channel.findOneAndUpdate(
        { platformId: acc.id, platform: 'instagram' },
        {
          owner: userId,
          platform: 'instagram',
          platformId: acc.id,
          name: acc.name || acc.username,
          handle: acc.username,
          avatar: acc.profile_picture_url || '',
          url: `https://instagram.com/${acc.username}`,
          instagramData: {
            followersCount: acc.followers_count || 0,
            followingCount: acc.follows_count || 0,
            mediaCount: acc.media_count || 0,
            accountType: acc.account_type || 'BUSINESS',
          },
          lastSynced: new Date(),
        },
        { upsert: true, new: true }
      );
    }

    res.redirect(`${process.env.CLIENT_URL}/settings?success=instagram_connected`);
  } catch (err) {
    console.error('Instagram callback error:', err);
    res.redirect(`${process.env.CLIENT_URL}/settings?error=instagram_failed`);
  }
});

// POST /api/instagram/publish
router.post('/publish', protect, uploadLimiter, upload.fields([
  { name: 'media', maxCount: 10 },
]), async (req, res) => {
  try {
    const { accountIds, caption, hashtags, contentType, settings, postId } = req.body;
    const parsedAccountIds = JSON.parse(accountIds || '[]');
    const parsedSettings = JSON.parse(settings || '{}');
    const parsedHashtags = JSON.parse(hashtags || '[]');
    const mediaFiles = req.files?.media || [];

    if (!mediaFiles.length) return res.status(400).json({ success: false, message: 'Media file is required.' });

    const user = await User.findById(req.user._id);
    const fullCaption = parsedHashtags.length
      ? `${caption || ''}\n\n${parsedHashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ')}`
      : (caption || '');

    const results = [];

    for (const accountId of parsedAccountIds) {
      const tokenEntry = user.instagramTokens?.find(t => t.accountId === accountId);
      if (!tokenEntry) { results.push({ accountId, status: 'failed', error: 'Account not connected.' }); continue; }

      try {
        const accessToken = decrypt(tokenEntry.accessToken);
        let mediaId;

        // Upload to Cloudinary first to get a public URL
        const uploadPromises = mediaFiles.map(file => new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: 'youtube-dashboard/instagram', resource_type: 'auto' },
            (err, result) => err ? reject(err) : resolve(result)
          ).end(file.buffer);
        }));
        const uploadedMedia = await Promise.all(uploadPromises);

        if (contentType === 'instagram_reel' || (mediaFiles[0].mimetype.startsWith('video/'))) {
          const containerId = await igService.createVideoContainer(
            accountId, accessToken, uploadedMedia[0].secure_url, fullCaption, parsedSettings
          );
          await igService.waitForContainer(containerId, accessToken);
          mediaId = await igService.publishContainer(accountId, accessToken, containerId);
        } else if (uploadedMedia.length > 1) {
          const containerId = await igService.createCarouselContainer(
            accountId, accessToken, uploadedMedia.map(m => m.secure_url), fullCaption
          );
          mediaId = await igService.publishContainer(accountId, accessToken, containerId);
        } else {
          const containerId = await igService.createImageContainer(
            accountId, accessToken, uploadedMedia[0].secure_url, fullCaption
          );
          mediaId = await igService.publishContainer(accountId, accessToken, containerId);
        }

        const mediaInfo = await igService.getMediaUrl(mediaId, accessToken);
        results.push({ accountId, status: 'published', mediaId, url: mediaInfo.permalink });

        if (postId) {
          await Post.findByIdAndUpdate(postId, {
            $set: {
              'platforms.$[elem].status': 'published',
              'platforms.$[elem].platformPostId': mediaId,
              'platforms.$[elem].url': mediaInfo.permalink,
              'platforms.$[elem].publishedAt': new Date(),
            },
          }, { arrayFilters: [{ 'elem.platformChannelId': accountId }] });
        }
      } catch (e) {
        results.push({ accountId, status: 'failed', error: e.message });
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

// GET /api/instagram/media/:accountId
router.get('/media/:accountId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const tokenEntry = user.instagramTokens?.find(t => t.accountId === req.params.accountId);
    if (!tokenEntry) return res.status(404).json({ success: false, message: 'Account not connected.' });

    const media = await igService.getAccountMedia(req.params.accountId, decrypt(tokenEntry.accessToken));
    res.json({ success: true, media });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/instagram/analytics/:accountId
router.get('/analytics/:accountId', protect, async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    const { startDate, endDate } = formatDateRange(range);
    const user = await User.findById(req.user._id);
    const tokenEntry = user.instagramTokens?.find(t => t.accountId === req.params.accountId);
    if (!tokenEntry) return res.status(404).json({ success: false, message: 'Account not connected.' });

    const since = Math.floor(new Date(startDate).getTime() / 1000);
    const until = Math.floor(new Date(endDate).getTime() / 1000);
    const insights = await igService.getAccountInsights(req.params.accountId, decrypt(tokenEntry.accessToken), since, until);
    res.json({ success: true, insights, startDate, endDate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
