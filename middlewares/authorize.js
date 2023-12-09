const CustomError = require("../utils/customError");

const isAuthorized = (...role) => {
  return (req, res, next) => {
    if (!role.includes(req.user.role)) {
      const error = new CustomError(403, "Unauthorized For This Action");
      next(error);
    }
    next();
  };
};

module.exports = isAuthorized;
