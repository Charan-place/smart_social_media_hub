const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Channel = require('../models/Channel');
const Post = require('../models/Post');
const Analytics = require('../models/Analytics');
const { protectAdmin, generateToken } = require('../middleware/auth');
const { adminLimiter } = require('../middleware/rateLimit');

// POST /api/admin/login
router.post('/login', adminLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required.' });

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
    if (!admin) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    if (!admin.isActive) return res.status(403).json({ success: false, message: 'Admin account deactivated.' });
    if (admin.isLocked) return res.status(403).json({ success: false, message: 'Account temporarily locked. Try later.' });

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      admin.loginAttempts = (admin.loginAttempts || 0) + 1;
      if (admin.loginAttempts >= 5) {
        admin.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // lock 30 min
        admin.loginAttempts = 0;
      }
      await admin.save();
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    admin.loginAttempts = 0;
    admin.lockUntil = undefined;
    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken(admin._id, process.env.ADMIN_JWT_SECRET, process.env.ADMIN_JWT_EXPIRES_IN || '8h');
    const adminObj = admin.toObject();
    delete adminObj.password;
    res.json({ success: true, token, admin: adminObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/me
router.get('/me', protectAdmin, (req, res) => {
  res.json({ success: true, admin: req.admin });
});

// GET /api/admin/stats
router.get('/stats', protectAdmin, async (req, res) => {
  try {
    const [totalUsers, totalChannels, totalPosts, totalAnalytics, activeUsers] = await Promise.all([
      User.countDocuments(),
      Channel.countDocuments({ isActive: true }),
      Post.countDocuments(),
      Analytics.countDocuments(),
      User.countDocuments({ isActive: true }),
    ]);

    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('name email createdAt lastLogin');
    const postsByType = await Post.aggregate([
      { $group: { _id: '$contentType', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      stats: { totalUsers, totalChannels, totalPosts, totalAnalytics, activeUsers },
      recentUsers,
      postsByType,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/users
router.get('/users', protectAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = search ? { $or: [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] } : {};
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('name email role isActive isVerified createdAt lastLogin loginCount preferences avatar');

    res.json({ success: true, users, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/admin/users/:id/toggle-active
router.patch('/users/:id/toggle-active', protectAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}.`, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/channels
router.get('/channels', protectAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, platform } = req.query;
    const query = platform ? { platform, isActive: true } : { isActive: true };
    const total = await Channel.countDocuments(query);
    const channels = await Channel.find(query)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, channels, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/posts
router.get('/posts', protectAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = status ? { status } : {};
    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, posts, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', protectAdmin, async (req, res) => {
  try {
    if (req.admin.role !== 'super_admin')
      return res.status(403).json({ success: false, message: 'Super admin access required.' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
