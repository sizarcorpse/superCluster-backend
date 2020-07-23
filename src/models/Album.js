const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const albumCategories = new Schema({
  categoryName: { type: String, trim: true, maxlength: 30, minlength: 1 },
});

const albumTags = new Schema({
  tagName: { type: String, trim: true, maxlength: 30, minlength: 1 },
});

const coArtistNames = new Schema({
  coArtistName: { type: String, trim: true, maxlength: 30, minlength: 1 },
});
const coModelNames = new Schema({
  coModelName: { type: String, trim: true, maxlength: 30, minlength: 1 },
});

const albumSchema = new Schema(
  {
    uploader: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    //quick
    albumName: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 50,
      minlength: 3,
    },
    albumDetails: { type: String },
    sector: {
      type: String,
      enum: ["wallpaper", "thots", "3dx"],
      required: true,
    },

    //status
    status: {
      type: String,
      default: "public",
      enum: ["public", "private", "followers"],
    },

    //auto
    albumTotalPhotos: { type: Number, default: 0, min: 0 },
    albumCoverPhoto: String,

    //interact
    isLoveCount: { type: Number, default: 0 },

    //comments

    commentCount: { type: Number, default: 0 },
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }], // this is not used yet. if i want yo populate comment via album then i need this

    //postadd
    albumCategories: [albumCategories],
    albumTags: [albumTags],

    //artist
    artistName: {
      type: String,
      trim: true,
      maxlength: 50,
      minlength: 3,
    },
    coArtistNames: [coArtistNames],

    //model
    modelName: {
      type: String,
      trim: true,
      maxlength: 50,
      minlength: 3,
    },
    coModelNames: [coModelNames],
  },
  { timestamps: true }
);

Album = module.exports = mongoose.model("Album", albumSchema);
