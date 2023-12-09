const bcrypt = require("bcrypt");
const { Attendee } = require("../models/attendee");
const { Organizer } = require("../models/organizer");

const authenticateLoginUser = async (email, password) => {
  try {
    const attendee = await Attendee.findOne({ email });

    if (!attendee) {
      const organizer = await Organizer.findOne({ email });

      if (!organizer) {
        return {
          success: false,
          message: "Invalid Email or Password",
        };
      }
      const isPasswordValid = await bcrypt.compare(
        password,
        organizer.password
      );

      if (!isPasswordValid) {
        return {
          success: false,
          message: "Invalid Email or Password",
        };
      }

      const user = {
        id: organizer._id.toString(),
        email: organizer.email,
        role: organizer.role,
      };

      return {
        success: true,
        user,
      };
    }

    const isPasswordValid = await bcrypt.compare(password, attendee.password);

    if (!isPasswordValid) {
      return {
        success: false,
        message: "Invalid Email or Password",
      };
    }

    const user = {
      id: attendee._id.toString(),
      firstName: attendee.firstName,
      lastName: attendee.lastName,
      fullName: attendee.fullName,
      userName: attendee.userName,
      email: attendee.email,
      role: attendee.role,
      profilePic: attendee.profilePic,
      dateOfBirth: attendee.dateOfBirth,
      location: attendee.location,
      bio: attendee.bio,
      coverPic: attendee.coverPic,
      interests: attendee.interests,
      pronouns: attendee.pronouns,
      socialLinks: attendee.socialLinks,
      verified: attendee.verified,
    };

    return {
      success: true,
      user,
    };
  } catch (error) {
    return {
      success: false,
      message: "Internal Server Error",
    };
  }
};

module.exports = authenticateLoginUser;
