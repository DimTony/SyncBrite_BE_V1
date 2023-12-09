const jwt = require("jsonwebtoken");
const AuthToken = require("../models/authToken");

const generateTokens = async (user) => {
  try {
    const payload = {
      id: user.id.toString(),
      role: user.role,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: "1h",
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "30d",
    });

    const authToken = await AuthToken.findOne({
      userId: user.id,
    });

    if (authToken) {
      await AuthToken.findOneAndDelete({
        userId: user.id,
      });
    }

    await new AuthToken({
      userId: user.id,
      token: refreshToken,
    }).save();

    return Promise.resolve({
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.log("here:", error);
    return Promise.reject(error);
  }
};

module.exports = generateTokens;
