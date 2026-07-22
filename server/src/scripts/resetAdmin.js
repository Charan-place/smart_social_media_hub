/**
 * resetAdmin.js — drops ALL admin accounts and re-seeds with fresh passwords.
 * Run ONLY if you've lost credentials. Outputs new credentials to the terminal.
 *
 * Usage: cd server && node src/scripts/resetAdmin.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../..', '.env') });
const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'admin'], default: 'super_admin' },
  permissions: {
    manageUsers: { type: Boolean, default: true },
    manageChannels: { type: Boolean, default: true },
    viewAnalytics: { type: Boolean, default: true },
    manageAdmins: { type: Boolean, default: true },
    systemSettings: { type: Boolean, default: true },
  },
  isActive: { type: Boolean, default: true },
  loginAttempts: { type: Number, default: 0 },
}, { timestamps: true });

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

const generateStrongPassword = () => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*()-_=+[]{}|;:,.<>?';
  const all = upper + lower + digits + symbols;

  let password = '';
  for (let i = 0; i < 4; i++) password += upper[crypto.randomInt(upper.length)];
  for (let i = 0; i < 4; i++) password += lower[crypto.randomInt(lower.length)];
  for (let i = 0; i < 4; i++) password += digits[crypto.randomInt(digits.length)];
  for (let i = 0; i < 4; i++) password += symbols[crypto.randomInt(symbols.length)];
  for (let i = 16; i < 36; i++) password += all[crypto.randomInt(all.length)];

  const arr = password.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
};

const reset = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'youtube_dashboard' });
    console.log('✅ Connected to MongoDB');

    // Drop all existing admin docs
    const deleted = await Admin.deleteMany({});
    console.log(`🗑  Deleted ${deleted.deletedCount} existing admin account(s)`);

    const pw1 = generateStrongPassword();
    const pw2 = generateStrongPassword();
    const salt1 = await bcrypt.genSalt(14);
    const salt2 = await bcrypt.genSalt(14);
    const hashed1 = await bcrypt.hash(pw1, salt1);
    const hashed2 = await bcrypt.hash(pw2, salt2);

    await Admin.create([
      {
        name: 'Super Admin',
        email: 'superadmin@yourdashboard.io',
        password: hashed1,
        role: 'super_admin',
        permissions: { manageUsers: true, manageChannels: true, viewAnalytics: true, manageAdmins: true, systemSettings: true },
      },
      {
        name: 'Admin',
        email: 'admin@yourdashboard.io',
        password: hashed2,
        role: 'admin',
        permissions: { manageUsers: true, manageChannels: true, viewAnalytics: true, manageAdmins: false, systemSettings: false },
      },
    ]);

    console.log('\n' + '='.repeat(60));
    console.log('🔐 NEW ADMIN CREDENTIALS — SAVE BOTH NOW');
    console.log('='.repeat(60));
    console.log('\n👑 SUPER ADMIN (You):');
    console.log('   Email    : superadmin@yourdashboard.io');
    console.log(`   Password : ${pw1}`);
    console.log('\n👤 ADMIN (Your Friend):');
    console.log('   Email    : admin@yourdashboard.io');
    console.log(`   Password : ${pw2}`);
    console.log('\n⚠️  THESE WILL NOT BE SHOWN AGAIN. Copy both to your password manager NOW.');
    console.log('='.repeat(60) + '\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Reset failed:', err.message);
    process.exit(1);
  }
};

reset();
