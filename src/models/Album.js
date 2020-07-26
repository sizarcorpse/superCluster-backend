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

    albumName: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 100,
      minlength: 3,
    },

    albumDetails: { type: String },

    sector: {
      type: String,
      enum: ["wallpaper", "thots", "3dx"],
      required: true,
    },

    status: {
      type: String,
      default: "public",
      enum: ["public", "private", "followers", "draft"],
    },

    albumTotalPhotos: { type: Number, default: 0, min: 0 },

    albumCoverPhoto: String,

    numAlbumViewCount: { type: Number, default: 0 },
    numLoveCount: { type: Number, default: 0 },
    numFavoriteCount: { type: Number, default: 0 },
    numLikeCount: { type: Number, default: 0 },
    numCommentCount: { type: Number, default: 0 },
    numAddedCollecion: { type: Number, default: 0 },

    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }], // this is not used yet. if i want yo populate comment via album then i need this

    albumCategories: [albumCategories],
    albumTags: [albumTags],

    artistName: {
      type: String,
      trim: true,
      maxlength: 50,
      minlength: 3,
    },
    coArtistNames: [coArtistNames],

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

/*











      const userx = await User.find({
        followers: { $elemMatch: { $eq: req.user._id } },
      }).populate("createdAlbums");

      const lc = [];
      userx.map((ux) => {
        lc.push(ux.createdAlbums);
      });
      res.send(lc);





      // router.get(
//   "/:sector",
//   isAuthenticatedUser,
//   Pagination,
//   async (req, res, next) => {
//     var status;
//     const sector = req.params.sector;
//     if (
//       req.query.status ? (status = req.query.status) : (status = "followers")
//     );
//     try {
//       const albums = await Album.find({
//         sector: sector,
//         status: status,
//       })
//         .select("albumName sector status uploader")
//         .skip((req.query.page - 1) * req.query.items)
//         .limit(req.query.items)
//         .sort({ albumCreatedAt: "desc" })
//         .exec();

//       res.status(200).json(albums);
//     } catch (error) {
//       res.status(404);
//       next(error);
//     }
//   }
// );


*/
