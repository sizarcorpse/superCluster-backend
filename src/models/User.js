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

  // token
  refreshToken: {
    type: String,
    select: false,
  },

  //role
  role: {
    type: String,
    default: "rookie",
    enum: ["admin", "stuff", "rookie"],
  },

  //profile
  name: {
    type: String,
  },
  Bio: { type: String },
  website: { type: String },

  //profile stat
  createdAlbumsCount: {
    type: Number,
    default: 0,
  },
  lovedAlbumCount: {
    type: Number,
    default: 0,
  },
  followingCount: {
    type: Number,
    default: 0,
  },
  followersCount: {
    type: Number,
    default: 0,
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
