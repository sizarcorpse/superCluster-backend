// @description :: error handling middleware :: it only for Not Found Url
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
// @description :: general error handling middleware ::
// eslint-disable-next-line no-unused-vars
const errorHandler = (error, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  if (statusCode === 422 && error.name === "ValidationError") {
    res.json({
      error: error.name,
      message: error.message,
    });
  } else if (statusCode === 401) {
    res.json({
      error: error.name,
      message: "Unauthorized",
    });
  } else if (statusCode === 404 && error.name === "CastError") {
    res.json({
      error: error.name,
      errorPath: error.path,
      message: "invalid object id",
    });
  } else {
    res.json({
      error: error.name,
      message: error.message,
    });
  }
};

module.exports = {
  notFound,
  errorHandler,
};
