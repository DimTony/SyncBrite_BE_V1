const mongoose = require("mongoose");
const { Group } = require("../models/group");
const { Attendee } = require("../models/attendee");
const transporter = require("../utils/transporter");
const { handleUpload } = require("../utils/uploadImage");
const CustomError = require("../utils/customError");
const { deformatCreatedAt } = require("../utils/deformatDateTime");
const { formatTimestamp } = require("../utils/formatDateTime");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const { CreateGroupInputValidation } = require("../utils/validationSchema");

const createGroup = asyncErrorHandler(async (req, res, next) => {
  const { error } = CreateGroupInputValidation(req.body);

  if (error) {
    const err = new CustomError(400, error.details[0].message);
    return next(err);
  }

  const { groupName, privacy, invites } = req.body;
  const emailArray = invites ? invites.split(",") : [];

  try {
    // Find corresponding _ids for each email in the Attendee model
    const attendeeIds = await Attendee.find(
      { email: { $in: emailArray } },
      "_id"
    );

    // Filter out the emails without a corresponding _id
    const validInvites = attendeeIds.map((attendee) => attendee._id.toString());

    let groupBannerUrl;

    // Check if req.file exists before attempting to access its properties
    if (req.file) {
      // Upload groupImage to Cloudinary
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

      const cldRes = await handleUpload(dataURI);

      groupBannerUrl = cldRes.secure_url;
    } else {
      // Set a default URL when req.file is falsy
      groupBannerUrl =
        "https://res.cloudinary.com/dvvgaf1l9/image/upload/v1702580252/create-group-placeholder_ihig14.png";
    }

    // Create a new group instance
    const newGroup = new Group({
      name: groupName,
      privacy,
      superAdmin: req.user.id,
      invites: validInvites,
      groupImage: groupBannerUrl, // Assuming the image is stored as a base64 string
    });

    // Add the creator as a superAdmin in the members field
    newGroup.members.push({
      user: req.user.id,
      status: "superAdmin",
    });

    const superAdminData = await Attendee.findById(req.user.id);

    newGroup.posts.push({
      textContent: "",
      author: req.user.id,
      authorData: {
        id: superAdminData._id,
        firstName: superAdminData.firstName,
        lastName: superAdminData.lastName,
        fullName: superAdminData.fullName,
        userName: superAdminData.userName,
        email: superAdminData.email,
        role: superAdminData.role,
        profilePic: superAdminData.profilePic,
        dateOfBirth: superAdminData.dateOfBirth,
        location: superAdminData.location,
        bio: superAdminData.bio,
        coverPic: superAdminData.coverPic,
        interests: superAdminData.interests,
        pronouns: superAdminData.pronouns,
        socialLinks: superAdminData.socialLinks,
        verified: superAdminData.verified,
        passwordChangedAt: superAdminData.passwordChangedAt,
        friends: superAdminData.friends,
        sentFriendRequests: superAdminData.sentFriendRequests,
        receivedFriendRequests: superAdminData.receivedFriendRequests,
        followers: superAdminData.followers,
        following: superAdminData.following,
        groups: superAdminData.groups,
        groupInvites: superAdminData.groupInvites,
      },
      likes: [],
      comments: [],
    });

    // Save the new group
    const savedGroup = await newGroup.save();

    // Save the group ID in the Attendee model under the groups field with status 'superAdmin'
    await Attendee.findByIdAndUpdate(
      req.user.id,
      {
        $push: {
          groups: {
            groupId: savedGroup._id,
            status: "superAdmin",
          },
        },
      },
      { new: true }
    );

    // Send invites if there are valid invites
    if (validInvites.length > 0) {
      await sendInvites(savedGroup._id, validInvites, groupName);
    }

    res.status(201).json({
      success: true,
      group: savedGroup,
    });
  } catch (error) {
    console.error("Error creating group:", error);
    const err = new CustomError(500, "Internal Server Error");
    return next(err);
  }
});

