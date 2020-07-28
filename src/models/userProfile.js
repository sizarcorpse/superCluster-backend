const mongoose = require("mongoose");
const userProfileSchema = new mongoose.Schema({
  parentUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    immutable: true,
  },
  name: {
    type: String,
    default: "your name",
  },
  bio: { type: String, default: "your bio" },
  website: { type: String, default: "www.youresite.com" },
});

module.exports = mongoose.model("UserProfile", userProfileSchema);
