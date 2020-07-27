// @init ::
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const ObjectId = require("mongodb").ObjectID;

// @model ::
const Album = require("../../../models/Album");
const User = require("../../../models/User");
const UserStats = require("../../../models/userStats");
const AlbumLove = require("../../../models/albumLove");
const AlbumFavorite = require("../../../models/albumFavorite");
const AlbumLike = require("../../../models/albumLike");
const Comment = require("../../../models/Comment");

const isAuthenticatedUser = require("../../../middlewares/isAuthenticatedUser");
const {
  CheckUserExists,
  CheckRole,
} = require("../../../middlewares/userMiddleware");
const { createAlbumValidate } = require("../../../middlewares/albumValidation");
const {
  CheckAlbumExists,
  Pagination,
  isAlbumUploader,
  TagArrange,
  TagExists,
  TagIdExists,
  CategoryExists,
  CatIdExists,
  CoArtistExists,
  CoAIdExists,
  CoModelExists,
  CoMIdExists,
} = require("../../../middlewares/albumMiddleware");
const userStats = require("../../../models/userStats");

// @route :: POST
// @description :: create new album
// @api :: Api

router.post("/a/new", isAuthenticatedUser, async (req, res, next) => {
  const { error } = createAlbumValidate(req.body);
  if (error) {
    res.status(422);
    next(error);
  } else {
    const albumCoverPhotoPath = null;

    const album = new Album({
      _id: new mongoose.Types.ObjectId(),
      uploader: req.user,
      albumName: req.body.albumName,
      albumDetails: req.body.albumDetails,
      sector: req.body.sector,
      albumCoverPhoto: albumCoverPhotoPath,
      artistName: req.body.artistName,
      modelName: req.body.modelName,
      status: req.body.status,
    });

    try {
      const newAlbum = await album.save();

      if (newAlbum) {
        const userAlbumsQuery = {
          _id: req.user._id,
        };
        const addAlbumToUser = {
          $addToSet: { createdAlbums: newAlbum._id },
        };
        const { n, nModified } = await User.updateOne(
          userAlbumsQuery,
          addAlbumToUser
        );
        if (n === 1 && nModified === 1) {
          await UserStats.updateOne(
            { parentUser: req.user._id },
            { $inc: { numCreatedAlbum: +1 } }
          );

          res.status(201).send({
            ...newAlbum._doc,
            createdAt: new Date(newAlbum._doc.createdAt).toDateString(),
          });
        } else {
          throw new Error();
        }
      } else {
        throw new Error();
      }
    } catch (error) {
      res.status(422);
      next(error);
    }
  }
});

// @route :: PATCH
// @description :: Update an Album
// @api :: Api

router.patch(
  "/a/d/:albumID/update",
  isAuthenticatedUser,
  CheckAlbumExists,
  async (req, res, next) => {
    const album = req.album;
    try {
      if (album.uploader._id == req.user._id) {
        await album.updateOne(req.body);
        res.status(200).json({ message: "Album successfully updated" });
      } else {
        throw new Error();
      }
    } catch (error) {
      res.status(401);
      next(error);
    }
  }
);

// @route :: GET
// @description :: Get all album with album details. exclude phtos
// @api :: Api

router.get(
  "/all",
  isAuthenticatedUser,
  CheckRole,
  Pagination,
  async (req, res, next) => {
    if (req.admin || req.stuff) {
      var status;
      if (req.query.status ? (status = req.query.status) : (status = "public"));

      try {
        const albums = await Album.find({ status: status })
          .select("albumName sector status uploader")
          .skip((req.query.page - 1) * req.query.items)
          .limit(req.query.items)
          .sort({ albumCreatedAt: "desc" })
          .exec();

        res.status(200).json(albums);
      } catch (error) {
        res.status(404);
        next(error);
      }
    } else {
      return res.status(401).send({ message: "Forbiden" });
    }
  }
);