const sendInvites = async (groupId, validInvites, groupName) => {
  try {
    const attendees = await Attendee.find({ _id: { $in: validInvites } });

    // Update 'groupInvites' field for each attendee
    const updatePromises = attendees.map(async (attendee) => {
      attendee.groupInvites.push(groupId);
      return attendee.save();
    });

    await Promise.all(updatePromises);

    // Send emails to each attendee
    const emailPromises = attendees.map(async (attendee) => {
      const mailOptions = {
        from: "your-email@gmail.com",
        to: attendee.email, // Assuming you have an 'email' field in your Attendee model
        subject: "You are invited to join a group",
        html: `<p>You have been invited to join a group named ${groupName}.</p>
               <p>Click <a href="http://localhost:3000/attendee/groups/${groupId}">here</a> to join the group.</p>`,
      };

      return transporter.sendMail(mailOptions);
    });

    await Promise.all(emailPromises);

    console.log("Invites sent successfully");
  } catch (error) {
    console.error("Error sending invites:", error);
  }
};

const sendInvitesViaEmail = asyncErrorHandler(async (req, res, next) => {
  const groupId = req.params.groupId;
  const emails = req.body;

  if (!groupId || !emails) {
    const error = new CustomError(400, "PROVIDE REQUIRED CREDENTIALS");
    return next(error);
  }

  // Step 1: Find valid invites based on emails
  const validInvites = await Attendee.find({
    email: { $in: emails },
  }).distinct("_id");

  // Step 2: Get group name
  const group = await Group.findById(groupId);
  if (!group) {
    const error = new CustomError(404, "GROUP NOT FOUND");
    return next(error);
  }
  const groupName = group ? group.name : "Unknown Group"; // Default to 'Unknown Group' if group not found

  // Step 3: Update 'groupInvites' field for each attendee
  const attendees = await Attendee.find({ _id: { $in: validInvites } });

  // Update 'groupInvites' field for each attendee
  const updatePromises = attendees.map(async (attendee) => {
    attendee.groupInvites.push(groupId);
    return attendee.save();
  });

  await Promise.all(updatePromises);

  // Step 4: Send emails to each attendee
  const emailPromises = attendees.map(async (attendee) => {
    const mailOptions = {
      from: "your-email@gmail.com",
      to: attendee.email,
      subject: "You are invited to join a group",
      html: `<p>You have been invited to join a group named ${groupName}.</p>
               <p>Click <a href="http://localhost:3000/attendee/groups/${groupId}">here</a> to join the group.</p>`,
    };

    return transporter.sendMail(mailOptions);
  });

  await Promise.all(emailPromises);

  console.log("Invites sent successfully");

  res.status(200).json({
    success: true,
    message: "Invites sent successfully",
  });
});

const getSingleGroupById = asyncErrorHandler(async (req, res, next) => {
  const user = req.user;
  const groupId = req.params.groupId;

  if (!groupId) {
    const error = new CustomError(400, "Group ID Required");
    return next(error);
  }

  const group = await Group.findById(groupId);

  if (!group) {
    const error = new CustomError(404, "Group Not Found");
    return next(error);
  }

  const formattedGroup = {
    ...group.toObject(), // Convert Mongoose document to plain object
    posts: group.posts.map((post) => ({
      ...post.toObject(), // Convert Mongoose document to plain object
      createdAt: formatTimestamp(post.createdAt),
      updatedAt: formatTimestamp(post.updatedAt),
    })),
  };

  const singleGroup = {
    id: group._id,
    name: group.name,
    description: group.description,
    privacy: group.privacy,
    superAdmin: group.superAdmin,
    invites: group.invites,
    groupImage: group.groupImage,
    posts: group.posts.map((post) => ({
      ...post.toObject(), // Convert Mongoose document to plain object
      createdAt: deformatCreatedAt(post.createdAt),
      updatedAt: deformatCreatedAt(post.updatedAt),
    })),
    likes: group.likes,
    comments: group.comments,
    members: group.members,
    adminRequests: group.adminRequests,
    messages: group.messages,
    createdAt: deformatCreatedAt(group.createdAt),
    updatedAt: deformatCreatedAt(group.updatedAt),
  };

  res.status(200).json({
    success: true,
    group: singleGroup,
    user,
  });
});

