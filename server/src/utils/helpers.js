const crypto = require('crypto');

const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

const generateStrongPassword = () => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const all = upper + lower + digits + symbols;

  let password = '';
  // Ensure at least 2 of each type
  for (let i = 0; i < 3; i++) password += upper[crypto.randomInt(upper.length)];
  for (let i = 0; i < 3; i++) password += lower[crypto.randomInt(lower.length)];
  for (let i = 0; i < 3; i++) password += digits[crypto.randomInt(digits.length)];
  for (let i = 0; i < 3; i++) password += symbols[crypto.randomInt(symbols.length)];
  // Fill to 32 chars
  for (let i = 12; i < 32; i++) password += all[crypto.randomInt(all.length)];

  // Shuffle
  return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
};

const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.youtubeTokens;
  delete obj.instagramTokens;
  delete obj.__v;
  return obj;
};

const paginate = (query, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
};

const formatDateRange = (range) => {
  const now = new Date();
  let startDate, endDate;
  endDate = now.toISOString().split('T')[0];

  switch (range) {
    case '7d':
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      break;
    case '28d':
      startDate = new Date(now - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      break;
    case '90d':
      startDate = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      break;
    case '365d':
      startDate = new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      break;
    default:
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }
  return { startDate, endDate };
};

module.exports = { generateSecureToken, generateStrongPassword, sanitizeUser, paginate, formatDateRange };
