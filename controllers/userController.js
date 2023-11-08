const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { User } = require("../models/user");
const SignupToken = require("../models/signupToken");
const {
  userValidation,
  emailValidation,
  passwordValidation,
} = require("../utils/validationSchema");
const sendEmail = require("../utils/sendEmail");
const CustomError = require("../utils/customError");
const asyncErrorHandler = require("../utils/asyncErrorHandler");

const tester = asyncErrorHandler(async (req, res, next) => {
  const movie = await User.create(req.body);

  res.status(201).json({
    success: true,
    data: {
      movie,
    },
  });
});

const signupUser = asyncErrorHandler(async (req, res, next) => {
  const { error } = userValidation(req.body);

  if (error) {
    return res.status(400).send({
      message: error.details[0].message,
    });
  }

  let user = await User.findOne({
    email: req.body.email,
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

  user = await new User({
    ...req.body,
    password: passwordHash,
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

const sendResetPasswordLink = asyncErrorHandler(async (req, res, next) => {
  const { error } = emailValidation(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  let user = await User.findOne({
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
  const user = await User.findOne({
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

const verifyUser = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findOne({
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

  const newUser = await User.findByIdAndUpdate(user._id, { verified: true });

  const deleteToken = await SignupToken.findOneAndDelete({
    userId: user._id,
    token: req.params.token,
  });

  if (!deleteToken) {
    const error = new CustomError(404, "Could Not Verify Token");
    return next(error);
  }

  const verifiedUser = await User.findById(req.params.id);

  res.status(200).send({
    message: "Email Verified Successfully",
    data: verifiedUser,
  });
});

const resetPassword = asyncErrorHandler(async (req, res, next) => {
  const { error } = passwordValidation(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const user = await User.findOne({
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

  await user.save();

  await token.deleteOne();

  res.status(200).json({
    success: true,
    message: "Password Reset Successfully",
  });
});

module.exports = {
  signupUser,
  verifyUser,
  sendResetPasswordLink,
  verifyResetPasswordLink,
  resetPassword,
  tester,
};
