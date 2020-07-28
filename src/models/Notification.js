/*
notifiation::
  _id:
  sender: who tigger the notification
  receiver: who will receive this notification
  cause:["love","like","favorite","comment"]
  occursWith: ["album","comment","reply","profile"]
  time:
  message:`"sender" "love" your "album" "albumName"`
  seen: false
  
*/

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    seen: {
      type: Boolean,
      default: false,
    },
    trigger: {
      type: String,
      enum: ["loved", "liked", "favorited", "comment", "replies", "following"],
    },
    commentNotification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    albumNotification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Album",
      default: null,
    },
    notification: {
      type: String,
      require: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
