const crypto = require("crypto");
const SignupToken = require("../models/signupToken");
const authenticateLoginUser = require("../utils/loginAuthenticate");
const sendEmail = require("../utils/sendEmail");
const generateTokens = require("../utils/generateTokens");
const { loginBodyValidation } = require("../utils/validationSchema");

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { error } = loginBodyValidation({ email, password });

    if (error) {
      return res.status(400).send({
        success: false,
        message: error.details[0].message,
      });
    }

    const authResult = await authenticateLoginUser(email, password);

    if (!authResult.success) {
      return res.status(401).json({
        success: false,
        message: authResult.message,
      });
    }

    const { user } = authResult;

    if (user.verified) {
      const authToken = generateTokens(user);

      res.status(200).json({
        success: true,
        message: "Logged In Successfully",
      });
    } else {
      const token = await SignupToken.findOne({
        userId: user._id,
      });

      if (!token) {
        token = await new SignupToken({
          userId: user._id,
          token: crypto.randomBytes(32).toString("hex"),
        }).save();
      }

      const url = `${process.env.BASE_URL}api/users/${user._id}/verify/${token.token}`;

      await sendEmail(user.email, "Verify Email", url);

      res.status(401).json({
        success: false,
        message: "Account not verified. A verification email has been sent.",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = { loginUser };
