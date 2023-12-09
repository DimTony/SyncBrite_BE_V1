const jwt = require("jsonwebtoken");

const maxAge = 3 * 24 * 60 * 60;
const expireAge = new Date(Date.now() + 5 * 1000);

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, { expiresIn: maxAge });
};

module.exports = { maxAge, expireAge, createToken };
