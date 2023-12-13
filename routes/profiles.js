const router = require("express").Router();
const isAuthenticated = require("../middlewares/authenticate");
const {
  friendUnfriend,
  acceptDeclineFriendRequest,
  followUnfollow,
} = require("../controllers/profileController");

router.patch("/friend/request/:userId", isAuthenticated, friendUnfriend);
router.patch("/friend/:userId", isAuthenticated, acceptDeclineFriendRequest);
router.patch("/follow/:userId", isAuthenticated, followUnfollow);

module.exports = router;
