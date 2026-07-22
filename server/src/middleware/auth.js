const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

// Protect regular user routes
const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized. Please log in.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// Protect admin routes
const protectAdmin = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.adminToken) {
      token = req.cookies.adminToken;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Admin access required.' });
    }

    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin || !admin.isActive || admin.isLocked) {
      return res.status(401).json({ success: false, message: 'Admin not found, deactivated, or locked.' });
    }

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired admin token.' });
  }
};

// Optional: also allow admin to access user routes
const protectOrAdmin = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ success: false, message: 'Not authorized.' });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user) { req.user = user; return next(); }
    } catch (_) {}

    try {
      const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
      const admin = await Admin.findById(decoded.id);
      if (admin) { req.admin = admin; req.user = { ...admin.toObject(), role: 'admin' }; return next(); }
    } catch (_) {}

    return res.status(401).json({ success: false, message: 'Invalid token.' });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Authorization failed.' });
  }
};

const generateToken = (id, secret, expiresIn = '7d') => {
  return jwt.sign({ id }, secret, { expiresIn });
};

module.exports = { protect, protectAdmin, protectOrAdmin, generateToken };
