const handleErrors = (err) => {
  let errors = { email: "", password: "" };

  if (err.message === "Invalid Email") {
    errors.email = "Email not registered";
  }

  if (err.message === "Invalid Password") {
    errors.email = "Password is incorrect";
  }

  if (err.code === 11000) {
    errors.email = "Email is already registered";
    return errors;
  }

  if (err.message.includes("Organizers validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }

  return errors;
};

module.exports = handleErrors;
