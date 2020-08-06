const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const middlewares = require("./middlewares/middlewares");

const app = express();
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    // eslint-disable-next-line comma-dangle
  })
);

mongoose.connect(
  process.env.MONGODB_URI,
  { useUnifiedTopology: true, useNewUrlParser: true },
  () => console.log("connected to mongoDB")
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send({ welcome: "welcome to supercluster it on heroku now" });
});

const authRoute = require("./api/routes/user/Authentication");
app.use("/api/user/auth", authRoute);

const userRoute = require("./api/routes/user/User");
app.use("/api/user", userRoute);

const albumRoute = require("./api/routes/album/Album");
app.use("/albums", albumRoute);
const commentRoute = require("./api/routes/album/comment");
app.use("/albums/c", commentRoute);

const uploadPhotoRoute = require("./api/routes/album/AlbumPhotos");
app.use("/photos", uploadPhotoRoute);

const adminRoute = require("./api/routes/admin/Admin");
app.use("/admin", adminRoute);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

const port = process.env.PORT || 3333;
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});

//npm run dev
