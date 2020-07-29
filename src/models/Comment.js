const mongoose = require("mongoose");
const commentSchema = new mongoose.Schema(
  {
    album: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Album",
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    commentStatus: {
      type: String,
      default: "original",
      enum: ["original", "edited"],
    },

    commentBody: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 500,
      trim: true,
    },

    commentLikeCount: { type: Number, default: 0 },
    commentLike: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    commentReplyCount: { type: Number, default: 0 },
    reply: [{ type: mongoose.Schema.Types.ObjectId, ref: "Reply" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);