// @route :: GET
// @description :: Get all album from each sector with album details. exclude phtos
// @api :: albums/all

router.get(
  "/:sector/followed",
  isAuthenticatedUser,
  Pagination,
  async (req, res, next) => {
    const sector = req.params.sector;
    try {
      const { following } = await User.findOne({ _id: req.user._id })
        .select("following")
        .exec();

      const albums = await Album.find({
        sector: sector,
        $or: [{ status: "followers" }, { status: "public" }],
        uploader: { $in: following },
      })
        .select("albumName sector status uploader")
        .skip((req.query.page - 1) * req.query.items)
        .limit(req.query.items)
        .sort({ createdAt: "desc" })
        .exec();

      res.send(albums);
    } catch (error) {
      res.status(404);
      next(error);
    }
  }
);

// @route :: GET
// @description :: Get all album from each sector with album details. exclude phtos
// @api :: albums/all

router.get(
  "/:sector/explore",
  isAuthenticatedUser,
  Pagination,
  async (req, res, next) => {
    const sector = req.params.sector;
    try {
      const albums = await Album.find({
        sector: sector,
        $or: [{ status: "public" }],
      })
        .select("albumName sector status uploader")
        .skip((req.query.page - 1) * req.query.items)
        .limit(req.query.items)
        .sort({ createdAt: "desc" })
        .exec();

      res.send(albums);
    } catch (error) {
      res.status(404);
      next(error);
    }
  }
);

// @route :: GET
// @description :: single album details
// @api :: albums/a/d/:albumsID

router.get(
  "/a/d/:albumID",
  isAuthenticatedUser,
  CheckAlbumExists,
  CheckRole,
  async (req, res, next) => {
    try {
      const album = await Album.findOne({ _id: req.params.albumID }).exec();

      if (req.user._id == album.uploader || req.admin) {
        res.status(200).send({
          ...album._doc,
        });
      } else if (req.user._id !== album.uploader) {
        if (album.status === "public") {
          res.status(200).send({
            ...album._doc,
          });
        } else if (album.status === "followers") {
          const userx = await User.findOne({
            _id: album.uploader,
            followers: { $in: req.user },
          });
          if (userx) {
            res.status(200).send({
              ...album._doc,
            });
          } else {
            res
              .status(200)
              .json({ message: "you have to follow this user to this album" });
          }
        } else {
          throw new Error();
        }

        await album.update({ $inc: { numAlbumViewCount: +1 } });
        await UserStats.updateOne(
          { parentUser: album.uploader },
          { $inc: { numAlbumViews: +1 } }
        );
      } else {
        throw new Error();
      }
    } catch (error) {
      res.status(404);
      next(error);
    }
  }
);

// @route :: GET
// @description :: get a single albums with all photo. exclude : album details
// @api :: albums/a/:albumID

router.get(
  "/a/:albumID",
  isAuthenticatedUser,
  CheckAlbumExists,
  async (req, res) => {
    try {
      const file = await gfs.files.find({
        "metadata.albumID": req.params.albumID,
      });

      file.toArray(async (err, files) => {
        if (!files || files.length === 0) {
          res.status(404).json({
            message: "No Photos Uploaded yet",
          });
        } else {
          var totalPhotos = files.length;
          res.status(201).json({
            message: "Photo Found",
            totalPhotos,
            photos: files,
          });
        }
      });
    } catch (error) {
      res.status(401);
      next(error);
    }
  }
);

// @route :: POST
// @description :: add tag to album
// @api :: albums/a/:albumID/addtag

router.patch(
  "/a/:albumID/addtag",
  isAuthenticatedUser,
  CheckAlbumExists,
  isAlbumUploader,
  TagArrange,
  TagExists,
  async (req, res, next) => {
    const tagname = req.body.tagname;
    const album = req.album;
    try {
      const addtag = {
        $addToSet: { albumTags: [{ tagName: tagname }] },
      };
      await album.updateOne(addtag);
      res.status(200).json({
        message: "Tag has been added",
      });
    } catch (error) {
      res.status(400);
      next(error);
    }
  }
);

