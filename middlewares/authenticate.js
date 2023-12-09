const jwt = require("jsonwebtoken");
const util = require("util");
const { Attendee } = require("../models/attendee");
const { Organizer } = require("../models/organizer");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const CustomError = require("../utils/customError");

const isAuthenticated = asyncErrorHandler(async (req, res, next) => {
  // Read the token & check if it exists
  const testToken = req.headers.authorization;

  let token;

  if (testToken && testToken.startsWith("Bearer")) {
    token = testToken.split(" ")[1];
  }

  if (!token) {
    next(new CustomError(401, "You Are Unauthorized!"));
  }

  // validate the token
  const decodedToken = await util.promisify(jwt.verify)(
    token,
    process.env.JWT_ACCESS_SECRET
  );

  // Check if attendee exists
  const attendee = await Attendee.findById(decodedToken.id);

  if (!attendee) {
    const organizer = await Organizer.findById(decodedToken.id);

    if (!organizer) {
      const error = new CustomError(401, "User with the token does not exist");
      next(error);
    }

    const isPasswordChanged = await organizer.isPasswordChanged(
      decodedToken.iat
    );

    // Check if the password changed after login
    if (isPasswordChanged) {
      const error = new CustomError(
        401,
        "Password Was Changed Recently! Please Login Again"
      );
      return next(error);
    }

    req.user = {
      id: organizer._id,
      email: organizer.email,
      role: organizer.role,
    };
    next();
  }

  const isPasswordChanged = await attendee.isPasswordChanged(decodedToken.iat);

  // Check if the password changed after login
  if (isPasswordChanged) {
    const error = new CustomError(
      401,
      "Password Was Changed Recently! Please Login Again"
    );
    return next(error);
  }
  // allow access to route
  req.user = {
    id: attendee._id,
    firstName: attendee.firstName,
    lastName: attendee.lastName,
    fullName: attendee.fullName,
    userName: attendee.userName,
    email: attendee.email,
    role: attendee.role,
    profilePic: attendee.profilePic,
    dateOfBirth: attendee.dateOfBirth,
    location: attendee.location,
    bio: attendee.bio,
    coverPic: attendee.coverPic,
    interests: attendee.interests,
    pronouns: attendee.pronouns,
    socialLinks: attendee.socialLinks,
    verified: attendee.verified,
  };
  next();
});

module.exports = isAuthenticated;
