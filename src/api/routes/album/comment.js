const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const ObjectId = require("mongodb").ObjectID;

const Album = require("../../../models/Album");
const User = require("../../../models/User");
const UserStats = require("../../../models/userStats");
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
const { populate } = require("../../../models/Album");

// @route ::  POST ✅
// @description ::  comment an album
// @api ::  /albums/c/a/:albumID
router.post(
  "/a/:albumID",
  isAuthenticatedUser,
  CheckAlbumExists,
  async (req, res, next) => {
    album = req.album;
    user = req.user;
    try {
      const comment = async () => {
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
            const isComment = await newComment.save();
            if (!isComment) {
              throw new Error();
            } else {
              const { n, nModified } = await album.updateOne({
                $inc: { numCommentCount: +1 },
              });

              // if i want to populate comment via album then i need this
              // await album.comments.push(newComment);
              // await album.save();

              if ((n === 1, nModified === 1)) {
                await UserStats.updateOne(
                  { parentUser: album.uploader._id },
                  { $inc: { numGetComment: +1 } }
                );
                await UserStats.updateOne(
                  { parentUser: user._id },
                  { $inc: { numPostComment: +1 } }
                );

                res.status(201).json({
                  message: "comment has been created",
                });
              }
            }
          } catch (error) {
            res.status(500);
            next(error);
          }
        }
      };

      if (user._id == album.uploader._id || album.status === "public") {
        comment();
      } else if (
        req.user !== album.uploader._id &&
        album.status === "followers"
      ) {
        const userx = await User.findOne({
          _id: album.uploader._id,
          followers: { $in: req.user },
        });
        if (!userx) {
          throw new Error("followers only an comment this album");
        } else {
          comment();
        }
      } else {
        throw new Error();
      }
    } catch (error) {
      res.status(401);
      next(error);
    }
  }
);

// @route ::  GET ✅
// @description ::  get all comment from an album
// @api ::  /albums/c/a/:albumID
router.get(
  "/a/:albumID",
  isAuthenticatedUser,
  CheckAlbumExists,
  async (req, res, next) => {
    album = req.album;
    user = req.user;
    try {
      const comment = async () => {
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
      };

      if (user._id == album.uploader._id || album.status === "public") {
        comment();
      } else if (
        req.user !== album.uploader._id &&
        album.status === "followers"
      ) {
        const userx = await User.findOne({
          _id: album.uploader._id,
          followers: { $in: req.user },
        });
        if (!userx) {
          throw new Error("followers only can  see comment of this album");
        } else {
          comment();
        }
      } else {
        throw new Error();
      }
    } catch (error) {
      res.status(501);
      next(error);
    }
  }
);

