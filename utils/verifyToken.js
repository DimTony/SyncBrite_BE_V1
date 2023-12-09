const jwt = require("jsonwebtoken");
const { Attendee } = require("../models/attendee");
const asyncErrorHandler = require("./asyncErrorHandler");

const verifyToken = asyncErrorHandler(async (req, res, next) => {
  const receivedToken = req.params.token;

  if (!receivedToken) {
    const err = new CustomError(404, "Token is required");
    return next(err);
  }

  const verifiedToken = jwt.verify(
    receivedToken,
    process.env.JWT_ACCESS_SECRET
  );

  const userId = verifiedToken.id;

  const verifiedUser = await Attendee.findOne({ _id: userId });

  if (!verifiedUser) {
    const err = new CustomError(401, "Unauthorized User");
    return next(err);
  }

  const user = {
    id: verifiedUser._id.toString(),
    firstName: verifiedUser.firstName,
    lastName: verifiedUser.lastName,
    email: verifiedUser.email,
    role: verifiedUser.role,
    verified: verifiedUser.verified,
  };

  return res.status(200).json({
    success: true,
    message: "Authorized User",
    data: {
      token: receivedToken,
      user,
    },
  });
});

module.exports = verifyToken;
