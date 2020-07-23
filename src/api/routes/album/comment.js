const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const ObjectId = require("mongodb").ObjectID;

const Album = require("../../../models/Album");
const User = require("../../../models/User");
const AlbumLove = require("../../../models/albumLove");
const Comment = require("../../../models/Comment");
const Reply = require("../../../models/reply");

const isAuthenticatedUser = require("../../../middlewares/isAuthenticatedUser");
const { createAlbumValidate } = require("../../../middlewares/albumValidation");
const {
  commentValidation,
  replyValidation,
} = require("../../../middlewares/commentValidation");
const {
  CheckAlbumExists,
  Pagination,
  isAlbumUploader,
} = require("../../../middlewares/albumMiddleware");
const reply = require("../../../models/reply");

// @route ::  POST
// @description ::  comment an album
// @api ::  /albums/c/a/:albumID
router.post(
  "/a/:albumID",
  isAuthenticatedUser,
  CheckAlbumExists,
  async (req, res, next) => {
    album = req.album;
    user = req.user;
    const { error } = commentValidation(req.body);
    if (error) {
      res.status(422);
      next(error);
    } else {
      try {
        const newComment = new Comment({
          album: album,
          user: user,
          commentBody: req.body.commentBody,
        });
        await newComment.save();
        await album.updateOne({ $inc: { commentCount: +1 } });

        // this is not used yet. if i want yo populate comment via album then i need this
        // await album.comments.push(newComment);
        // await album.save();

        res.status(201).json({
          message: "comment has been created",
        });
      } catch (error) {
        res.status(404);
        next(error);
      }
    }
  }
);

// @route ::  GET
// @description ::  get all comment
// @api ::  /albums/c/a/:albumID
router.get(
  "/a/:albumID",
  isAuthenticatedUser,
  CheckAlbumExists,
  async (req, res, next) => {
    album = req.album._id;
    user = req.user;
    try {
      const comments = await Comment.find({ album: req.album._id })
        .populate("user", "username")
        .populate("reply", "replyBody replyLikeCount replyStatus")
        .sort({ createdAt: "desc" });
      res.status(201).json(comments);
    } catch (error) {
      res.status(404);
      next(error);
    }
  }
);

// @route ::  POST
// @description ::  update a comment
// @api ::  /albums/c/:commentID
router.post("/:commentID", isAuthenticatedUser, async (req, res, next) => {
  user = req.user;
  const { error } = commentValidation(req.body);
  if (error) {
    res.status(422);
    next(error);
  } else {
    try {
      const updateComment = await Comment.updateOne(
        {
          _id: req.params.commentID,
          user: req.user._id,
        },
        { commentBody: req.body.commentBody, $set: { commentStatus: "edited" } }
      );
      if (updateComment.n === 1) {
        res.status(201).json({
          message: "comment edited",
        });
      } else {
        throw new Error("unauthorized");
      }
    } catch (error) {
      res.status(404);
      next(error);
    }
  }
});

// @route ::  DELETE
// @description ::  delete a comment + all reply
// @api ::  /albums/c/:commentID
router.delete("/:commentID", isAuthenticatedUser, async (req, res, next) => {
  user = req.user;
  try {
    const comment = await Comment.findOne({
      _id: req.params.commentID,
    }).populate("album", "uploader commentCount _id");
    if (comment) {
      if (
        req.user._id == comment.user ||
        req.user._id == comment.album.uploader
      ) {
        await Reply.deleteMany({ comment: req.params.commentID });
        await comment.delete();
        await Album.updateOne(
          {
            _id: comment.album._id,
          },
          { $inc: { commentCount: -1 } }
        );

        res.status(200).json({ message: "comment has been deleted" });
      } else {
        throw new Error("unauthorized");
      }
    } else {
      throw new Error("no comment");
    }
  } catch (error) {
    res.status(404);
    next(error);
  }
});

// @route ::  Get
// @description ::  get all comments an album
// @api ::

