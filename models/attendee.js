const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const attendeeSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
    },
    userName: {
      type: String,
      lowercase: true,
      unique: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      enum: ["attendee", "organizer", "admin"],
      default: "attendee",
    },
    verified: {
      type: Boolean,
      default: false,
    },
    profilePic: {
      type: String,
    },
    passwordChangedAt: {
      type: Date,
    },
    dateOfBirth: {
      type: Date,
    },
    location: {
      type: String,
    },
    bio: {
      type: String,
    },
    coverPic: {
      type: String,
    },
    interests: {
      type: [String],
    },
    pronouns: {
      type: String,
    },
    socialLinks: {
      facebook: {
        type: String,
      },
      twitter: {
        type: String,
      },
      instagram: {
        type: String,
      },
      linkedin: {
        type: String,
      },
      other: {
        type: String,
      },
    },
  },
  { versionKey: false, strictQuery: false }
);

attendeeSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, process.env.JWTPRIVATEKEY, {
    expiresIn: "7d",
  });
  return token;
};

attendeeSchema.methods.isPasswordChanged = async function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const pswdChangedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < pswdChangedTimestamp;
  }
  return false;
};

const Attendee = mongoose.model("attendees", attendeeSchema);

module.exports = { Attendee };
