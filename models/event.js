const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const eventSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    eventName: {
      type: String,
      required: true,
    },
    eventStartDate: {
      type: String,
      required: true,
    },
    eventStartTime: {
      type: String,
      required: true,
    },
    eventEndDate: {
      type: String,
    },
    eventEndTime: {
      type: String,
    },
    details: {
      type: String,
    },
    eventLocation: {
      type: String,
    },
    link: {
      type: String,
    },
    visibility: {
      type: String,
      enum: ["Public", "Private", "Friends", "Group"],
      default: "Public",
    },
    visibilityGroup: {
      type: String,
    },
    eventType: {
      type: String,
      enum: ["inPerson", "virtual"],
      required: true,
    },
    selectedGroups: {
      type: [String],
      default: [],
    },
    host: {
      type: String,
    },
    coHostEmail: {
      type: String,
      lowercase: true,
    },
    repeatType: {
      type: String,
      enum: ["daily", "weekly", "custom", "never"],
      default: "never",
    },
    repeatDate: {
      type: String,
    },
    repeatTime: {
      type: String,
    },
    customDates: {
      type: [String],
      default: [],
    },
    bannerImage: {
      type: String,
    },
    going: {
      type: Number,
      default: 1,
    },
    interested: {
      type: Number,
      default: 0,
    },
    cantGo: {
      type: Number,
      default: 0,
    },
    likes: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "attendees",
          required: true,
        },
        userType: {
          type: String,
          enum: ["attendee", "organizer"],
          required: true,
        },
      },
    ],

    comments: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

eventSchema.index(
  { "likes.user": 1, "likes.userType": 1 },
  { unique: true, sparse: true }
);
eventSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Event = mongoose.model("events", eventSchema);

module.exports = { Event };
