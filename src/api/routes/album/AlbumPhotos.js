const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");

// @model ::
const Album = require("../../../models/Album");
const User = require("../../../models/User");

const isAuthenticatedUser = require("../../../middlewares/isAuthenticatedUser");

const {
  CheckAlbumExists,
  isAlbumUploader,
  Pagination,
} = require("../../../middlewares/albumMiddleware");

let gfs;
mongoose.connection.once("open", () => {
  gfs = Grid(mongoose.connection.db, mongoose.mongo);
  gfs.collection("albumPhotos");
});
// @init :: multer storage

const storage = new GridFsStorage({
  url: process.env.MONGODB_URI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const metadata = {
          albumID: req.params.albumID,
          uploaderID: req.user._id,
        };
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "albumPhotos",
          metadata: metadata,
        };
        resolve(fileInfo);
      });
    });
  },
});

// @init :: multer upload and image validation

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (!file || file.length === 0) {
      cb(null, false);
      return cb(new Error("no file file"));
    } else {
      if (
        file.mimetype == "image/png" ||
        file.mimetype == "image/jpg" ||
        file.mimetype == "image/jpeg"
      ) {
        cb(null, true);
      } else {
        cb(null, false);
        return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
      }
    }
  },
});

// @route :: POST
// @description :: upload photos to album
// @api :: photos/a/:albumID/uload

router.post(
  "/a/:albumID/upload",
  isAuthenticatedUser,
  CheckAlbumExists,
  isAlbumUploader,
  upload.array("albumPhotos"),
  async (req, res, next) => {
    const album = req.album;
    try {
      const file = await gfs.files.find({
        "metadata.albumID": req.params.albumID,
      });
      file.toArray(async (err, files) => {
        const albumTotalPhotos = files.length;
        album.albumTotalPhotos = await albumTotalPhotos;
        await album.save();
      });
      res.status(200).send({ message: "Photos has been uplaoded" });
    } catch (error) {
      res.status(422);
      next(error);
    }
  }
);

// @route :: GET
// @description :: read photo
// @api :: photos/p/:filename
router.get("/p/:filename", isAuthenticatedUser, async (req, res) => {
  try {
    const file = await gfs.files.findOne({ filename: req.params.filename });
    if (!file) {
      res.status(404);
      throw new Error();
    }
    if (
      file.contentType === "image/jpeg" ||
      file.contentType === "image/png" ||
      file.contentType == "image/jpg"
    ) {
      const readstream = await gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(422);
      throw new Error();
    }
  } catch (error) {
    res.status(400);
    next(error);
  }
});

// @route :: POST
// @description :: change a random cover photo
// @api :: photos/a/:albumID/change

router.patch(
  "/a/d/:albumID/change",
  isAuthenticatedUser,
  CheckAlbumExists,
  isAlbumUploader,
  async (req, res) => {
    const album = req.album;
    try {
      const file = await gfs.files.find({
        "metadata.albumID": req.params.albumID,
      });
      if (!file || file.length === 0) {
        return res.status(204).send({
          message: "No photos in album to change",
        });
      } else {
        file.toArray(async (err, files) => {
          const randomCover = Math.floor(
            Math.random() * Math.floor(files.length)
          );
          const cover = files[randomCover].filename;
          const albumCoverPhotoPath = `http://localhost:5000/photos/p/${cover}`;
          const responce = await album.update({
            albumCoverPhoto: albumCoverPhotoPath,
          });
          if (responce) {
            res.status(200).send({ message: "Cover Photos has been changed" });
          } else {
            throw new Error();
          }
        });
      }
    } catch (error) {
      res.status(400);
      next(error);
    }
  }
);

// @route ::  DELETE
// @description ::  delete single photo
// @api ::  /photos/p/:fileID
// @website ::  Website Url
router.delete("/p/:filename", isAuthenticatedUser, async (req, res, next) => {
  try {
    const file = await gfs.files.findOne({
      filename: req.params.filename,
      "metadata.uploaderID": req.user._id,
    });
    if (!file || file.length === 0) {
      throw new Error("Unauthorized");
    } else {
      try {
        const albumID = file.metadata.albumID;

        await gfs.remove({
          filename: file.filename,
          root: "albumPhotos",
        });

        try {
          const file = await gfs.files.find({
            "metadata.albumID": albumID,
          });
          file.toArray(async (err, files) => {
            const albumTotalPhotos = files.length;
            const album = await Album.findOne({ _id: albumID });
            album.albumTotalPhotos = albumTotalPhotos;
            await album.save();
          });
        } catch (error) {
          res.status(422);
          next(error);
        }

        res.status(200).send({ message: "Photos has been deleted" });
      } catch (error) {
        res.status(422);
        next(error);
      }
    }
  } catch (error) {
    res.status(404);
    next(error);
  }
});

module.exports = router;
