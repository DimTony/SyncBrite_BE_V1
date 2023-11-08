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
};