async function fetchAuthorData(authorId) {
  try {
    const authorData = await Attendee.findById(authorId);

    if (!authorData) {
      // If no author data is found, handle it as a not found error
      throw new Error("Author not found");
    }

    return authorData;
  } catch (error) {
    console.error("FetchAuthorError:", error);

    if (error.name === "CastError" && error.kind === "ObjectId") {
      // If the provided authorId is not a valid ObjectId, handle it as a bad request
      return {
        success: false,
        message: "Invalid authorId",
      };
    }

    // Handle other errors
    return {
      success: false,
      message: "Error fetching author data",
      error: error.message || "Internal Server Error",
    };
  }
}
const createPost = asyncErrorHandler(async (req, res, next) => {
  const groupId = req.params.groupId;
  const postData = req.body.postData;

  // Find the group by ID
  const group = await Group.findById(groupId);

  if (!group) {
    throw new Error("Group not found");
  }

  // Fetch the author's data from the Attendee model
  const authorData = await Attendee.findById(postData.author);

  if (!authorData) {
    throw new Error("Author not found");
  }

  // Add the new post to the posts array
  const newPost = {
    textContent: postData.textContent,
    imageContent: postData.imageContent,
    author: postData.author,
    authorData: {
      id: authorData._id,
      firstName: authorData.firstName,
      lastName: authorData.lastName,
      fullName: authorData.fullName,
      userName: authorData.userName,
      email: authorData.email,
      role: authorData.role,
      profilePic: authorData.profilePic,
      dateOfBirth: authorData.dateOfBirth,
      location: authorData.location,
      bio: authorData.bio,
      coverPic: authorData.coverPic,
      interests: authorData.interests,
      pronouns: authorData.pronouns,
      socialLinks: authorData.socialLinks,
      verified: authorData.verified,
      passwordChangedAt: authorData.passwordChangedAt,
      friends: authorData.friends,
      sentFriendRequests: authorData.sentFriendRequests,
      receivedFriendRequests: authorData.receivedFriendRequests,
      followers: authorData.followers,
      following: authorData.following,
      groups: authorData.groups,
      groupInvites: authorData.groupInvites,
    },
  };

  group.posts.push(newPost);

  // Save the updated group document
  await group.save();

  res.status(201).json({
    success: true,
    posts: group.posts,
  });
});

const findStatusForGroup = (userGroups, groupId) => {
  const groupStatusObj = userGroups.find((group) =>
    group.groupId.equals(groupId)
  );
  return groupStatusObj ? groupStatusObj.status : null;
};

// Usage in your middleware
const likeGroupPost = asyncErrorHandler(async (req, res, next) => {
  const value = req.body.action;
  const post = req.post;
  const group = req.group;

  // Find the status for the current group
  const groupStatus = findStatusForGroup(
    req.user.groups,
    new mongoose.Types.ObjectId(group._id)
  );

  // Check if the groupStatus is not null or undefined
  if (groupStatus === null || groupStatus === undefined) {
    return res
      .status(400)
      .json({ message: "User status for this group not found" });
  }

  if (value === "like") {
    post.likes.push({
      user: req.user.id,
      userType: groupStatus,
    });
  } else if (value === "unlike") {
    post.likes = post.likes.filter((likeObj) => likeObj.user !== req.user.id);
  } else {
    return res.status(400).json({ message: "Invalid like action" });
  }

  await group.save();

  res.status(200).json({
    success: true,
    group,
  });
});

module.exports = {
  createGroup,
  sendInvites,
  sendInvitesViaEmail,
  getSingleGroupById,
  createPost,
  likeGroupPost,
};
