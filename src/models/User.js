const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  // credentials
  username: {
    type: String,
    require: true,
    min: 4,
    max: 255,
    unique: true,
    lowercase: true,
  },
  profilePhoto: {
    type: String,
    default: "No Photos",
  },
  email: {
    type: String,
    require: true,
    require: true,
    min: 10,
    max: 20,
    lowercase: true,
    select: false,
  },
  password: {
    type: String,
    require: true,
    max: 2000,
    min: 8,
    select: false,
  },
  role: {
    type: String,
    enum: ["admin", "stuff", "rookie"],
    default: "rookie",
    // immutable: true,
  },

  // token
  refreshToken: {
    type: String,
    select: false,
  },

  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserProfile",
    immutable: true,
  },
  stats: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserStats",
    immutable: true,
  },

  // assets
  createdAlbums: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Album",
    },
  ],

  // followers and following
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
