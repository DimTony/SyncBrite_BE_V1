const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { Attendee } = require("../models/attendee");
const SignupToken = require("../models/signupToken");
const {
  userValidation,
  emailValidation,
  passwordValidation,
} = require("../utils/validationSchema");
const sendEmail = require("../utils/sendEmail");
const userNameSlugify = require("../utils/userNameSlugify");
const fullNameSlugify = require("../utils/fullNameSlugify");
const CustomError = require("../utils/customError");
const asyncErrorHandler = require("../utils/asyncErrorHandler");

const tester = asyncErrorHandler(async (req, res, next) => {
  const user = await Attendee.findOne({
    _id: req.user.id,
  }).select("firstName lastName email role profilePic");

  return res.status(201).json({
    success: true,
    user,
  });
});

const signupUser = asyncErrorHandler(async (req, res, next) => {
  const { error } = userValidation(req.body);

  if (error) {
    const err = new CustomError(400, error.details[0].message);
    return next(err);
  }

  const { firstName, lastName, email } = req.body;
  const emailLowerCase = email.toLowerCase();

  let user = await Attendee.findOne({
    email: emailLowerCase,
  });

  if (user) {
    if (user.verified) {
      return res.status(409).send({
        message: "User with the given email already exists",
      });
    }

    const existingToken = await SignupToken.findOne({ userId: user._id });

    if (existingToken) {
      const url = `${process.env.BASE_URL}api/users/${user._id}/verify/${existingToken.token}`;
      await sendEmail(user.email, "Verify Email", url);

      return res.status(200).send({
        message: "Verification email sent again. Please check your inbox.",
      });
    }
  }

  const salt = await bcrypt.genSalt(Number(process.env.SALT));

  const passwordHash = await bcrypt.hash(req.body.password, salt);

  const userNameSlug = await userNameSlugify(firstName, lastName);
  const fullNameSlug = await fullNameSlugify(firstName, lastName);

  user = await new Attendee({
    ...req.body,
    email: emailLowerCase,
    password: passwordHash,
    userName: userNameSlug,
    fullName: fullNameSlug,
    profilePic:
      "https://res.cloudinary.com/dvvgaf1l9/image/upload/v1701036355/placeholder_bluals.png",
    dateOfBirth: "",
    location: "",
    bio: "",
    coverPic:
      "https://res.cloudinary.com/dvvgaf1l9/image/upload/v1701287110/cover-placeholder_depeg6.jpg",
    interests: [],
    pronouns: "",
    socialLinks: {},
  }).save();

  const token = await new SignupToken({
    userId: user._id,
    token: crypto.randomBytes(32).toString("hex"),
  }).save();

  const url = `${process.env.BASE_URL}api/users/${user._id}/verify/${token.token}`;

  await sendEmail(user.email, "Verify Email", url);

  res.status(201).send({
    message: "An Email is sent to your account, please verify",
  });
});

const verifyUser = asyncErrorHandler(async (req, res, next) => {
  const user = await Attendee.findOne({
    _id: req.params.id,
  });

  if (!user) {
    const error = new CustomError(404, "Invalid Link");
    return next(error);
  }

  const token = await SignupToken.findOne({
    userId: user._id,
    token: req.params.token,
  });

  if (!token) {
    const error = new CustomError(404, "Invalid Link");
    return next(error);
  }

  const newUser = await Attendee.findByIdAndUpdate(user._id, {
    verified: true,
  });

  const deleteToken = await SignupToken.findOneAndDelete({
    userId: user._id,
    token: req.params.token,
  });

  if (!deleteToken) {
    const error = new CustomError(404, "Could Not Verify Token");
    return next(error);
  }

  const verifiedUser = await Attendee.findById(req.params.id);

  res.status(200).send({
    message: "Email Verified Successfully",
    data: verifiedUser,
  });
});

const sendResetPasswordLink = asyncErrorHandler(async (req, res, next) => {
  const { error } = emailValidation(req.body);

  if (error) {
    const err = new CustomError(400, error.details[0].message);
    return next(err);
  }

  let user = await Attendee.findOne({
    email: req.body.email,
  });

  if (!user) {
    const error = new CustomError(
      404,
      "User with this email address does not exist"
    );
    return next(error);
  }

  let token = await SignupToken.findOne({
    userId: user._id,
  });

  if (!token) {
    token = await new SignupToken({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex"),
    }).save();
  }

  const url = `${process.env.BASE_URL}password-reset/${user._id}/${token.token}`;

  await sendEmail(user.email, "Password Reset", url);

  res.status(200).json({
    success: true,
    message: "Password reset link sent to your email",
  });
});

const verifyResetPasswordLink = asyncErrorHandler(async (req, res, next) => {
  const user = await Attendee.findOne({
    _id: req.params.id,
  });

  if (!user) {
    const error = new CustomError(404, "Invalid Link");
    return next(error);
  }

  const token = await SignupToken.findOne({
    userId: user._id,
    token: req.params.token,
  });

  if (!token) {
    const error = new CustomError(404, "Invalid Link");
    return next(error);
  }

  res.status(200).json({
    success: true,
    message: "Valid Password Reset Link",
  });
});

const resetPassword = asyncErrorHandler(async (req, res, next) => {
  const { error } = passwordValidation(req.body);

  if (error) {
    const err = new CustomError(400, error.details[0].message);
    return next(err);
  }

  const user = await Attendee.findOne({
    _id: req.params.id,
  });

  if (!user) {
    const error = new CustomError(404, "Invalid Link");
    return next(error);
  }

  const token = await SignupToken.findOne({
    userId: user._id,
    token: req.params.token,
  });

  if (!token) {
    const error = new CustomError(404, "Invalid Link");
    return next(error);
  }

  if (!user.verified) {
    user.verified = true;
  }

  const salt = await bcrypt.genSalt(Number(process.env.SALT));

  const passwordHash = await bcrypt.hash(req.body.password, salt);

  user.password = passwordHash;

  user.passwordChangedAt = Date.now();

  await user.save();

  await token.deleteOne();

  res.status(200).json({
    success: true,
    message: "Password Reset Successfully",
  });
});

const getUserByUsername = asyncErrorHandler(async (req, res, next) => {
  const username = req.params.username;

  const user = await Attendee.findOne({ userName: username });

  if (!user) {
    const err = new CustomError(404, "User Not Found");
    return next(err);
  }

  const userProfile = {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    userName: user.userName,
    email: user.email,
    role: user.role,
    profilePic: user.profilePic,
    dateOfBirth: user.dateOfBirth,
    location: user.location,
    bio: user.bio,
    coverPic: user.coverPic,
    interests: user.interests,
    pronouns: user.pronouns,
    socialLinks: user.socialLinks,
    verified: user.verified,
    passwordChangedAt: user.passwordChangedAt,
    friends: user.friends,
    sentFriendRequests: user.sentFriendRequests,
    receivedFriendRequests: user.receivedFriendRequests,
    followers: user.followers,
    following: user.following,
  };

  res.status(200).json({
    success: true,
    user: userProfile,
  });
});

module.exports = {
  signupUser,
  verifyUser,
  sendResetPasswordLink,
  verifyResetPasswordLink,
  resetPassword,
  getUserByUsername,
  tester,
};
