const express = require("express");
const router = express.Router();
const ObjectId = require("mongodb").ObjectID;

const User = require("../../../models/User");
const isAuthenticatedUser = require("../../../middlewares/isAuthenticatedUser");
const {
  CheckUserExists,
  CheckRole,
  AdminOnly,
} = require("../../../middlewares/userMiddleware");

router.get("/", isAuthenticatedUser, CheckRole, async (req, res, next) => {
  // write your code here
  try {
    if (req.admin) {
      res.status(200).send({ "welcome admin": req.admin });
    } else if (req.stuff) {
      res.status(200).send({ "welcome stuff": req.stuff });
    } else if (req.user) {
      res.status(200).send({ "welcome user": req.user });
    } else {
      throw new Error();
    }
  } catch (error) {
    res.status(404);
    next(error);
  }
});

router.get("/users", isAuthenticatedUser, AdminOnly, async (req, res, next) => {
  // write your code here
  try {
    const users = await User.find().exec();
    res.status(200).send(users);
  } catch (error) {
    res.status(404);
    next(error);
  }
});

module.exports = router;