// @route ::  POST
// @description ::  remove tag from album
// @api ::  /albums/album/:albumID/dt/:tagID

router.patch(
  "/a/:albumID/dt/:tagID",
  isAuthenticatedUser,
  CheckAlbumExists,
  isAlbumUploader,
  TagIdExists,
  async (req, res, next) => {
    const album = req.album;
    const tagID = req.params.tagID;
    try {
      const pulltag = {
        $pull: { albumTags: { _id: tagID } },
      };
      await album.updateOne(pulltag);
      res.status(200).json({
        message: "Tag has been removed",
      });
    } catch (error) {
      res.status(400);
      next(error);
    }
  }
);

// @route :: POST
// @description :: add category tag to album
// @api :: albums/a/:albumID/addcategory

router.patch(
  "/a/:albumID/addcategory",
  isAuthenticatedUser,
  CheckAlbumExists,
  isAlbumUploader,
  CategoryExists,
  async (req, res, next) => {
    const categoryname = req.body.categoryname;
    const album = req.album;
    try {
      const addcat = {
        $addToSet: { albumCategories: [{ categoryName: categoryname }] },
      };
      await album.updateOne(addcat);
      res.status(200).json({
        message: "Category has been added",
      });
    } catch (error) {
      res.status(400);
      next(error);
    }
  }
);

// @route ::  POST
// @description ::  remove tag from album
// @api ::  /albums/album/:albumID/dt/:tagID

router.patch(
  "/a/:albumID/dc/:catID",
  isAuthenticatedUser,
  CheckAlbumExists,
  isAlbumUploader,
  CatIdExists,
  async (req, res, next) => {
    const album = req.album;
    const catID = req.params.catID;
    try {
      const pullcat = {
        $pull: { albumCategories: { _id: catID } },
      };
      await album.updateOne(pullcat);
      res.status(200).json({
        message: "Category has been removed",
      });
    } catch (error) {
      res.status(400);
      next(error);
    }
  }
);

// @route ::  POST
// @description ::  add co-artist from album
// @api ::  /albums/album/:albumID/dt/:tagID

router.patch(
  "/a/:albumID/addcoartist",
  isAuthenticatedUser,
  CheckAlbumExists,
  isAlbumUploader,
  CoArtistExists,
  async (req, res, next) => {
    const addcoartist = req.body.addcoartist;
    const album = req.album;
    try {
      const addcoa = {
        $addToSet: { coArtistNames: [{ coArtistName: addcoartist }] },
      };
      await album.updateOne(addcoa);
      res.status(200).json({
        message: "Co-Artsit has been added",
      });
    } catch (error) {
      res.status(400);
      next(error);
    }
  }
);

// @route ::  POST
// @description ::  remove co-artist from album
// @api ::  /albums/album/:albumID/dt/:tagID

router.patch(
  "/a/:albumID/dca/:coaID",
  isAuthenticatedUser,
  CheckAlbumExists,
  isAlbumUploader,
  CoAIdExists,
  async (req, res, next) => {
    const album = req.album;
    const coaID = req.params.coaID;
    try {
      const pullcoa = {
        $pull: { coArtistNames: { _id: coaID } },
      };
      await album.updateOne(pullcoa);
      res.status(200).json({
        message: "Co-Artsit has been removed",
      });
    } catch (error) {
      res.status(400);
      next(error);
    }
  }
);

// @route ::  POST
// @description ::  add co-model from album
// @api ::  /albums/album/:albumID/dt/:tagID

