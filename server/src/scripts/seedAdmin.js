require('dotenv').config({ path: require('path').join(__dirname, '../../..', '.env') });
const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Inline Admin model to avoid circular deps
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

// Generate a very strong password
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

  // Fisher-Yates shuffle
  const arr = password.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
};

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'youtube_dashboard' });
    console.log('✅ Connected to MongoDB');

    const existingCount = await Admin.countDocuments();
    if (existingCount > 0) {
      console.log('⚠️  Admin accounts already exist. To reset, drop the admins collection first.');
      console.log(`   Current admin count: ${existingCount}`);
      await mongoose.disconnect();
      return;
    }

    // Admin 1 — Super Admin (you)
    const pw1 = generateStrongPassword();
    const salt1 = await bcrypt.genSalt(14);
    const hashed1 = await bcrypt.hash(pw1, salt1);

    // Admin 2 — Admin (your friend)
    const pw2 = generateStrongPassword();
    const salt2 = await bcrypt.genSalt(14);
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
    console.log('🔐 ADMIN CREDENTIALS GENERATED — SAVE THESE NOW');
    console.log('='.repeat(60));
    console.log('\n👑 SUPER ADMIN (You):');
    console.log('   Email    : superadmin@yourdashboard.io');
    console.log(`   Password : ${pw1}`);
    console.log('\n👤 ADMIN (Your Friend):');
    console.log('   Email    : admin@yourdashboard.io');
    console.log(`   Password : ${pw2}`);
    console.log('\n⚠️  THESE WILL NOT BE SHOWN AGAIN. Copy them to your password manager NOW.');
    console.log('='.repeat(60) + '\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
