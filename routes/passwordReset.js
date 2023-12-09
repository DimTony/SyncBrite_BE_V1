const router = require("express").Router();
const {
  sendResetPasswordLink,
  verifyResetPasswordLink,
  resetPassword,
} = require("../controllers/userController");

router.post("/", sendResetPasswordLink);

router.get("/:id/:token", verifyResetPasswordLink);

router.post("/:id/:token", resetPassword);

module.exports = router;