router.patch(
  "/:commentID/like",
  isAuthenticatedUser,
  async (req, res, next) => {
    user = req.user;
    try {
      const comment = await Comment.findOne({
        _id: req.params.commentID,
      });
      if (comment) {
        const checkIsLiked = comment.commentLike.find(
          (cm) => cm == req.user._id
        );
        if (checkIsLiked) {
          await comment.updateOne({
            $pull: { commentLike: req.user._id },
            $inc: { commentLikeCount: -1 },
          });
          res.status(200).json({ message: " comment unliked" });
        } else {
          await comment.updateOne({
            $addToSet: { commentLike: req.user._id },
            $inc: { commentLikeCount: +1 },
          });
          res.status(200).json({ message: " comment liked" });
        }
      } else {
        throw new Error("no comment");
      }
    } catch (error) {
      res.status(404);
      next(error);
    }
  }
);

router.patch(
  "/r/:replyID/like",
  isAuthenticatedUser,
  async (req, res, next) => {
    user = req.user;
    try {
      const reply = await Reply.findOne({
        _id: req.params.replyID,
      });
      if (reply) {
        const checkIsLiked = reply.replyLike.find((rp) => rp == req.user._id);
        if (checkIsLiked) {
          await reply.updateOne({
            $pull: { replyLike: req.user._id },
            $inc: { replyLike: -1 },
          });
          res.status(200).json({ message: " reply unliked" });
        } else {
          await reply.updateOne({
            $addToSet: { replyLike: req.user._id },
            $inc: { replyLikeCount: +1 },
          });
          res.status(200).json({ message: " reply liked" });
        }
      } else {
        throw new Error("no reply");
      }
    } catch (error) {
      res.status(404);
      next(error);
    }
  }
);

router.post(
  "/:commentID/reply",
  isAuthenticatedUser,
  async (req, res, next) => {
    const user = req.user;
    const comment = await Comment.findOne({ _id: req.params.commentID }).exec();

    if (comment) {
      const { error } = replyValidation(req.body);
      if (error) {
        res.status(422);
        next(error);
      } else {
        try {
          const newReply = new Reply({
            comment: req.params.commentID,
            user: user,
            replyBody: req.body.replyBody,
          });
          await newReply.save();
          await comment.updateOne({ $addToSet: { reply: newReply } });
          res.status(201).json({
            message: "reply has been created",
          });
        } catch (error) {
          res.status(404);
          next(error);
        }
      }
    } else {
      res.status(404).json("No comment");
    }
  }
);

// @route ::  POST
// @description ::  update a comment
// @api ::  /albums/c/:commentID
router.patch("/r/:replyID", isAuthenticatedUser, async (req, res, next) => {
  user = req.user;
  const { error } = replyValidation(req.body);
  if (error) {
    res.status(422);
    next(error);
  } else {
    try {
      const updateReply = await Reply.updateOne(
        {
          _id: req.params.replyID,
          user: req.user._id,
        },
        { replyBody: req.body.replyBody, $set: { replyStatus: "edited" } }
      );
      if (updateReply.n === 1) {
        res.status(201).json({
          message: "reply edited",
        });
      } else {
        throw new Error("unauthorized");
      }
    } catch (error) {
      res.status(404);
      next(error);
    }
  }
});

// @route ::  DELETE
// @description ::  delete a comment + all reply
// @api ::  /albums/c/:commentID
router.delete("/r/:replyID", isAuthenticatedUser, async (req, res, next) => {
  user = req.user;
  try {
    const reply = await Reply.findOne({
      _id: req.params.replyID,
    })
      .populate("user")
      .exec();
    if (reply) {
      if (req.user._id == reply.user._id) {
        await reply.delete();
        //if i want to reply as a comment
        // await Album.updateOne(
        //   {
        //     _id: reply.album._id,
        //   },
        //   { $inc: { replyCount: -1 } }
        // );

        res.status(200).json({ message: "reply has been deleted" });
      } else {
        throw new Error("unauthorized");
      }
    } else {
      throw new Error("no reply");
    }
  } catch (error) {
    res.status(404);
    next(error);
  }
});

module.exports = router;
