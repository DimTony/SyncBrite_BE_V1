const jwt = require("jsonwebtoken");
const multer = require("multer");
const { handleUpload } = require("../utils/uploadImage");
const { Attendee } = require("../models/attendee");
const { Organizer } = require("../models/organizer");
const CustomError = require("../utils/customError");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const userNameSlugify = require("../utils/userNameSlugify");
const fullNameSlugify = require("../utils/fullNameSlugify");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const profilePicUploadMiddleware = upload.single("profilePic");
const coverPicUploadMiddleware = upload.single("coverPic");
const multUpload = upload.array([
  { name: "profilePic", maxCount: 1 },
  { name: "coverPic", maxCount: 1 },
]);

const getUserProfile = asyncErrorHandler(async (req, res, next) => {
  const user = req.user;

  res.status(200).json({
    success: true,
    profile: user,
  });
});
const getSingleProfile = asyncErrorHandler(async (req, res, next) => {
  const userId = req.params.userId;

  const attendee = await Attendee.findById({ _id: userId });

  if (!attendee) {
    const organizer = await Organizer.findById({ _id: userId });

    if (!organizer) {
      const err = new CustomError(404, "User Not Found");
      return next(err);
    }

    const user = {
      id: organizer._id,
      email: organizer.email,
      role: organizer.role,
    };

    res.status(200).json({
      success: true,
      user: user,
    });
  }

  const user = {
    id: attendee._id,
    firstName: attendee.firstName,
    lastName: attendee.lastName,
    fullName: attendee.fullName,
    userName: attendee.userName,
    email: attendee.email,
    role: attendee.role,
    profilePic: attendee.profilePic,
    dateOfBirth: attendee.dateOfBirth,
    location: attendee.location,
    bio: attendee.bio,
    coverPic: attendee.coverPic,
    interests: attendee.interests,
    pronouns: attendee.pronouns,
    socialLinks: attendee.socialLinks,
    verified: attendee.verified,
  };
  res.status(200).json({
    success: true,
    user: user,
  });
});

const updateProfile = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user.id.toString();
  const firstName = req.body.data.firstName;
  const lastName = req.body.data.lastName;

  const fullNameSlug = await fullNameSlugify(firstName, lastName);

  req.body.data.fullName = fullNameSlug;

  // Update the user profile in the database
  const updatedUser = await Attendee.findByIdAndUpdate(userId, req.body.data, {
    new: true,
  });
  if (!updatedUser) {
    const err = new CustomError(404, "Error updating user");
    return next(err);
  }

  const { _id: id, fullName, profilePic } = updatedUser;

  // Generate a new JWT token with the updated user information
  const token = jwt.sign(
    { id, fullName, profilePic },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "1h" }
  );

  if (!token) {
    const err = new CustomError(500, "Token generation failed");
    return next(err);
  }

  res.status(200).json({
    success: true,
    result: {
      fullName,
      profilePic,
      token,
    },
  });
});

const updater = asyncErrorHandler(async (req, res, next) => {
  await runMiddleware(req, res, multUpload);
  console.log(req.file);
  console.log(req.files);
});

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

const handler = asyncErrorHandler(async (req, res, next) => {
  await runMiddleware(req, res, myUploadMiddleware);
  const b64 = Buffer.from(req.file.buffer).toString("base64");
  let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
  const cldRes = await handleUpload(dataURI);
  console.log(cldRes.secure_url);
  res.json(cldRes);
});

const updateProfilePic = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user.id.toString();

  if (req.file) {
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    try {
      const cldRes = await handleUpload(dataURI);

      const profilepicURL = cldRes.secure_url;

      const updatedUser = await Attendee.findByIdAndUpdate(
        userId,
        { profilePic: profilepicURL },
        { new: true }
      );
      if (!updatedUser) {
        const err = new CustomError(404, "Error updating user");
        return next(err);
      }

      res.status(200).json({
        success: true,
        updatedUser,
      });
    } catch (error) {
      console.error("Error uploading image to Cloudinary:", error);
      const err = new CustomError(500, "Internal Server Error");
      return next(err);
    }
  } else {
    const err = new CustomError(401, "File is required");
    return next(err);
  }
});

const updateCoverPic = async (req, res, next) => {
  const userId = req.user.id.toString();

  if (req.file) {
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    try {
      const cldRes = await handleUpload(dataURI);

      const coverpicURL = cldRes.secure_url;

      const updatedUser = await Attendee.findByIdAndUpdate(
        userId,
        { coverPic: coverpicURL },
        { new: true }
      );
      if (!updatedUser) {
        const err = new CustomError(404, "Error updating user");
        return next(err);
      }

      res.status(200).json({
        success: true,
        updatedUser,
      });
    } catch (error) {
      console.error("Error uploading image to Cloudinary:", error);
      const err = new CustomError(500, "Internal Server Error");
      return next(err);
    }
  } else {
    const err = new CustomError(401, "File is required");
    return next(err);
  }
};

module.exports = {
  getUserProfile,
  getSingleProfile,
  updateProfile,
  updateCoverPic,
  updater,
  handler,
  updateProfilePic,
};
