const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const {
  getUserProfile,
  getSingleProfile,
  updateProfile,
  updateCoverPic,
  updater,
  handler,
  updateProfilePic,
} = require("../controllers/profileController");
const {
  signupUser,
  verifyUser,
  tester,
} = require("../controllers/userController");
const isAuthenticated = require("../middlewares/authenticate");
const isAuthorized = require("../middlewares/authorize");

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
});

router.get(
  "/test",
  isAuthenticated,
  isAuthorized("admin", "organizer", "attendee"),
  tester
);

router.post("/signup", signupUser);

router.get("/:id/verify/:token", verifyUser);

router.get("/", isAuthenticated, getUserProfile);

router.get("/:userId", isAuthenticated, getSingleProfile);

router.patch("/edit/profile", isAuthenticated, updateProfile); // working

router.patch("/tedit", upload.single("profilePic"), updater);

router.patch("/aedit", handler);

router.patch(
  "/edit/profile-pic",
  isAuthenticated,
  upload.single("profilePic"),
  updateProfilePic
);

router.patch(
  "/edit/cover-pic",
  isAuthenticated,
  upload.single("coverPic"),
  updateCoverPic
);

module.exports = router;
