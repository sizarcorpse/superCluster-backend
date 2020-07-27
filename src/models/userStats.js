const mongoose = require("mongoose");

const number = {
  type: Number,
  default: 0,
};

const userStatsSchema = new mongoose.Schema({
  parentUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    immutable: true,
  },

  numGetProfileViews: number, // collect total total profile get views

  numCreatedAlbum: number, // collect total album user created
  numAlbumViews: number, // collect total album gte views from all created album

  numAlbumLove: number, // collect total album user loved
  numAlbumFavorite: number, // collect total album user favorite

  numFollowing: number, // collcet total follwoing user follows
  numFollowers: number, // collect total follower who follows user

  numGetLove: number, // collect total love get from all created album + collcetion
  numGetFavorite: number, // collect total favorite get from all created album + collection
  numGetLike: number, // collect total like get from all created album + collcetion + comment + reply
  numGetComment: number, // collect total comment + reply get from all created album

  numPostComment: number, //collect all comment posted

  //future feature
  // numCreatedCollection: number, // collect total collction user created
  // numAlbumCollectd: number, //collcet total albu those added in  other user collceiton
});

module.exports = mongoose.model("UserStats", userStatsSchema);
