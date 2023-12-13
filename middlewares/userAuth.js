const jwt = require("jsonwebtoken");
const { Organizer } = require("../models/organizer");
const { Attendee } = require("../models/attendee");
const { Event } = require("../models/event");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const CustomError = require("../utils/customError");
const {
  deformatSingleDate,
  deformatCustomDates,
} = require("../utils/deformatDateTime");

const checkCookieUser = (req, res, next) => {
  const token = req.cookies.SyncBriteToken;

  if (token) {
    jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET,
      async (err, decodedToken) => {
        if (err) {
          const error = new CustomError(401, err);
          return next(error);
        } else {
          const organizer = await Organizer.findById(decodedToken.id);

          if (!organizer) {
            const attendee = await Attendee.findById(decodedToken.id);

            if (!attendee) {
              const err = new CustomError(400, "Invalid User");
              return next(err);
            } else {
              const user = {
                id: attendee._id.toString(),
                firstName: attendee.firstName,
                lastName: attendee.lastName,
                fullName: attendee.fullName,
                userName: attendee.userName,
                profilePic: attendee.profilePic,
                coverPic: attendee.coverPic,
                dateOfBirth: attendee.dateOfBirth,
                location: attendee.location,
                bio: attendee.bio,
                interests: attendee.interests,
                pronouns: attendee.pronouns,
                socialLinks: attendee.socialLinks,
                email: attendee.email,
                role: attendee.role,
                verified: attendee.verified,
                passwordChangedAt: attendee.passwordChangedAt,
                friends: attendee.friends,
                sentFriendRequests: attendee.sentFriendRequests,
                receivedFriendRequests: attendee.receivedFriendRequests,
                followers: attendee.followers,
                following: attendee.following,
              };
              return res.status(200).json({
                message: "User Verified Successfully",
                success: true,
                user: user,
              });
            }
          }

          // Destructure organizer

          return res.status(200).json({
            message: "User Verified Successfully",
            success: true,
            user: organizer,
          });
        }
      }
    );
  } else {
    const err = new CustomError(400, "User Unauthorized");
    return next(err);
  }
};

const verifyAuth = (req, res, next) => {
  const user = req.user;

  return res.status(200).json({
    message: "User Verified Successfully",
    success: true,
    user: user,
  });
};

const checkAuthUser = (req, res, next) => {
  const receivedToken = req.body.headers.Authorization;

  let token;

  if (receivedToken && receivedToken.startsWith("Bearer")) {
    token = receivedToken.split(" ")[1];
  }

  if (token) {
    jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET,
      async (err, decodedToken) => {
        if (err) {
          const error = new CustomError(401, err);
          return next(error);
        } else {
          const organizer = await Organizer.findById(decodedToken.id);

          if (!organizer) {
            const attendee = await Attendee.findById(decodedToken.id);

            if (!attendee) {
              const err = new CustomError(400, "Invalid User");
              return next(err);
            } else {
              const user = {
                id: attendee._id.toString(),
                firstName: attendee.firstName,
                lastName: attendee.lastName,
                fullName: attendee.fullName,
                userName: attendee.userName,
                profilePic: attendee.profilePic,
                coverPic: attendee.coverPic,
                dateOfBirth: attendee.dateOfBirth,
                location: attendee.location,
                bio: attendee.bio,
                interests: attendee.interests,
                pronouns: attendee.pronouns,
                socialLinks: attendee.socialLinks,
                email: attendee.email,
                role: attendee.role,
                verified: attendee.verified,
                passwordChangedAt: attendee.passwordChangedAt,
                friends: attendee.friends,
                sentFriendRequests: attendee.sentFriendRequests,
                receivedFriendRequests: attendee.receivedFriendRequests,
                followers: attendee.followers,
                following: attendee.following,
              };
              return res.status(200).json({
                message: "User Verified Successfully",
                success: true,
                user: user,
              });
            }
          }

          // const {id, firstName, lastName, fullName, userName, profilePic, coverPic, dateOfBirth, location, bio, interests, pronouns, socialLinks, email, role, verified} =

          return res.status(200).json({
            message: "User Verified Successfully",
            success: true,
            user: organizer,
          });
        }
      }
    );
  } else {
    const err = new CustomError(400, "User Unauthorized");
    return next(err);
  }
};

const checkEventAuthUser = (req, res, next) => {
  const receivedToken = req.body.headers.Authorization;

  let token;

  if (receivedToken && receivedToken.startsWith("Bearer")) {
    token = receivedToken.split(" ")[1];
  }

  if (token) {
    jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET,
      async (err, decodedToken) => {
        if (err) {
          const error = new CustomError(401, err);
          return next(error);
        } else {
          const organizer = await Organizer.findById(decodedToken.id);

          if (!organizer) {
            const attendee = await Attendee.findById(decodedToken.id);

            if (!attendee) {
              const err = new CustomError(400, "Invalid User");
              return next(err);
            } else {
              const user = {
                id: attendee._id.toString(),
                firstName: attendee.firstName,
                lastName: attendee.lastName,
                fullName: attendee.fullName,
                userName: attendee.userName,
                profilePic: attendee.profilePic,
                coverPic: attendee.coverPic,
                dateOfBirth: attendee.dateOfBirth,
                location: attendee.location,
                bio: attendee.bio,
                interests: attendee.interests,
                pronouns: attendee.pronouns,
                socialLinks: attendee.socialLinks,
                email: attendee.email,
                role: attendee.role,
                verified: attendee.verified,
              };

              const events = await Event.find({ userId: decodedToken.id });

              events.eventStartDate = deformatSingleDate(events.eventStartDate);
              events.eventEndDate = deformatSingleDate(events.eventEndDate);
              events.repeatDate = deformatSingleDate(events.repeatDate);
              events.customDates = deformatCustomDates(events.customDates);

              return res.status(200).json({
                message: "User Verified Successfully",
                success: true,
                user: user,
                events,
              });
            }
          }

          const events = await Event.find({ userId: decodedToken.id });

          // const {id, firstName, lastName, fullName, userName, profilePic, coverPic, dateOfBirth, location, bio, interests, pronouns, socialLinks, email, role, verified} =

          return res.status(200).json({
            message: "User Verified Successfully",
            success: true,
            user: organizer,
            events,
          });
        }
      }
    );
  } else {
    const err = new CustomError(400, "User Unauthorized");
    return next(err);
  }
};

module.exports = {
  checkCookieUser,
  verifyAuth,
  checkAuthUser,
  checkEventAuthUser,
};