router.patch(
  "/a/:albumID/addcomodel",
  isAuthenticatedUser,
  CheckAlbumExists,
  isAlbumUploader,
  CoModelExists,
  async (req, res, next) => {
    const addcomodel = req.body.addcomodel;
    const album = req.album;
    try {
      const addcom = {
        $addToSet: { coModelNames: [{ coModelName: addcomodel }] },
      };
      await album.updateOne(addcom);
      res.status(200).json({
        message: "Co-Model has been added",
      });
    } catch (error) {
      res.status(400);
      next(error);
    }
  }
);

// @route ::  POST
// @description ::  remove co-artist from album
// @api ::  /albums/album/:albumID/dt/:tagID

router.patch(
  "/a/:albumID/dcm/:comID",
  isAuthenticatedUser,
  CheckAlbumExists,
  isAlbumUploader,
  CoMIdExists,
  async (req, res, next) => {
    const album = req.album;
    const comID = req.params.comID;
    try {
      const pullcom = {
        $pull: { coModelNames: { _id: comID } },
      };
      await album.updateOne(pullcom);
      res.status(200).json({
        message: "Co-Model has been removed",
      });
    } catch (error) {
      res.status(400);
      next(error);
    }
  }
);

// @route ::  POST
// @description ::  Love and un love
// @api ::  /albums/album/:albumID/dt/:tagID

router.post(
  "/a/:albumID/love",
  isAuthenticatedUser,
  CheckAlbumExists,
  async (req, res, next) => {
    const album = req.album;
    const user = req.user;
    try {
      const love = async () => {
        const checkLoved = await AlbumLove.findOne({
          album: album._id,
          user: user._id,
        });
        if (checkLoved) {
          const dt = await checkLoved.delete();
          if (dt) {
            const { n, nModified } = await Album.updateOne(
              { _id: album._id },
              { $inc: { numLoveCount: -1 } }
            );
            if (n === 1 && nModified === 1) {
              await UserStats.updateOne(
                { parentUser: album.uploader._id },
                { $inc: { numGetLove: -1 } }
              );
              await UserStats.updateOne(
                { parentUser: req.user._id },
                { $inc: { numAlbumLove: -1 } }
              );

              res.status(201).json({
                message: "Album has been unLoved",
              });
            }
          } else {
            throw new Error();
          }
        } else {
          const newAlbumLove = new AlbumLove({
            album: album,
            user: user,
          });
          const loveCreated = await newAlbumLove.save();

          if (loveCreated) {
            const { n, nModified } = await Album.updateOne(
              { _id: album._id },
              { $inc: { numLoveCount: +1 } }
            );
            if (n === 1 && nModified === 1) {
              await UserStats.updateOne(
                { parentUser: album.uploader._id },
                { $inc: { numGetLove: +1 } }
              );
              await UserStats.updateOne(
                { parentUser: req.user._id },
                { $inc: { numAlbumLove: +1 } }
              );
              res.status(201).json({
                message: "Album has been Loved",
              });
            }
          } else {
            throw new Error();
          }
        }
      };

      if (req.user._id == album.uploader._id || album.status === "public") {
        love();
      } else if (
        req.user._id !== album.uploader._id &&
        album.status === "followers"
      ) {
        const userx = await User.findOne({
          _id: album.uploader._id,
          followers: { $in: req.user },
        });
        if (!userx) {
          throw new Error("followers only an love this album");
        } else {
          love();
        }
      } else {
        throw new Error();
      }
    } catch (error) {
      res.status(400);
      next(error);
    }
  }
);

// @route ::  POST
// @description ::  Love and un love
// @api ::  /albums/album/:albumID/dt/:tagID

