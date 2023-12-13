const { validationResult } = require("express-validator");
const { Attendee } = require("../models/attendee");
const { Event } = require("../models/event");
const { eventValidation } = require("../utils/validationSchema");
const { handleUpload } = require("../utils/uploadImage");
const { formatDate, formatTime } = require("../utils/formatDateTime");
const {
  deformatSingleDate,
  deformatCustomDates,
  deformatCreatedAt,
} = require("../utils/deformatDateTime");
const CustomError = require("../utils/customError");
const asyncErrorHandler = require("../utils/asyncErrorHandler");

const createEvent = asyncErrorHandler(async (req, res, next) => {
  if (req.body.repeatType === "") {
    req.body.repeatType = "never";
  }

  if (req.body.visibility === "") {
    req.body.visibility = "public";
  }

  if (req.body.eventType === "") {
    req.body.eventType = "inPerson";
  }

  const host = req.user.fullName;
  const customDates = req.body.customDates;

  if (customDates && customDates.trim() !== "") {
    req.body.customDates = await Promise.all(
      customDates.split(",").map(formatDate)
    );
  }

  const errors = validationResult(req.body);
  if (!errors.isEmpty()) {
    const err = new CustomError(400, errors.array());
    return next(err);
  }

  if (req.user) {
    const userId = req.user.id.toString();

    if (req.user.role === "attendee") {
      if (req.file) {
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

        try {
          const cldRes = await handleUpload(dataURI);

          const eventBannerUrl = cldRes.secure_url;

          const startDate = await formatDate(req.body.eventStartDate);
          const startTime = await formatTime(req.body.eventStartTime);
          const eventEndDate = await formatDate(req.body.eventEndDate);
          const eventEndTime = await formatTime(req.body.eventEndTime);
          const repeatDate = await formatDate(req.body.repeatDate);
          const repeatTime = await formatTime(req.body.repeatTime);

          const event = await new Event({
            ...req.body,
            userId: userId,
            host: host,
            eventStartDate: startDate,
            eventStartTime: startTime,
            eventEndDate: eventEndDate,
            eventEndTime: eventEndTime,
            repeatDate: repeatDate,
            repeatTime: repeatTime,
            bannerImage: eventBannerUrl,
          }).save();

          if (!event) {
            const err = new CustomError(400, "Error creating event!!!");
            return next(err);
          }
          // const updatedAttendee = await Attendee.findOneAndUpdate(
          //   { _id: userId },
          //   { $set: { role: "organizer" } },
          //   { new: true }
          // );

          res.status(201).json({
            success: true,
            event,
          });
        } catch (error) {
          console.error("Error uploading image to Cloudinary:", error);
          const err = new CustomError(500, "Internal Server Error");
          return next(err);
        }
      } else {
        try {
          const startDate = await formatDate(req.body.eventStartDate);
          const startTime = await formatTime(req.body.eventStartTime);
          const eventEndDate = await formatDate(req.body.eventEndDate);
          const eventEndTime = await formatTime(req.body.eventEndTime);
          const repeatDate = await formatDate(req.body.repeatDate);
          const repeatTime = await formatTime(req.body.repeatTime);

          const event = await new Event({
            ...req.body,
            userId: userId,
            host: host,
            eventStartDate: startDate,
            eventStartTime: startTime,
            eventEndDate: eventEndDate,
            eventEndTime: eventEndTime,
            repeatDate: repeatDate,
            repeatTime: repeatTime,
            bannerImage: "https://placehold.co/640x374",
          }).save();

          if (!event) {
            const err = new CustomError(404, "Error creating event!!!");
            return next(err);
          }

          res.status(201).json({
            success: true,
            event,
          });
        } catch (error) {
          console.error("Error Creating Event:", error);
          const err = new CustomError(500, "Internal Server Error");
          return next(err);
        }
      }
    } else if (req.user.role === "organizer") {
      if (req.file) {
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

        try {
          const cldRes = await handleUpload(dataURI);

          const eventBannerUrl = cldRes.secure_url;

          const event = await new Event({
            ...req.body,
            userId: userId,
            host: host,
            bannerImage: eventBannerUrl,
          }).save();

          if (!event) {
            const err = new CustomError(404, "Error creating event!!!");
            return next(err);
          }

          res.status(201).json({
            success: true,
            event,
          });
        } catch (error) {
          console.error("Error uploading image to Cloudinary:", error);
          const err = new CustomError(500, "Internal Server Error");
          return next(err);
        }
      } else {
        try {
          const event = await new Event({
            ...req.body,
            userId: userId,
            host: host,
            bannerImage: "https://placehold.co/640x374",
          }).save();

          if (!event) {
            const err = new CustomError(404, "Error creating event!!!");
            return next(err);
          }

          res.status(201).json({
            success: true,
            event,
          });
        } catch (error) {
          console.error("Error Creating Event:", error);
          const err = new CustomError(500, "Internal Server Error");
          return next(err);
        }
      }
    }
  } else {
    const err = new CustomError(404, "Authorized User Access Only");
    return next(err);
  }
});

