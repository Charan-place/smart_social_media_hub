const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');
const analyticsService = require('../services/analyticsService');
const { protect } = require('../middleware/auth');
const { formatDateRange } = require('../utils/helpers');

// GET /api/analytics/overview
router.get('/overview', protect, async (req, res) => {
  try {
    const { range = '30d', platform } = req.query;
    const { startDate, endDate } = formatDateRange(range);
    const data = await analyticsService.getUserAnalytics(req.user._id, startDate, endDate, platform);
    res.json({ success: true, ...data, startDate, endDate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/analytics/channel/:channelId
router.get('/channel/:channelId', protect, async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    const { startDate, endDate } = formatDateRange(range);
    const data = await analyticsService.getChannelAnalyticsFromDB(req.params.channelId, startDate, endDate);
    res.json({ success: true, data, startDate, endDate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/analytics/post/:postId
router.get('/post/:postId', protect, async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    const { startDate, endDate } = formatDateRange(range);
    const data = await analyticsService.getPostAnalyticsFromDB(req.params.postId, startDate, endDate);
    res.json({ success: true, data, startDate, endDate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/analytics/top-posts
router.get('/top-posts', protect, async (req, res) => {
  try {
    const { metric = 'views', limit = 10 } = req.query;
    const posts = await analyticsService.getTopPosts(req.user._id, Number(limit), metric);
    res.json({ success: true, posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/analytics/compare — compare two date ranges
router.get('/compare', protect, async (req, res) => {
  try {
    const { range1 = '30d', range2 = '60d' } = req.query;
    const period1 = formatDateRange(range1);
    const period2 = formatDateRange(range2);

    const [data1, data2] = await Promise.all([
      analyticsService.getUserAnalytics(req.user._id, period1.startDate, period1.endDate),
      analyticsService.getUserAnalytics(req.user._id, period2.startDate, period2.endDate),
    ]);

    res.json({ success: true, current: data1, previous: data2 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
