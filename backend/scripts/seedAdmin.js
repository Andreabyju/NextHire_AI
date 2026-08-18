const User = require("../models/User");

/**
 * seedAdmin
 *
 * Creates the initial admin account from environment variables.
 * Safe to call on every server startup — never creates duplicates.
 *
 * Required env vars:
 *   ADMIN_EMAIL    — the admin's login email
 *   ADMIN_PASSWORD — the admin's login password (will be bcrypt-hashed)
 *
 * The plain-text password is NEVER stored — only the bcrypt hash.
 * The password is NEVER returned via any API.
 */
const seedAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn(
      "⚠️  ADMIN_EMAIL or ADMIN_PASSWORD not set in .env — skipping admin seed."
    );
    return;
  }

  try {
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      // Admin already exists — do nothing (idempotent)
      console.log(`✅ Admin account already exists: ${adminEmail}`);
      return;
    }

    // Create admin — the User model's pre-save hook hashes the password automatically
    await User.create({
      name: "Admin",
      email: adminEmail,
      password: adminPassword, // hashed by pre-save hook
      role: "admin",
      accountStatus: "active",
    });

    console.log(`✅ Admin account created: ${adminEmail}`);
  } catch (error) {
    console.error("❌ Admin seed error:", error.message);
    // Do not crash the server if seeding fails
  }
};

module.exports = seedAdmin;
