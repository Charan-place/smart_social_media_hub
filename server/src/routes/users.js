const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sanitizeUser } = require('../utils/helpers');

// GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/users/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, avatar, preferences } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (avatar) updates.avatar = avatar;
    if (preferences) updates.preferences = { ...req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated.', user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users/connected-accounts
router.get('/connected-accounts', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('youtubeTokens instagramTokens');
    res.json({
      success: true,
      youtube: (user.youtubeTokens || []).map(t => ({
        channelId: t.channelId,
        channelName: t.channelName,
        channelAvatar: t.channelAvatar,
        connectedAt: t.connectedAt,
      })),
      instagram: (user.instagramTokens || []).map(t => ({
        accountId: t.accountId,
        username: t.username,
        accountAvatar: t.accountAvatar,
        connectedAt: t.connectedAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/users/disconnect/youtube/:channelId
router.delete('/disconnect/youtube/:channelId', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { youtubeTokens: { channelId: req.params.channelId } },
    });
    res.json({ success: true, message: 'YouTube channel disconnected.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/users/disconnect/instagram/:accountId
router.delete('/disconnect/instagram/:accountId', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { instagramTokens: { accountId: req.params.accountId } },
    });
    res.json({ success: true, message: 'Instagram account disconnected.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
