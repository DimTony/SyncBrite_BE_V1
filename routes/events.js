const router = require("express").Router();
const multer = require("multer");
const validateEventInput = require("../utils/validator");
const isAuthenticated = require("../middlewares/authenticate");
const {
  createEvent,
  getOwnEvents,
  getUserEventsByUsername,
  getAllTopEvents,
  getSingleEvent,
  likeEvent,
  getMainTopEvents,
} = require("../controllers/eventController");

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
});

router.post(
  "/create",
  isAuthenticated,
  validateEventInput,
  upload.single("bannerImage"),
  createEvent
);

router.get("/", isAuthenticated, getOwnEvents);
router.get("/users/:username", isAuthenticated, getUserEventsByUsername);
router.get("/top", isAuthenticated, getAllTopEvents);
router.get("/main", isAuthenticated, getMainTopEvents);
router.get("/:eventId", isAuthenticated, getSingleEvent);
router.patch("/like/:eventId", isAuthenticated, likeEvent);

module.exports = router;
