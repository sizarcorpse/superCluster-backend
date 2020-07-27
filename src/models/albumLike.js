const mongoose = require("mongoose");
const albumLikeSchema = new mongoose.Schema(
  {
    album: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Album",
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AlbumLike", albumLikeSchema);
