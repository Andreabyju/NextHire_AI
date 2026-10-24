const User = require("../models/User");
const Activity = require("../models/Activity");
const jwt = require("jsonwebtoken");

// ==========================================
// GENERATE JWT
// ==========================================
const generateToken = (userId) =>
  jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

// ==========================================
// ACTIVITY LOGGER
// ==========================================
const logActivity = async (
  userId,
  activityType,
  description,
  metadata = {}
) => {
  try {
    await Activity.create({
      userId,
      activityType,
      description,
      metadata,
    });
  } catch (err) {
    console.error("Activity log error:", err.message);
  }
};

// ==========================================
// GOOGLE AUTH — REDIRECT TO GOOGLE
// GET /api/auth/google
// ==========================================
const googleAuth = (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const callbackUrl =
    process.env.GOOGLE_CALLBACK_URL ||
    "http://localhost:5000/api/auth/google/callback";

  if (!clientId) {
    return res
      .status(500)
      .send("Google OAuth is not configured. GOOGLE_CLIENT_ID is missing in .env.");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });

  res.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
};

// ==========================================
// GOOGLE CALLBACK
// GET /api/auth/google/callback
// ==========================================
const googleCallback = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(
      `${frontendUrl}/sign-in?error=${encodeURIComponent(
        error || "Google authentication was cancelled."
      )}`
    );
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackUrl =
      process.env.GOOGLE_CALLBACK_URL ||
      "http://localhost:5000/api/auth/google/callback";

    // 1. Exchange code for access & ID tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Google token exchange error:", tokenData);
      return res.redirect(
        `${frontendUrl}/sign-in?error=${encodeURIComponent(
          "Failed to exchange authorization code with Google."
        )}`
      );
    }

    // 2. Fetch user profile
    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );

    const profile = await userRes.json();
    if (!userRes.ok || !profile.email) {
      return res.redirect(
        `${frontendUrl}/sign-in?error=${encodeURIComponent(
          "Could not retrieve user email from Google."
        )}`
      );
    }

    const normalizedEmail = profile.email.toLowerCase().trim();

    // 3. Find existing user by googleId OR by email (account linking)
    let user = await User.findOne({
      $or: [{ googleId: profile.id }, { email: normalizedEmail }],
    });

    if (user) {
      if (user.accountStatus === "suspended") {
        return res.redirect(
          `${frontendUrl}/sign-in?error=${encodeURIComponent(
            "Your account has been suspended."
          )}`
        );
      }

      // Link Google ID and update avatar if not present
      if (!user.googleId) {
        user.googleId = profile.id;
      }
      if (!user.avatar && profile.picture) {
        user.avatar = profile.picture;
      }
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });
    } else {
      // Create new user with Google profile
      user = await User.create({
        name: profile.name || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        role: "user",
        authProvider: "google",
        googleId: profile.id,
        avatar: profile.picture || null,
        lastLogin: new Date(),
      });
    }

    // 4. Log login activity
    await logActivity(
      user._id,
      "USER_LOGIN",
      `${user.name} logged in with Google`,
      {
        email: user.email,
        role: user.role,
        provider: "google",
      }
    );

    // 5. Generate JWT and redirect back to frontend
    const token = generateToken(user._id);
    return res.redirect(`${frontendUrl}/oauth/callback?token=${token}`);
  } catch (err) {
    console.error("Google OAuth error:", err);
    return res.redirect(
      `${frontendUrl}/sign-in?error=${encodeURIComponent(
        "An unexpected error occurred during Google sign in."
      )}`
    );
  }
};

// ==========================================
// GITHUB AUTH — REDIRECT TO GITHUB
// GET /api/auth/github
// ==========================================
const githubAuth = (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const callbackUrl =
    process.env.GITHUB_CALLBACK_URL ||
    "http://localhost:5000/api/auth/github/callback";

  if (!clientId) {
    return res
      .status(500)
      .send("GitHub OAuth is not configured. GITHUB_CLIENT_ID is missing in .env.");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: "user:email",
  });

  res.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  );
};

// ==========================================
// GITHUB CALLBACK
// GET /api/auth/github/callback
// ==========================================
const githubCallback = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(
      `${frontendUrl}/sign-in?error=${encodeURIComponent(
        error || "GitHub authentication was cancelled."
      )}`
    );
  }

  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const callbackUrl =
      process.env.GITHUB_CALLBACK_URL ||
      "http://localhost:5000/api/auth/github/callback";

    // 1. Exchange code for access token
    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: callbackUrl,
        }),
      }
    );

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("GitHub token exchange error:", tokenData);
      return res.redirect(
        `${frontendUrl}/sign-in?error=${encodeURIComponent(
          "Failed to exchange authorization code with GitHub."
        )}`
      );
    }

    // 2. Fetch basic profile
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "NextHireAI-App",
      },
    });

    const profile = await userRes.json();
    if (!userRes.ok || !profile.id) {
      return res.redirect(
        `${frontendUrl}/sign-in?error=${encodeURIComponent(
          "Could not retrieve user info from GitHub."
        )}`
      );
    }

    // 3. Resolve user email (GitHub users might have their email set to private)
    let email = profile.email;
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "User-Agent": "NextHireAI-App",
        },
      });

      if (emailsRes.ok) {
        const emails = await emailsRes.json();
        const primary =
          emails.find((e) => e.primary && e.verified) ||
          emails.find((e) => e.verified) ||
          emails[0];
        if (primary) {
          email = primary.email;
        }
      }
    }

    if (!email) {
      email = `${profile.login}@users.noreply.github.com`;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const githubIdStr = profile.id.toString();

    // 4. Find or create user
    let user = await User.findOne({
      $or: [{ githubId: githubIdStr }, { email: normalizedEmail }],
    });

    if (user) {
      if (user.accountStatus === "suspended") {
        return res.redirect(
          `${frontendUrl}/sign-in?error=${encodeURIComponent(
            "Your account has been suspended."
          )}`
        );
      }

      if (!user.githubId) {
        user.githubId = githubIdStr;
      }
      if (!user.avatar && profile.avatar_url) {
        user.avatar = profile.avatar_url;
      }
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });
    } else {
      user = await User.create({
        name: profile.name || profile.login || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        role: "user",
        authProvider: "github",
        githubId: githubIdStr,
        avatar: profile.avatar_url || null,
        lastLogin: new Date(),
      });
    }

    // 5. Log activity
    await logActivity(
      user._id,
      "USER_LOGIN",
      `${user.name} logged in with GitHub`,
      {
        email: user.email,
        role: user.role,
        provider: "github",
      }
    );

    // 6. Generate JWT and redirect back to frontend
    const token = generateToken(user._id);
    return res.redirect(`${frontendUrl}/oauth/callback?token=${token}`);
  } catch (err) {
    console.error("GitHub OAuth error:", err);
    return res.redirect(
      `${frontendUrl}/sign-in?error=${encodeURIComponent(
        "An unexpected error occurred during GitHub sign in."
      )}`
    );
  }
};

module.exports = {
  googleAuth,
  googleCallback,
  githubAuth,
  githubCallback,
};
