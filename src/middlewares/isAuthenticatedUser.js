const { verify } = require("jsonwebtoken");

module.exports = (req, res, next) => {
  // const authorization = req.headers["authorization"];
  const { authorization } = req.headers;
  if (!authorization) return res.status(401).send("Access Denied");

  try {
    const token = authorization.split(" ")[1];
    const verified = verify(token, process.env.SECRET_TOKEN);
    req.user = verified;
    next();
  } catch (e) {
    res.status(400).send("Invalid token");
  }
};
