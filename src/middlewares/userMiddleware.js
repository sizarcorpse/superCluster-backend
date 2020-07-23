const User = require("../models/User");

module.exports = {
  CheckUserExists: async (req, res, next) => {
    try {
      const queryUser = await User.findOne({
        username: req.params.username,
      })
        .populate("followers", "_id username")
        .populate("following", "_id username")
        .exec();
      if (!queryUser) {
        res.status(404);
        throw new Error("No User");
      } else {
        req.queryuser = queryUser;
        next();
      }
    } catch (error) {
      res.status(404);
      next(error);
    }
  },

  CheckRole: async (req, res, next) => {
    try {
      if (req.user.role === "admin") {
        req.admin = req.user;
        next();
      } else if (req.user.role === "stuff") {
        req.stuff = req.user;
        next();
      } else if (req.user.role === "rookie") {
        req.user = req.user;
        next();
      } else {
        throw new Error();
      }
    } catch (error) {
      res.status(401);
      next(error);
    }
  },
};
