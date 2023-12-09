const router = require("express").Router();
const {
  loginUser,
  verifyToken,
  login,
  register,
  logout,
} = require("../controllers/authController");
const { updateProfile } = require("../controllers/profileController");
const isAuthenticated = require("../middlewares/authenticate");
const {
  checkCookieUser,
  checkAuthUser,
  checkEventAuthUser,
} = require("../middlewares/userAuth");

router.post("/", loginUser);
router.post("/verify/:token", verifyToken);

router.post("/verify-cookie", checkCookieUser);
router.post("/verify-auth", checkAuthUser);
router.post("/verify-event-auth", checkEventAuthUser);
router.post("/login", login);
router.post("/logout", logout);
router.post("/register", register);

router.patch("/update-profile", isAuthenticated, updateProfile);

module.exports = router;
