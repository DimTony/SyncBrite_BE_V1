const { body } = require("express-validator");

const validateEventInput = [
  body("eventName").notEmpty().withMessage("Event name is required"),
  body("eventStartDate").notEmpty().withMessage("Event start date is required"),
  body("eventStartTime").notEmpty().withMessage("Event start time is required"),
  body("eventEndDate")
    .optional()
    .notEmpty()
    .withMessage("Event end date must not be empty"),
  body("eventEndTime")
    .optional()
    .notEmpty()
    .withMessage("Event end time must not be empty"),
  body("details").optional(),
  body("eventLocation").optional(),
  body("link").optional(),
  body("visibility").optional(),
  body("visibilityGroup").optional(),
  body("eventType").notEmpty().withMessage("Event type is required"),
  body("selectedGroups")
    .optional()
    .isArray()
    .withMessage("Selected groups must be an array"),
  body("coHostEmail")
    .optional()
    .isEmail()
    .withMessage("Invalid co-host email address"),
  body("repeatType").optional(),
  body("repeatEndDate").optional(),
  body("repeatEndTime").optional(),
  body("customDates")
    .optional()
    .isArray()
    .withMessage("Custom dates must be an array"),
];

module.exports = validateEventInput;
