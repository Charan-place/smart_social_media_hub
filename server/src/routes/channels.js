const express = require('express');
const router = express.Router();
const Channel = require('../models/Channel');
const { protect } = require('../middleware/auth');

// GET /api/channels — list all connected channels for user
router.get('/', protect, async (req, res) => {
  try {
    const channels = await Channel.find({ owner: req.user._id, isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, channels });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/channels/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const channel = await Channel.findOne({ _id: req.params.id, owner: req.user._id });
    if (!channel) return res.status(404).json({ success: false, message: 'Channel not found.' });
    res.json({ success: true, channel });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/channels/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const channel = await Channel.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!channel) return res.status(404).json({ success: false, message: 'Channel not found.' });
    res.json({ success: true, message: 'Channel disconnected.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/channels/summary/all — aggregate stats across all channels
router.get('/summary/all', protect, async (req, res) => {
  try {
    const channels = await Channel.find({ owner: req.user._id, isActive: true });
    const summary = {
      totalChannels: channels.length,
      youtube: { count: 0, totalSubscribers: 0, totalViews: 0 },
      instagram: { count: 0, totalFollowers: 0 },
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
    };

    channels.forEach(ch => {
      if (ch.platform === 'youtube') {
        summary.youtube.count++;
        summary.youtube.totalSubscribers += ch.youtubeData?.subscriberCount || 0;
        summary.youtube.totalViews += ch.youtubeData?.viewCount || 0;
      } else if (ch.platform === 'instagram') {
        summary.instagram.count++;
        summary.instagram.totalFollowers += ch.instagramData?.followersCount || 0;
      }
      summary.totalViews += ch.analyticsCache?.totalViews || 0;
      summary.totalLikes += ch.analyticsCache?.totalLikes || 0;
      summary.totalComments += ch.analyticsCache?.totalComments || 0;
      summary.totalShares += ch.analyticsCache?.totalShares || 0;
    });

    res.json({ success: true, summary, channels });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
