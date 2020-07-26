/* eslint-disable comma-dangle */
const express = require("express");

const router = express.Router();
const { genSaltSync, hashSync, compare } = require("bcryptjs");
const { verify } = require("jsonwebtoken");

const User = require("../../../models/User");
const UserProfile = require("../../../models/userProfile");
const UserStats = require("../../../models/userStats");

const { signupValidation, loginValidation } = require("./signupValidation");
const {
  generateAccessToken,
  generateRefreshToken,
  sendAccessToken,
  sendRefreshToken,
} = require("./tokenValidation");

const isAuthenticatedUser = require("../../../middlewares/isAuthenticatedUser");

router.get("/", isAuthenticatedUser, (req, res) => {
  res.send({ Login: "Seccess", username: req.user.name });
});

// @route :: POST
// @description :: Signup a new User
// @api :: api/user/signup
// @website ::  Website Url

router.post("/signup", async (req, res, next) => {
  // check signup body is not valid data ? send to error hangle : else
  const { error } = signupValidation(req.body);
  if (error) {
    res.status(422);
    next(error);
  } else {
    // check emial exits on database ? forword : send error
    const checkEmail = await User.findOne({ email: req.body.email });
    if (checkEmail) return res.status(400).send("Email already exists");

    // create salt or hash password for password
    const salt = await genSaltSync(10);
    const hashPassword = await hashSync(req.body.password, salt);

    // create new user

    const user = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashPassword,
    });
    const profile = new UserProfile({
      parentUser: user,
    });
    const stats = new UserStats({
      parentUser: user,
    });

    user.profile = profile;
    user.stats = stats;

    try {
      const newUser = await user.save();
      await profile.save();
      await stats.save();

      res.send({
        Username: newUser.username,
        Email: newUser.email,
      });
    } catch (err) {
      res.status(400).json(err);
    }
  }
});

// @route :: POST
// @description :: Login an User
// @api :: api/user/login
// @website ::  Website Url

router.post("/login", async (req, res, next) => {
  // validating request body
  const { error } = loginValidation(req.body);
  if (error) {
    res.status(422);
    next(error);
  } else {
    // check email corrent
    const user = await User.findOne({
      $or: [{ email: req.body.email }, { username: req.body.username }],
    }).select("+password");
    if (!user) return res.status(400).send("Email Does Not Match");

    // password match
    const validPass = await compare(req.body.password, user.password);
    if (!validPass) return res.status(400).send("Password Does Not Match");

    // 3. Create Refresh and Accesstoken
    const accesstoken = generateAccessToken(user);
    const refreshtoken = generateRefreshToken(user);

    user.refreshToken = refreshtoken;

    await user.save();

    sendRefreshToken(res, refreshtoken);
    sendAccessToken(res, req, accesstoken);
  }
});

// @route :: POST
// @description :: Genarate A accesstion by using refresh Token
// @api :: api/user/refreshtoekn
// @website ::  Website Url

router.post("/refreshtoken", async (req, res) => {
  // check cookies has token ? verify token : send error
  const token = req.cookies.refreshtoken;
  if (!token) return res.send({ message: " token does not exist" });

  let payload = null;
  try {
    payload = await verify(token, process.env.REFRESH_TOKEN);
  } catch (err) {
    return res.send({ accesstoken: "y" });
  }

  // check sender(user) is exist in bd ? grab user : send error
  // eslint-disable-next-line no-underscore-dangle
  const user = await User.findOne({ _id: payload._id });
  if (!user) return res.status(400).send({ message: "user does not exist" });

  // check user has the refesh token ? send new token ? send error
  if (user.refreshToken !== token) {
    return res.send({ message: " user does not has any refreshtoken" });
  }

  // token exist, create new Refresh- and accesstoken
  const accesstoken = generateAccessToken(user);
  const refreshtoken = generateRefreshToken(user);

  // update refreshtoken on user in db
  // Could have different versions instead!
  user.refreshToken = refreshtoken;
  await user.save();

  sendRefreshToken(res, refreshtoken);
  return res.send({ accesstoken });
});

// @route :: POST
// @description :: Loing out an User
// @api :: api/user/logout
// @website ::  Website Url
router.post("/logout", isAuthenticatedUser, async (req, res) => {
  res.clearCookie("refreshtoken", { path: "/api/user/auth/refreshtoken" });

  // eslint-disable-next-line no-underscore-dangle
  const user = await User.findOne({ _id: req.user._id });
  if (!user) return res.status(400).send("Email Does Not Match");

  user.refreshToken = "";
  await user.save();

  return res.send({
    message: "Logged out",
  });
});

module.exports = router;
