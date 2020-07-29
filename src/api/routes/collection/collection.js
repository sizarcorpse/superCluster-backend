const mongoose = require("mongoose");

const collectionStatsSchema = new mongoose.Schema(
  {
    parentUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      immutable: true,
    },

    albums: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Album",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserStats", collectionStatsSchema);
