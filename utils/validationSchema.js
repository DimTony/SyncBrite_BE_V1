const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");

const signUpBodyValidation = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().required().label("First Name"),
    lastName: Joi.string().required().label("Last Name"),
    email: Joi.string().email().required().label("Email"),
    password: passwordComplexity().required().label("Password"),
  });
  return schema.validate(data);
};

const loginBodyValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().label("Email"),
    password: Joi.string().required().label("Password"),
  });

  return schema.validate(data);
};

const refreshTokenBodyValidation = (data) => {
  const schema = Joi.object({
    refreshToken: Joi.string().required().label("Refresh Token"),
  });

  return schema.validate(data);
};

const passwordValidation = (data) => {
  const schema = Joi.object({
    password: passwordComplexity().required().label("Password"),
  });

  return schema.validate(data);
};

const emailValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().label("Email"),
  });

  return schema.validate(data);
};

const userValidation = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().required().label("First Name"),
    lastName: Joi.string().required().label("Last Name"),
    email: Joi.string().email().required().label("Email"),
    password: passwordComplexity().required().label("Password"),
    confirmPassword: passwordComplexity().required().label("ConfirmPassword"),
    passwordChangedAt: Joi.date().label("passowrdChanged"),
    role: Joi.string().label("Role"),
  });
  return schema.validate(data);
};

const eventValidation = (data) => {
  const linkValue = data.link === "" ? null : data.link;

  const isValidDate = (date) => {
    return (
      date === null ||
      (new Date(date) instanceof Date && !isNaN(new Date(date)))
    );
  };

  const customDateValidation = Joi.custom((value, helpers) => {
    if (!isValidDate(value)) {
      return helpers.error("any.invalid");
    }
    return value;
  });

  const schema = Joi.object({
    eventName: Joi.string().required().label("Event Name"),
    eventStartDate: Joi.date().required().label("Event Start Date"),
    eventStartTime: Joi.string().required().label("Event Start Time"),
    eventEndDate: customDateValidation
      .label("Event End Date")
      .allow(null)
      .optional(),
    eventEndTime: Joi.string().allow(null).optional().label("Event End Time"),
    details: Joi.string().allow(null).optional().label("Event Details"),
    eventLocation: Joi.string().allow(null).optional().label("Event Location"),
    link: Joi.string()
      .allow(null)
      .optional()
      .label("Event Link")
      .valid(linkValue), // Perform manual check
    visibility: Joi.string().allow(null).optional().label("Event Visibility"),
    visibilityGroup: Joi.string()
      .allow(null)
      .optional()
      .label("Event Visibility Groups"),
    eventType: Joi.string().required().label("Event Link"),
    selectedGroups: Joi.array()
      .allow(null)
      .items(Joi.string())
      .optional()
      .label("Selected Visibility Groups"),
    coHostEmail: Joi.string()
      .allow(null)
      .optional()
      .email()
      .label("Event Co-Host"),
    repeatType: Joi.string().allow(null).optional().label("Event Repeat Type"),
    repeatEndDate: Joi.string()
      .allow(null)
      .optional()
      .label("Event Repeat End Date"),
    repeatEndTime: Joi.string()
      .allow(null)
      .optional()
      .label("Event Repeat End Time"),
    customDates: Joi.array()
      .allow(null)
      .items(Joi.date())
      .optional()
      .label("Event Custom Dates"),
  });

  return schema.validate(data);
};

module.exports = {
  signUpBodyValidation,
  loginBodyValidation,
  refreshTokenBodyValidation,
  passwordValidation,
  emailValidation,
  userValidation,
  eventValidation,
};
