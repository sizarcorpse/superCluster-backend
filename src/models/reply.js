const mongoose = require("mongoose");
const replySchema = new mongoose.Schema(
  {
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    replyBody: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 500,
      trim: true,
    },
    replyStatus: {
      type: String,
      default: "original",
      enum: ["original", "edited"],
    },
    replyLikeCount: { type: Number, default: 0 },
    replyLike: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);
module.exports = mongoose.model("Reply", replySchema);
