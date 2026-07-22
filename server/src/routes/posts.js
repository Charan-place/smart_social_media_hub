const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimit');

// GET /api/posts — list posts with filters
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, contentType, platform, channelId } = req.query;
    const query = { owner: req.user._id };

    if (status) query.status = status;
    if (contentType) query.contentType = contentType;
    if (platform) query['platforms.platform'] = platform;
    if (channelId) query['platforms.channelId'] = channelId;

    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .populate('platforms.channelId', 'name avatar platform')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      posts,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/posts/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, owner: req.user._id })
      .populate('platforms.channelId', 'name avatar platform platformId');
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/posts — create draft
router.post('/', protect, async (req, res) => {
  try {
    const postData = { ...req.body, owner: req.user._id, status: 'draft' };
    const post = await Post.create(postData);
    res.status(201).json({ success: true, message: 'Draft created.', post });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/posts/:id — update post
router.put('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    res.json({ success: true, post });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/posts/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    res.json({ success: true, message: 'Post deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/posts/stats/summary — aggregate analytics across all posts
router.get('/stats/summary', protect, async (req, res) => {
  try {
    const result = await Post.aggregate([
      { $match: { owner: req.user._id, status: { $in: ['published', 'partially_published'] } } },
      {
        $group: {
          _id: null,
          totalPosts: { $sum: 1 },
          totalViews: { $sum: '$analytics.totalViews' },
          totalLikes: { $sum: '$analytics.totalLikes' },
          totalComments: { $sum: '$analytics.totalComments' },
          totalShares: { $sum: '$analytics.totalShares' },
        },
      },
    ]);

    const byType = await Post.aggregate([
      { $match: { owner: req.user._id } },
      { $group: { _id: '$contentType', count: { $sum: 1 }, totalViews: { $sum: '$analytics.totalViews' } } },
    ]);

    res.json({ success: true, summary: result[0] || {}, byType });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
