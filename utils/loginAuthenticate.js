const bcrypt = require("bcrypt");
const { User } = require("../models/user");

const authenticateLoginUser = async (email, password) => {
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return {
        success: false,
        message: "Invalid Email or Password",
      };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return {
        success: false,
        message: "Invalid Email or Password",
      };
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "Internal Server Error",
    };
  }
};

module.exports = authenticateLoginUser;
