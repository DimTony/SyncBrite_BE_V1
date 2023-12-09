const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const organizerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  role: {
    type: String,
    enum: ["attendee", "organizer", "admin"],
    default: "organizer",
  },
});

organizerSchema.methods.isPasswordChanged = async function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const pswdChangedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < pswdChangedTimestamp;
  }
  return false;
};

organizerSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

organizerSchema.statics.login = async function ({ email, password }) {
  const organizer = await this.findOne({ email });

  if (organizer) {
    const auth = await bcrypt.compare(password, organizer.password);
    if (auth) {
      return organizer;
    }
    throw Error("Invalid Password");
  }
  throw Error("Invalid Email");
};

const Organizer = mongoose.model("Organizers", organizerSchema);

module.exports = { Organizer };
