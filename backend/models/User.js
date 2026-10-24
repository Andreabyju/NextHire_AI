const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // ==========================================
    // USER NAME
    // ==========================================

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    // ==========================================
    // EMAIL
    // ==========================================

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    // ==========================================
    // PASSWORD
    // ==========================================

    password: {
      type: String,
      required: function () {
        return !this.authProvider || this.authProvider === "local";
      },
      minlength: 6,
      select: false,
    },

    // ==========================================
    // PASSWORD RESET TOKEN
    // ==========================================

    resetPasswordToken: {
      type: String,
      default: null,
      select: false,
    },

    // ==========================================
    // PASSWORD RESET EXPIRY
    // ==========================================

    resetPasswordExpire: {
      type: Date,
      default: null,
      select: false,
    },

    // ==========================================
    // USER ROLE
    // ==========================================
    //
    // user   = normal candidate
    // admin  = platform administrator
    // mentor = company / mentor account
    //
    // IMPORTANT:
    // Normal registration still creates only
    // role = "user".
    //
    // Mentor registration creates role = "mentor".
    //
    // ==========================================

    role: {
      type: String,
      enum: ["user", "admin", "mentor"],
      default: "user",
    },

    // ==========================================
    // ACCOUNT STATUS
    // ==========================================

    accountStatus: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },

    // ==========================================
    // LAST LOGIN
    // ==========================================

    lastLogin: {
      type: Date,
      default: null,
    },

    // ==========================================
    // AUTH PROVIDER & OAUTH IDENTIFIERS
    // ==========================================

    authProvider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local",
    },

    googleId: {
      type: String,
      default: null,
    },

    githubId: {
      type: String,
      default: null,
    },

    avatar: {
      type: String,
      default: null,
    },
  },

  {
    timestamps: true,
  }
);

// ==========================================
// HASH PASSWORD BEFORE SAVING
// ==========================================

userSchema.pre("save", async function () {
  if (!this.password || !this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);

  this.password = await bcrypt.hash(
    this.password,
    salt
  );
});

// ==========================================
// COMPARE PASSWORD
// ==========================================

userSchema.methods.matchPassword = async function (
  enteredPassword
) {
  return await bcrypt.compare(
    enteredPassword,
    this.password
  );
};

// ==========================================
// EXPORT MODEL
// ==========================================

module.exports = mongoose.model(
  "User",
  userSchema
);