router.post(
  "/a/:albumID/favorite",
  isAuthenticatedUser,
  CheckAlbumExists,
  async (req, res, next) => {
    const album = req.album;
    const user = req.user;
    try {
      const love = async () => {
        const checkFavorite = await AlbumFavorite.findOne({
          album: album._id,
          user: user._id,
        });
        if (checkFavorite) {
          const dt = await checkFavorite.delete();
          if (dt) {
            const { n, nModified } = await Album.updateOne(
              { _id: album._id },
              { $inc: { numFavoriteCount: -1 } }
            );
            if (n === 1 && nModified === 1) {
              await UserStats.updateOne(
                { parentUser: album.uploader._id },
                { $inc: { numGetFavorite: -1 } }
              );
              await UserStats.updateOne(
                { parentUser: req.user._id },
                { $inc: { numAlbumFavorite: -1 } }
              );

              res.status(201).json({
                message: "Album has been Unfavorite",
              });
            }
          } else {
            throw new Error();
          }
        } else {
          const newAlbumFavorite = new AlbumFavorite({
            album: album,
            user: user,
          });
          const favoriteCreated = await newAlbumFavorite.save();

          if (favoriteCreated) {
            const { n, nModified } = await Album.updateOne(
              { _id: album._id },
              { $inc: { numFavoriteCount: +1 } }
            );
            if (n === 1 && nModified === 1) {
              await UserStats.updateOne(
                { parentUser: album.uploader._id },
                { $inc: { numGetFavorite: +1 } }
              );
              await UserStats.updateOne(
                { parentUser: req.user._id },
                { $inc: { numAlbumFavorite: +1 } }
              );
              res.status(201).json({
                message: "Album has been Favorite",
              });
            }
          } else {
            throw new Error();
          }
        }
      };

      if (req.user._id == album.uploader._id || album.status === "public") {
        love();
      } else if (
        req.user._id !== album.uploader._id &&
        album.status === "followers"
      ) {
        const userx = await User.findOne({
          _id: album.uploader._id,
          followers: { $in: req.user },
        });
        if (!userx) {
          throw new Error("followers only an favorite this album");
        } else {
          love();
        }
      } else {
        throw new Error();
      }
    } catch (error) {
      res.status(400);
      next(error);
    }
  }
);

// @route ::  POST
// @description ::  Love and un love
// @api ::  /albums/album/:albumID/dt/:tagID

router.post(
  "/a/:albumID/like",
  isAuthenticatedUser,
  CheckAlbumExists,
  async (req, res, next) => {
    const album = req.album;
    const user = req.user;
    try {
      const love = async () => {
        const checkLike = await AlbumLike.findOne({
          album: album._id,
          user: user._id,
        });
        if (checkLike) {
          const dt = await checkLike.delete();
          if (dt) {
            const { n, nModified } = await Album.updateOne(
              { _id: album._id },
              { $inc: { numLikeCount: -1 } }
            );
            if (n === 1 && nModified === 1) {
              await UserStats.updateOne(
                { parentUser: album.uploader._id },
                { $inc: { numGetLike: -1 } }
              );

              res.status(201).json({
                message: "Album has been unLiked",
              });
            }
          } else {
            throw new Error();
          }
        } else {
          const newAlbumLike = new AlbumLike({
            album: album,
            user: user,
          });
          const likeCreated = await newAlbumLike.save();

          if (likeCreated) {
            const { n, nModified } = await Album.updateOne(
              { _id: album._id },
              { $inc: { numLikeCount: +1 } }
            );
            if (n === 1 && nModified === 1) {
              await UserStats.updateOne(
                { parentUser: album.uploader._id },
                { $inc: { numGetLike: +1 } }
              );
              res.status(201).json({
                message: "Album has been Like",
              });
            }
          } else {
            throw new Error();
          }
        }
      };

      if (req.user._id == album.uploader._id || album.status === "public") {
        love();
      } else if (
        req.user._id !== album.uploader._id &&
        album.status === "followers"
      ) {
        const userx = await User.findOne({
          _id: album.uploader._id,
          followers: { $in: req.user },
        });
        if (!userx) {
          throw new Error("followers only an favorite this album");
        } else {
          love();
        }
      } else {
        throw new Error();
      }
    } catch (error) {
      res.status(400);
      next(error);
    }
  }
);

module.exports = router;
