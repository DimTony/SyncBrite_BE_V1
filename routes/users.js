const router = require("express").Router();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const Token = require("../models/token");
const sendEmail = require("../utils/sendEmail");
const { User, validate } = require("../models/user");

router.post("/signup", async (req, res) => {
  try {
    const { error } = validate(req.body);

    if (error) {
      return res.status(400).send({
        message: error.details[0].message,
      });
    }

    let user = await User.findOne({
      email: req.body.email,
    });

    if (user) {
      return res.status(409).send({
        message: "User with given email already exists",
      });
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT));

    const passwordHash = await bcrypt.hash(req.body.password, salt);

    user = await new User({
      ...req.body,
      password: passwordHash,
    }).save();

    const token = await new Token({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex"),
    }).save();

    const url = `${process.env.BASE_URL}api/users/${user._id}/verify/${token.token}`;

    await sendEmail(user.email, "Verify Email", url);

    res.status(201).send({
      message: "An Email is sent to your account, please verify",
    });
  } catch (error) {
    res.status(500).send({
      message: "Internal Server Error",
    });
  }
});

router.get("/:id/verify/:token", async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
    });

    if (!user) {
      return res.status(400).send({
        message: "Invalid Link",
      });
    }

    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });

    if (!token) {
      return res.status(400).send({
        message: "Invalid Link",
      });
    }

    await User.updateOne({
      _id: user._id,
      verified: true,
    });

    const deleteToken = await Token.findOneAndDelete({
      userId: user._id,
      token: req.params.token,
    });

    if (!deleteToken) {
      return res.status(400).send({
        message: "Could Not Verify Token",
      });
    }

    res.status(200).send({
      message: "Email Verified Successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Internal Server Error",
    });
  }
});

module.exports = router;