// @route ::  POST ✅
// @description ::  update a comment
// @api ::  /albums/c/:commentID
router.post("/:commentID", isAuthenticatedUser, async (req, res, next) => {
  user = req.user;

  try {
    const updateComment = async () => {
      const { error } = commentValidation(req.body);
      if (error) {
        res.status(422);
        next(error);
      } else {
        const { n, nModified } = await comment.updateOne({
          commentBody: req.body.commentBody,
          $set: { commentStatus: "edited" },
        });

        if (n === 1 && nModified === 1) {
          res.status(201).json({
            message: "comment edited",
          });
        } else {
          throw new Error("unauthorized+");
        }
      }
    };

    const comment = await Comment.findOne({
      _id: req.params.commentID,
      user: req.user._id,
    }).populate("album", "status uploader");
    if (comment) {
      if (comment.album.status === "public" && comment.user == user._id) {
        updateComment();
      } else if (
        comment.album.status === "followers" &&
        comment.user == user._id
      ) {
        const userx = await User.findOne({
          _id: comment.album.uploader,
          followers: { $in: req.user },
        });
        if (!userx) {
          throw new Error(
            "this comment belongs to followers-only album so you cant like or reply this comment"
          );
        } else {
          updateComment();
        }
      } else {
        throw new Error("upss");
      }
    } else {
      throw new Error("this is not your comment to update");
    }
  } catch (error) {
    res.status(400);
    next(error);
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

// @route ::  Get ✅
// @description ::  like a comment
// @api ::

router.patch(
  "/:commentID/like",
  isAuthenticatedUser,
  async (req, res, next) => {
    user = req.user;
    try {
      const like = async () => {
        if (comment) {
          const checkIsLiked = comment.commentLike.find(
            (cm) => cm == req.user._id
          );
          if (checkIsLiked) {
            const { n, nModified } = await comment.updateOne({
              $pull: { commentLike: req.user._id },
              $inc: { commentLikeCount: -1 },
            });
            if ((n == 1, nModified)) {
              await UserStats.updateOne(
                { parentUser: comment.user },
                { $inc: { numGetLike: -1 } }
              );

              res.status(200).json({ message: " comment unliked" });
            }
          } else {
            const { n, nModified } = await comment.updateOne({
              $addToSet: { commentLike: req.user._id },
              $inc: { commentLikeCount: +1 },
            });
            if ((n == 1, nModified)) {
              await UserStats.updateOne(
                { parentUser: comment.user },
                { $inc: { numGetLike: +1 } }
              );

              res.status(200).json({ message: " comment liked" });
            }
          }
        } else {
          throw new Error("no comment +");
        }
      };

      const comment = await Comment.findOne({
        _id: req.params.commentID,
      }).populate("album", "status uploader");
      if (!comment) {
        throw new Error("no comment -");
      } else {
        if (
          comment.album.status === "public" ||
          comment.album.uploader == user._id
        ) {
          like();
        } else if (comment.album.status === "followers") {
          const userx = await User.findOne({
            _id: comment.album.uploader,
            followers: { $in: req.user },
          });
          if (!userx) {
            throw new Error(
              "this comment belongs to followers-only album so you cant like or reply this comment"
            );
          } else {
            like();
          }
        }
      }
    } catch (error) {
      res.status(404);
      next(error);
    }
  }
);

// @route ::  PATCH ✅
// @description ::  like a reply
// @api ::
router.patch(
  "/r/:replyID/like",
  isAuthenticatedUser,
  async (req, res, next) => {
    user = req.user;
    try {
      const likeReply = async () => {
        const checkIsLiked = reply.replyLike.find((rp) => rp == req.user._id);
        if (checkIsLiked) {
          const { n, nModified } = await reply.updateOne({
            $pull: { replyLike: req.user._id },
            $inc: { replyLikeCount: -1 },
          });
          if (n == 1 && nModified === 1) {
            await UserStats.updateOne(
              { parentUser: reply.user },
              { $inc: { numGetLike: -1 } }
            );
            res.status(200).json({ message: " reply unliked" });
          } else {
            throw new Error();
          }
        } else {
          const { n, nModified } = await reply.updateOne({
            $addToSet: { replyLike: req.user._id },
            $inc: { replyLikeCount: +1 },
          });
          if (n == 1 && nModified === 1) {
            await UserStats.updateOne(
              { parentUser: reply.user },
              { $inc: { numGetLike: +1 } }
            );
            res.status(200).json({ message: " reply liked" });
          } else {
            throw new Error();
          }
        }
      };

      const reply = await Reply.findOne({
        _id: req.params.replyID,
      })
        .populate("user")
        .populate({
          path: "comment",
          populate: {
            path: "album",
            select: "uploader status",
          },
        })
        .exec();

      if (!reply) {
        throw new Error("no reply exsits");
      } else {
        if (
          reply.comment.album.status === "public" ||
          reply.comment.album.uploader == user._id
        ) {
          likeReply();
        } else if (reply.comment.album.status === "followers") {
          const userx = await User.findOne({
            _id: reply.comment.album.uploader,
            followers: { $in: req.user },
          });
          if (!userx) {
            throw new Error(
              "this reply belongs to followers-only album so you cant like or reply this comment"
            );
          } else {
            likeReply();
          }
        } else {
          throw new Error("sorry+++");
        }
      }
    } catch (error) {
      res.status(404);
      next(error);
    }
  }
);

// @route ::  POST ✅
// @description ::  Post a reply
// @api ::

router.post(
  "/:commentID/reply",
  isAuthenticatedUser,
  async (req, res, next) => {
    const user = req.user;
    try {
      const reply = async () => {
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
              const { n, nModified } = await comment.updateOne({
                $addToSet: { reply: newReply },
                $inc: { commentReplyCount: +1 },
              });
              if (n === 1 && nModified === 1) {
                await UserStats.updateOne(
                  { parentUser: user },
                  { $inc: { numPostComment: +1 } }
                );
                await UserStats.updateOne(
                  { parentUser: comment.album.uploader },
                  { $inc: { numGetComment: +1 } }
                );
              }
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
      };

      const comment = await Comment.findOne({
        _id: req.params.commentID,
      }).populate("album", "status uploader");

      if (
        comment.album.status === "public" ||
        comment.album.uploader == user._id
      ) {
        reply();
      } else if (comment.album.status === "followers") {
        const userx = await User.findOne({
          _id: comment.album.uploader,
          followers: { $in: req.user },
        });
        if (!userx) {
          throw new Error(
            "this comment belongs to followers-only album so you cant like or reply this comment"
          );
        } else {
          reply();
        }
      }
    } catch (error) {
      res.status(404);
      next(error);
    }
  }
);

// @route ::  POST ✅
// @description ::  update a reply
// @api ::  /albums/c/:commentID
router.patch("/r/:replyID", isAuthenticatedUser, async (req, res, next) => {
  user = req.user;
  try {
    const updateReply = async () => {
      const { error } = replyValidation(req.body);
      if (error) {
        res.status(422);
        next(error);
      } else {
        try {
          const { n, nModified } = await reply.updateOne({
            replyBody: req.body.replyBody,
            $set: { replyStatus: "edited" },
          });
          if (n === 1 && nModified === 1) {
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
    };

    const reply = await Reply.findOne({
      _id: req.params.replyID,
      user: user,
    })
      .populate("user")
      .populate({
        path: "comment",
        populate: {
          path: "album",
          select: "uploader status",
        },
      })
      .exec();

    if (!reply) {
      throw new Error("no reply exsits");
    } else {
      if (
        reply.comment.album.status === "public" ||
        reply.comment.album.uploader == user._id
      ) {
        updateReply();
      } else if (
        reply.comment.album.status === "followers" &&
        reply.user._id == user._id
      ) {
        const userx = await User.findOne({
          _id: reply.comment.album.uploader,
          followers: { $in: req.user },
        });
        if (!userx) {
          throw new Error(
            "this reply belongs to followers-only album so you cant like or reply this comment"
          );
        } else {
          updateReply();
        }
      } else {
        throw new Error("sorry+++");
      }
    }
  } catch (error) {
    res.status(400);
    next(error);
  }
});

// @route ::  DELETE ✅
// @description ::  delete a reply
// @api ::
router.delete("/r/:replyID", isAuthenticatedUser, async (req, res, next) => {
  user = req.user;
  try {
    const deletereply = async () => {
      await reply.delete();
      await Comment.updateOne(
        { _id: reply.comment._id },
        { $inc: { commentReplyCount: -1 } }
      );
      res.status(200).json({ message: "reply has been deleted" });
    };
    const reply = await Reply.findOne({
      _id: req.params.replyID,
    })
      .populate("user")
      .populate({
        path: "comment",
        populate: {
          path: "album",
          select: "uploader status",
        },
      })
      .exec();
    if (reply) {
      if (
        (reply.comment.album.status === "public" &&
          req.user._id == reply.user._id) ||
        req.user._id == reply.comment.album.uploader
      ) {
        deletereply();
      } else if (reply.comment.album.status === "followers") {
        const userx = await User.findOne({
          _id: reply.comment.album.uploader,
          followers: { $in: req.user },
        });
        if (!userx) {
          throw new Error(
            "this reply belongs to followers-only album so you cant like or reply this comment"
          );
        } else {
          if (
            req.user._id == reply.user._id ||
            req.user._id == reply.comment.album.uploader
          ) {
            deletereply();
          } else {
            throw new Error("this is not your reply");
          }
        }
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
