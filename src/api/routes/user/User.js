const express = require("express");
const router = express.Router();
const ObjectId = require("mongodb").ObjectID;

const User = require("../../../models/User");
const UserStats = require("../../../models/userStats");
const UserProfile = require("../../../models/userProfile");
const AlbumLove = require("../../../models/albumLove");
const Notification = require("../../../models/Notification");

const isAuthenticatedUser = require("../../../middlewares/isAuthenticatedUser");

const { profileValidation } = require("../user/signupValidation");
const { CheckUserExists } = require("../../../middlewares/userMiddleware");

// @route :: PATCH
// @description :: Following a user
// @api :: /api/user/follow/:UserID
// @website ::  Website Url

router.patch("/follow/:UserID", isAuthenticatedUser, async (req, res, next) => {
  try {
    const followingID = req.params.UserID;

    if (!ObjectId.isValid(req.params.UserID)) {
      throw new Error("no user");
    }

    const followingUser = await User.findOne({ _id: followingID });
    if (!followingUser) {
      throw new Error("no user");
    }
    if (req.user._id === req.params.UserID) {
      throw new Error("cant follow yourself");
    }

    const followingQuery = {
      _id: req.user._id,
      following: { $not: { $elemMatch: { $eq: followingID } } },
    };
    const updateFollowing = {
      $addToSet: { following: followingID },
    };
    const { nModified } = await User.updateOne(followingQuery, updateFollowing);
    try {
      if (nModified === 1) {
        await UserStats.updateOne(
          { parentUser: req.user._id },
          { $inc: { numFollowing: +1 } }
        );

        //followers

        const followersQuery = {
          _id: followingID,
          followers: { $not: { $elemMatch: { $eq: req.user._id } } },
        };
        const followersUpdate = {
          $addToSet: { followers: req.user._id },
        };
        await User.updateOne(followersQuery, followersUpdate);
        await UserStats.updateOne(
          { parentUser: followingID },
          { $inc: { numFollowers: +1 } }
        );
      } else {
        return res.status(200).json("u already followed");
      }
    } catch (error) {
      res.status(501);
      next(error);
    }

    res.status(200).json("followingUpdated");
  } catch (error) {
    res.status(404);
    next(error);
  }
});

// @route :: PATCH
// @description :: Unollowing a user
// @api :: /api/user/unfollow/:UserID
// @website ::  Website Url

router.patch(
  "/unfollow/:UserID",
  isAuthenticatedUser,
  async (req, res, next) => {
    try {
      const unFollowingUserID = req.params.UserID;

      if (!ObjectId.isValid(req.params.UserID)) {
        throw new Error("no user");
      }
      const unFollowingUser = await User.findOne({ _id: unFollowingUserID });
      if (!unFollowingUser) {
        throw new Error("no user");
      }

      if (req.user._id === unFollowingUserID) {
        throw new Error("cant unfollow yourself");
      }

      // remove the id of the user you want to unfollow from following array
      const query = {
        _id: req.user._id,
        following: { $elemMatch: { $eq: unFollowingUserID } },
      };
      const update = {
        $pull: { following: unFollowingUserID },
      };
      const { n, nModified } = await User.updateOne(query, update);
      try {
        if (nModified === 1 && n === 1) {
          await UserStats.updateOne(
            { parentUser: req.user._id },
            { $inc: { numFollowing: -1 } }
          );

          const followersQuery = {
            _id: unFollowingUserID,
            followers: { $elemMatch: { $eq: req.user._id } },
          };

          const followersUpdate = {
            $pull: { followers: req.user._id },
          };
          await User.updateOne(followersQuery, followersUpdate);
          await UserStats.updateOne(
            { parentUser: unFollowingUserID },
            { $inc: { numFollowers: -1 } }
          );
        } else {
          return res.status(200).json("u already unfollowed");
        }
      } catch (error) {
        res.status(501);
        next(error);
      }

      res.status(200).json("unfollowed");
    } catch (err) {
      res.status(400).send({ error: err.message });
    }
  }
);

// @route :: Get
// @description :: user Profile
// @api :: /api/user/unfollow/:UserID

router.get("/:username", isAuthenticatedUser, async (req, res, next) => {
  try {
    if (req.user.username === req.params.username) {
      const userDetails = await User.findOne({
        username: req.user.username,
      })
        .populate("createdAlbums", "albumName _id")
        .populate("profile")
        .populate("stats")
        .exec();
      if (!userDetails) {
        res.status(404);
        throw new Error("No user");
      } else {
        res.status(200).send({
          ...userDetails._doc,
        });
      }
    } else if (req.params.username != req.user.username) {
      const userDetails = await User.findOne({
        username: req.params.username,
      })
        .populate("profile", "-parentUser")
        .populate("stats")
        .select("-following");
      if (!userDetails) {
        res.status(404);
        throw new Error("No user");
      } else {
        await UserStats.updateOne(
          { parentUser: userDetails._id },
          { $inc: { numGetProfileViews: +1 } }
        );

        res.status(200).send({
          username: userDetails.username,
          prifle: userDetails.profile,
          stats: userDetails.stats,
        });
      }
    } else {
      res.status(404);
      throw new Error();
    }
  } catch (error) {
    res.status(400);
    next(error);
  }
});

