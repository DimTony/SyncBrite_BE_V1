const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { Attendee } = require("../models/attendee");
const { Organizer } = require("../models/organizer");
const crypto = require("crypto");
const SignupToken = require("../models/signupToken");
const authenticateLoginUser = require("../utils/loginAuthenticate");
const sendEmail = require("../utils/sendEmail");
const generateTokens = require("../utils/generateTokens");
const { loginBodyValidation } = require("../utils/validationSchema");
const CustomError = require("../utils/customError");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const handleErrors = require("../utils/handleErrors");
const { maxAge, expireAge, createToken } = require("../utils/createToken");

const loginUser = asyncErrorHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const { error } = loginBodyValidation({ email, password });

  if (error) {
    const err = new CustomError(400, error.details[0].message);

    return next(err);
  }

  const authResult = await authenticateLoginUser(email, password);

  if (!authResult.success) {
    const err = new CustomError(401, "Invalid Email or Password");
    return next(err);
  }

  const user = authResult.user;

  if (user.verified) {
    const authToken = await generateTokens(user);

    const { accessToken } = authToken;

    res.status(200).json({
      success: true,
      message: "Logged In Successfully",
      data: {
        accessToken: accessToken,
        user: user,
      },
    });
  } else {
    let token = await SignupToken.findOne({
      userId: user.id,
    });

    if (!token) {
      token = await new SignupToken({
        userId: user.id,
        token: crypto.randomBytes(32).toString("hex"),
      }).save();
    }

    const url = `${process.env.BASE_URL}api/users/${user.id}/verify/${token.token}`;

    await sendEmail(user.email, "Verify Email", url);

    res.status(401).json({
      success: false,
      message: "Account not verified. A verification email has been sent.",
    });
  }
});

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
    fullName: verifiedUser.fullName,
    userName: verifiedUser.userName,
    profilePic: verifiedUser.profilePic,
    coverPic: verifiedUser.coverPic,
    dateOfBirth: verifiedUser.dateOfBirth,
    location: verifiedUser.location,
    bio: verifiedUser.bio,
    interests: verifiedUser.interests,
    pronouns: verifiedUser.pronouns,
    socialLinks: verifiedUser.socialLinks,
    email: verifiedUser.email,
    role: verifiedUser.role,
    verified: verifiedUser.verified,
  };

  return res.status(200).json({
    success: true,
    message: "User Authorized Successfully",
    data: {
      token: receivedToken,
      user,
    },
  });
});

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await Organizer.login({ email, password });

    const token = createToken(user._id);

    res.cookie("jwt", token, {
      withCredentials: true,
      httpOnly: false,
      maxAge: maxAge * 1000,
    });

    res.status(200).json({
      success: true,
      user: user._id,
    });
  } catch (err) {
    console.log(err);
    const errors = handleErrors(err);
    res.json({ success: false, errors });
  }
};

const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await Organizer.create({ email, password });

    const token = createToken(user._id);

    res.cookie("jwt", token, {
      withCredentials: true,
      httpOnly: false,
      maxAge: maxAge * 1000,
    });

    res.status(201).json({
      success: true,
      user: user._id,
    });
  } catch (err) {
    console.log(err);
    const errors = handleErrors(err);
    res.json({ success: false, errors });
  }
};

const logout = async (req, res, next) => {
  res
    .cookie("SyncBriteToken", "none", {
      withCredentials: true,
      httpOnly: false,
      maxAge: expireAge,
    })
    .status(200)
    .json({
      success: true,
      message: "User logged out successfully",
      data: {
        accessToken: "none",
      },
    });
};

const keepAlive = async (req, res) => {
  console.log("Server is alive");
  res.status(200).json({ message: "Server is alive" });
};

module.exports = { loginUser, verifyToken, login, register, logout, keepAlive };
