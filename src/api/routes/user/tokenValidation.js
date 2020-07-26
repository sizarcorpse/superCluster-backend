/* eslint-disable comma-dangle */
const { sign } = require("jsonwebtoken");

const generateAccessToken = (user) => {
  const token = sign(
    {
      _id: user.id,
      username: user.username,
      role: user.role,
      profilePhoto: user.profilePhoto,
    },
    process.env.SECRET_TOKEN,
    {
      expiresIn: "7d",
    }
  );
  return token;
};

const generateRefreshToken = (user) => {
  const token = sign(
    {
      _id: user.id,
      username: user.username,
      role: user.role,
      profilePhoto: user.profilePhoto,
    },
    process.env.REFRESH_TOKEN,
    {
      expiresIn: "7d",
    }
  );
  return token;
};

const sendAccessToken = (res, req, accesstoken) => {
  res.send({
    accesstoken,
  });
};

const sendRefreshToken = (res, token) => {
  res.cookie("refreshtoken", token, {
    httpOnly: true,
    maxAge: 160000,
    path: "/api/user/auth/refreshtoken",
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  sendAccessToken,
  sendRefreshToken,
};