const getAllTopEvents = asyncErrorHandler(async (req, res, next) => {
  const events = await Event.find({
    $or: [
      { visibility: { $ne: "Private" } },
      { $and: [{ visibility: "Private" }, { userId: req.user.id }] },
    ],
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    events,
    user: req.user,
  });
});

const getMainTopEvents = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user.id;

  // Fetch events where userId is equal to req.user._id
  const userEvents = await Event.find({ userId: userId })
    .sort({ createdAt: -1 })
    .exec();

  // Fetch events with visibility set to Public
  const publicEvents = await Event.find({
    visibility: "Public",
  })
    .sort({ createdAt: -1 })
    .exec();

  // Fetch events with visibility set to Friends or where userId is req.user._id
  const friendsEvents = await Event.find({
    visibility: "Friends",
    userId: { $in: req.user.friends }, // Include events where userId is req.user._id
  })
    .sort({ createdAt: -1 })
    .exec();

  // Fetch events with visibility set to Group or where selectedGroups include req.user.groups
  const groupsEvents = await Event.find({
    visibility: "Group",
    selectedGroups: { $in: req.user.groups },
  })
    .sort({ createdAt: -1 })
    .exec();

  // Combine all events
  const allEvents = [
    ...userEvents,
    ...publicEvents,
    ...friendsEvents,
    ...groupsEvents,
  ];

  // Use a Set to ensure unique events based on their IDs
  const uniqueEventIds = new Set(allEvents.map((event) => event._id));

  // Fetch the unique events based on their IDs
  const uniqueEvents = await Event.find({ _id: { $in: [...uniqueEventIds] } });

  // Sort unique events by createdAt field from the latest to the oldest
  const sortedEvents = uniqueEvents.sort((a, b) => b.createdAt - a.createdAt);

  res.status(200).json({
    success: true,
    sortedEvents,
  });
});
const getOwnEvents = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user.id.toString();

  const events = await Event.find({ userId });

  res.status(200).json({
    success: true,
    events,
    user: req.user,
  });
});

const getUserEventsByUsername = asyncErrorHandler(async (req, res, next) => {
  console.log(req.params);
});

const getSingleEvent = asyncErrorHandler(async (req, res, next) => {
  const user = req.user;
  const eventId = req.params.eventId;

  if (!eventId) {
    const error = new CustomError(400, "Event ID Required");
    return next(error);
  }

  const event = await Event.findById(eventId);

  if (!event) {
    const error = new CustomError(404, "Event Not Found");
    return next(error);
  }

  const singleEvent = {
    id: event._id,
    userId: event.userId,
    eventName: event.eventName,
    eventStartDate: deformatSingleDate(event.eventStartDate),
    eventStartTime: event.eventStartTime,
    eventEndDate: deformatSingleDate(event.eventEndDate),
    eventEndTIme: event.eventEndTime,
    details: event.details,
    eventLocation: event.eventLocation,
    link: event.link,
    visibility: event.visibility,
    selectedGroups: event.selectedGroups,
    eventType: event.eventType,
    host: event.host,
    coHostEmail: event.coHostEmail,
    repeatType: event.repeatType,
    repeatDate: deformatSingleDate(event.repeatDate),
    repeatTime: event.repeatTime,
    customDates: deformatCustomDates(event.customDates),
    bannerImage: event.bannerImage,
    going: event.going,
    interested: event.interested,
    cantGo: event.cantGo,
    likes: event.likes,
    comments: event.comments,
    shares: event.shares,
    createdAt: deformatCreatedAt(event.createdAt),
    updatedAt: deformatCreatedAt(event.updatedAt),
  };

  res.status(200).json({
    success: true,
    event: singleEvent,
    user,
  });
});

const likeEvent = asyncErrorHandler(async (req, res, next) => {
  const likeValue = req.body.value;
  const userId = req.user.id.toString();
  const role = req.user.role;
  const eventId = req.params.eventId;

  if (!likeValue || !role || !eventId) {
    const error = new CustomError(400, "PROVIDE REQUIRED CREDENTIALS!!!");
    return next(error);
  }

  const newLike = {
    user: userId,
    userType: role,
  };

  if (likeValue === "like") {
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { $push: { likes: newLike } },
      { new: true }
    );

    if (!updatedEvent) {
      const error = new CustomError(400, "FAILED TO UPDATE EVENT");
      return next(error);
    }

    res.status(200).json({
      success: true,
      likes: updatedEvent.likes,
    });
  } else if (likeValue === "unlike") {
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      {
        $pull: {
          likes: {
            user: userId,
            userType: role,
          },
        },
      },
      { new: true }
    );

    if (!updatedEvent) {
      const error = new CustomError(400, "FAILED TO UPDATE EVENT");
      return next(error);
    }

    res.status(200).json({
      success: true,
      likes: updatedEvent.likes,
    });
  } else {
    const error = new CustomError(400, "INVALID LIKE VALUE");
    return next(error);
  }
});

module.exports = {
  createEvent,
  getAllTopEvents,
  getOwnEvents,
  getUserEventsByUsername,
  getSingleEvent,
  likeEvent,
  getMainTopEvents,
};
