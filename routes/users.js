const router = require("express").Router();
const { User } = require("../models/user");
const SignupToken = require("../models/signupToken");
const {
  signupUser,
  verifyUser,
  tester,
} = require("../controllers/userController");

router.post("/test", tester);

router.post("/signup", signupUser);

router.get("/:id/verify/:token", verifyUser);

module.exports = router;
