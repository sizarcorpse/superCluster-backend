const express = require("express");
const router = express.Router();
const ObjectId = require("mongodb").ObjectID;

const User = require("../../../models/User");
const isAuthenticatedUser = require("../../../middlewares/isAuthenticatedUser");
const {
  CheckUserExists,
  CheckRole,
} = require("../../../middlewares/userMiddleware");

router.get("/", isAuthenticatedUser, CheckRole, async (req, res, next) => {
  // write your code here
  try {
    if (req.admin) {
      res.status(200).send({ "welcome admin": req.admin });
    } else if (req.stuff) {
      res.status(200).send({ "welcome admin": req.stuff });
    } else {
      throw new Error();
    }
  } catch (error) {
    res.status(404);
    next(error);
  }
});

module.exports = router;
