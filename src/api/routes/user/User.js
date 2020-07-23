const express = require("express");
const router = express.Router();
const ObjectId = require("mongodb").ObjectID;

const User = require("../../../models/User");
const AlbumLove = require("../../../models/albumLove");

const isAuthenticatedUser = require("../../../middlewares/isAuthenticatedUser");

const { CheckUserExists } = require("../../../middlewares/userMiddleware");
// @route :: PATCH
// @description :: Following a user
// @api :: /api/user/follow/:UserID
// @website ::  Website Url

router.patch("/follow/:UserID", isAuthenticatedUser, async (req, res, next) => {
  try {
    const followingID = req.params.UserID;

    //follwoing ::
    if (!ObjectId.isValid(req.params.UserID)) {
      return res.status(404).json({ error: "invalid id" });
    }

    if (req.user._id === req.params.UserID) {
      return res.status(404).json({ error: " cant follow yourself" });
    }

    const followingQuery = {
      _id: req.user._id,
      following: { $not: { $elemMatch: { $eq: followingID } } },
    };

    const updateFollowing = {
      $addToSet: { following: followingID },
      $inc: { followingCount: +1 },
    };

    const followingUpdated = await User.updateOne(
      followingQuery,
      updateFollowing
    );

    //followers

    const followersQuery = {
      _id: followingID,
      followers: { $not: { $elemMatch: { $eq: req.user._id } } },
    };

    const followersUpdate = {
      $addToSet: { followers: req.user._id },
      $inc: { followersCount: +1 },
    };

    const followersUpdated = await User.updateOne(
      followersQuery,
      followersUpdate
    );

    //validate

    if (!followingUpdated || !followersUpdated) {
      return res.status(404).json({ error: "Unable to follow that user" });
    }

    //responce

    res.status(200).json(followingUpdated);
  } catch (error) {
    console.log(error);
  }
});

// @route :: PATCH
// @description :: Unollowing a user
// @api :: /api/user/unfollow/:UserID
// @website ::  Website Url

router.patch("/unfollow/:UserID", isAuthenticatedUser, async (req, res) => {
  try {
    const id = req.params.UserID;

    if (!ObjectId.isValid(req.params.UserID)) {
      return res.status(404).json({ error: "invalid id" });
    }

    if (req.user._id === id) {
      return res.status(400).json({ error: "You cannot unfollow yourself" });
    }

    // remove the id of the user you want to unfollow from following array
    const query = {
      _id: req.user._id,
      following: { $elemMatch: { $eq: id } },
    };

    const update = {
      $pull: { following: id },
      $inc: { followingCount: -1 },
    };

    const updated = await User.updateOne(query, update);

    // remove your id from the followers array of the user you want to unfollow
    const secondQuery = {
      _id: id,
      followers: { $elemMatch: { $eq: req.user._id } },
    };

    const secondUpdate = {
      $pull: { followers: req.user._id },
      $inc: { followersCount: -1 },
    };

    const secondUpdated = await User.updateOne(secondQuery, secondUpdate);

    if (!updated || !secondUpdated) {
      return res.status(404).json({ error: "Unable to unfollow that user" });
    }

    res.status(200).json(update);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

// @route :: Get
// @description :: user Profile
// @api :: /api/user/unfollow/:UserID

router.get(
  "/:username",
  isAuthenticatedUser,

  async (req, res, next) => {
    // write your code here
    try {
      if (req.user.username === req.params.username) {
        const userDetails = await User.findOne({
          username: req.user.username,
        })
          .populate("createdAlbums", "albumName _id")
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
        console.log("yes this is someone profile profile");
        const userDetails = await User.findOne({
          username: req.params.username,
        }).select("-following");
        if (!userDetails) {
          res.status(404);
          throw new Error("No user");
        } else {
          res.status(200).send({
            username: userDetails.username,
            followers: userDetails.followersCount,
            following: userDetails.followingCount,
            createdAlbums: userDetails.createdAlbums,
            createdAlbums: userDetails.createdAlbumsCount,
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
      const user = req.queryuser;
      const followers = await user.followers;

      res.status(200).send({
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
      const user = req.queryuser;
      if (req.user.username == req.params.username) {
        const following = await user.following;

        res.status(200).send({
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

module.exports = router;
