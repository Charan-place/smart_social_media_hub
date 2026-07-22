const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Connected platform tokens (accessToken/refreshToken are AES-256-GCM encrypted at app layer)
  youtubeTokens: [{
    channelId: String,
    channelName: String,
    channelAvatar: String,
    accessToken: String,   // stored encrypted
    refreshToken: String,  // stored encrypted
    tokenExpiry: Date,
    connectedAt: { type: Date, default: Date.now },
  }],
  instagramTokens: [{
    accountId: String,
    username: String,
    accountAvatar: String,
    accessToken: String,   // stored encrypted
    tokenExpiry: Date,
    connectedAt: { type: Date, default: Date.now },
  }],
  preferences: {
    defaultPlatforms: {
      type: [String],
      enum: ['youtube', 'instagram'],
      default: ['youtube', 'instagram'],
    },
    timezone: { type: String, default: 'UTC' },
    emailNotifications: { type: Boolean, default: true },
  },
  lastLogin: Date,
  loginCount: { type: Number, default: 0 },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for connected channels count
userSchema.virtual('connectedChannelsCount').get(function () {
  return (this.youtubeTokens?.length || 0) + (this.instagramTokens?.length || 0);
});

module.exports = mongoose.model('User', userSchema);
