const CustomError = require("../utils/customError");

const castErrorHandler = (err) => {
  const msg = `Invalid value for '${err.path}' : '${err.value}'!`;

  return new CustomError(400, msg);
};

const duplicateKeyErrorHandler = (err) => {
  const name = err.keyValue.name;
  const msg = `Object : ${name} already exists`;
  return new CustomError(400, msg);
};

const validationErrorHandler = (err) => {
  const errors = Object.values(err.errors).map((val) => val.message);
  const errorMessages = errors.join(". ");
  const msg = `Invalid input data: ${errorMessages}`;
  return new CustomError(400, msg);
};

const expiredJWTHandler = (err) => {
  return new CustomError(401, "Login Timed Out! Please Login Again...");
};

const JWTErrorHandler = (err) => {
  return new CustomError(401, "Invalid Authorization! Please Login Again...");
};

const devErrors = (res, error) => {
  res.status(error.statusCode).json({
    success: false,
    status: error.statusCode,
    message: error.message,
    stackTrace: error.stack,
    error: error,
  });
};

const prodErrors = (res, error) => {
  if (error.isOperational) {
    res.status(error.statusCode).json({
      success: false,
      status: error.statusCode,
      message: error.message,
    });
  } else {
    res.status(500).json({
      success: false,
      message: "Something went wrong! Please try again later",
    });
  }
};

module.exports = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";

  if (process.env.NODE_ENV === "development") {
    devErrors(res, error);
  } else if (process.env.NODE_ENV === "production") {
    if (error.name === "CastError") error = castErrorHandler(error);

    if (error.code === 11000) error = duplicateKeyErrorHandler(error);

    if (error.name === "ValidationError") error = validationErrorHandler(error);

    if (error.name === "TokenExpiredError") error = expiredJWTHandler(error);

    if (error.name === "JsonWebTokenError") error = JWTErrorHandler(error);

    prodErrors(res, error);
  }
};
