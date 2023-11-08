const jwt = require("jsonwebtoken");
const AuthToken = require("../models/authToken");

const generateTokens = async (user) => {
  try {
    const payload = { _id: user._id, role: user.role };

    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: "14m",
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "30d",
    });

    const authToken = await AuthToken.findOne({
      userId: user._id,
    });

    if (authToken) {
      await AuthToken.findByIdAndDelete({
        userId: user._id,
      });
    }

    await new AuthToken({
      userId: user._id,
      token: refreshToken,
    }).save();

    return Promise.resolve({
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.log(error);
    return Promise.reject(error);
  }
};

module.exports = generateTokens;
