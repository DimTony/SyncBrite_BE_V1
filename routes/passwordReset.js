const router = require("express").Router();
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const sendEmail = require("../utils/sendEmail");
const SignupToken = require("../models/signupToken");
const { User } = require("../models/user");
const {
  passwordValidation,
  emailValidation,
} = require("../utils/validationSchema");
const {
  sendResetPasswordLink,
  verifyResetPasswordLink,
  resetPassword,
} = require("../controllers/userController");

router.post("/", sendResetPasswordLink);

router.get("/:id/:token", verifyResetPasswordLink);

router.post("/:id/:token", resetPassword);

module.exports = router;
