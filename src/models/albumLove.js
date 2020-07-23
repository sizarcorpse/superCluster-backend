const mongoose = require("mongoose");
const albumLoveSchema = new mongoose.Schema({
  album: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Album",
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("AlbumLove", albumLoveSchema);