// @route :: POST
// @description :: user Profile edit
// @api :: /api/user/unfollow/:UserID

router.post(
  "/:username/profile/edit",
  isAuthenticatedUser,
  async (req, res, next) => {
    try {
      if (req.user.username === req.params.username) {
        const profile = await UserProfile.findOne({ parentUser: req.user._id });
        if (!profile) {
          throw new Error();
        } else {
          const { error } = profileValidation(req.body);
          if (error) {
            res.status(422);
            next(error);
          } else {
            const { n, nModified } = await profile.updateOne(req.body);
            if (n === 1 && nModified === 1) {
              res.status(200).json("profile has been updated");
            } else {
              res.status(501).json("sorry something worng");
            }
          }
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

// @route :: Get
// @description :: user follower
// @api :: /api/user/unfollow/:UserID

router.get(
  "/:username/followers",
  isAuthenticatedUser,
  CheckUserExists,
  async (req, res, next) => {
    try {
      const user = await User.findOne({
        username: req.params.username,
      }).populate({
        path: "followers",
        model: "User",
        select: "username followers",
        populate: {
          path: "stats",
          model: "UserStats",
          select: "numFollowers",
        },
      });
      var followers = [];

      user.followers.map((us) => {
        if (us.followers.includes(req.user._id)) {
          followers.push({
            _id: us._id,
            username: us.username,
            followers: us.stats.numFollowers,
            followedUser: true,
          });
        } else {
          followers.push({
            _id: us._id,
            username: us.username,
            followers: us.stats.numFollowers,
            followedUser: false,
          });
        }
      });
      res.status(200).json({
        followers,
      });
    } catch (error) {
      res.status(400);
      next(error);
    }
  }
);

// @route :: Get
// @description :: user follower
// @api :: /api/user/unfollow/:UserID

router.get(
  "/:username/following",
  isAuthenticatedUser,
  CheckUserExists,

  async (req, res, next) => {
    try {
      if (req.user.username == req.params.username) {
        const user = await User.findOne({
          username: req.params.username,
        }).populate({
          path: "following",
          model: "User",
          select: "username",
          populate: {
            path: "stats",
            model: "UserStats",
            select: "numFollowing",
          },
        });

        const following = [];
        user.following.map((us) => {
          following.push({
            _id: us._id,
            username: us.username,
            following: us.stats.numFollowing,
          });
        });

        res.status(200).json({
          following,
        });
      } else {
        res.status(401);
        throw new Error("Not allow to see other people following");
      }
    } catch (error) {
      res.status(400);
      next(error);
    }
  }
);

// @route :: Get
// @description :: user albums
// @api ::

router.get("/:username/albums", isAuthenticatedUser, async (req, res, next) => {
  try {
    if (req.user.username === req.params.username) {
      const user = await User.findOne({
        username: req.params.username,
      })
        .populate("createdAlbums")
        .exec();
      if (!user) {
        res.status(404);
        throw new Error("no user");
      } else {
        res.status(200).json(user.createdAlbums);
      }
    } else if (req.user.username != req.params.username) {
      const user = await User.findOne({
        username: req.params.username,
      })
        .populate("createdAlbums")
        .exec();
      if (!user) {
        res.status(404);
        throw new Error("no user");
      } else {
        const isfollower = user.followers.find(
          (follower) => follower == req.user._id
        );
        if (isfollower) {
          const publicFollowersAlbum = user.createdAlbums.filter(
            (album) => album.status === "public" || album.status === "followers"
          );
          res.status(200).json(publicFollowersAlbum);
        } else {
          const publicAlbum = user.createdAlbums.filter(
            (album) => album.status === "public"
          );
          res.status(200).json(publicAlbum);
        }
      }
    } else {
      res.status(400);
      throw new Error();
    }
  } catch (error) {
    res.status(404);
    next(error);
  }
});

// @route :: Get Loved
// @description :: user albums Loved
// @api ::

router.get(
  "/:username/albums/love",
  isAuthenticatedUser,
  async (req, res, next) => {
    try {
      if (req.user.username === req.params.username) {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
          res.status(404);
          throw new Error("No user");
        } else {
          const lovealbum = await AlbumLove.find({ user: user._id })
            .populate("album")
            .exec();
          res.status(200).json(lovealbum);
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

router.get(
  "/:username/notification",
  isAuthenticatedUser,
  async (req, res, next) => {
    try {
      if (req.user.username === req.params.username) {
        const notifications = await Notification.find({
          receiver: req.user._id,
          seen: false,
        }).sort({ albumCreatedAt: "desc" });

        res.status(200).json({ notifications });
      }
    } catch (error) {
      res.status(400);
      next(error);
    }
  }
);

// @TODO ::  recent created album

module.exports = router;

//5f19a4d5a5ded405c85784ca
