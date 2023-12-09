const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const authTokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 30 * 86400,
    },
  },
  { versionKey: false }
);

const AuthToken = mongoose.model("authTokens", authTokenSchema);

module.exports = AuthToken;
