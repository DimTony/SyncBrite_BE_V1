const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { Group } = require("./group");
const jwt = require("jsonwebtoken");

const attendeeSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
    },
    userName: {
      type: String,
      lowercase: true,
      unique: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      enum: ["attendee", "organizer", "admin"],
      default: "attendee",
    },
    verified: {
      type: Boolean,
      default: false,
    },
    profilePic: {
      type: String,
    },
    passwordChangedAt: {
      type: Date,
    },
    dateOfBirth: {
      type: Date,
    },
    location: {
      type: String,
    },
    bio: {
      type: String,
    },
    coverPic: {
      type: String,
    },
    friends: [
      {
        type: Schema.Types.ObjectId,
        ref: "Attendee",
      },
    ],
    sentFriendRequests: [
      {
        type: Schema.Types.ObjectId,
        ref: "Attendee",
      },
    ],
    receivedFriendRequests: [
      {
        type: Schema.Types.ObjectId,
        ref: "Attendee",
      },
    ],
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: "Attendee",
      },
    ],
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: "Attendee",
      },
    ],
    groups: [
      {
        type: Schema.Types.ObjectId,
        ref: "Group",
      },
    ],
    interests: {
      type: [String],
    },
    pronouns: {
      type: String,
    },
    socialLinks: {
      facebook: {
        type: String,
      },
      twitter: {
        type: String,
      },
      instagram: {
        type: String,
      },
      linkedin: {
        type: String,
      },
      other: {
        type: String,
      },
    },
  },
  { versionKey: false, strictQuery: false }
);

attendeeSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, process.env.JWTPRIVATEKEY, {
    expiresIn: "7d",
  });
  return token;
};

attendeeSchema.methods.isPasswordChanged = async function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const pswdChangedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < pswdChangedTimestamp;
  }
  return false;
};

attendeeSchema.methods.addFriend = async function (friendId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      throw new Error("Invalid friendId");
    }

    const friendAttendee = await mongoose
      .model("attendees")
      .findById(friendId)
      .select("-password"); // Exclude password field for friend user

    if (!friendAttendee) {
      throw new Error("Friend not found");
    }

    if (this._id.equals(friendId)) {
      throw new Error("Cannot add yourself as a friend");
    }

    // Check if the friend is already in the friends list
    if (this.friends.includes(friendId)) {
      throw new Error("Friend is already in your friends list");
    }

    // Check if the friend request is already pending
    if (friendAttendee.receivedFriendRequests.includes(this._id)) {
      throw new Error("Friend request is already pending");
    }

    // Add the friendId to the receivedFriendRequests list for the current user
    // Add the current user's id to the sentFriendRequests list for the friend user
    this.sentFriendRequests.push(friendId);
    friendAttendee.receivedFriendRequests.push(this._id);

    // Save the updated users
    await Promise.all([this.save(), friendAttendee.save()]);

    // Fetch the updated users after saving (excluding password fields)
    const updatedUser = await Attendee.findById(this._id).select("-password");
    const updatedFriendUser = await Attendee.findById(
      friendAttendee._id
    ).select("-password");

    return { currentUser: updatedUser, friendUser: updatedFriendUser };
  } catch (error) {
    throw error;
  }
};
attendeeSchema.methods.removeFriend = async function (friendId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      throw new Error("Invalid friendId");
    }

    if (this.friends && this.friends.length > 0) {
      const currentUserFriendIndex = this.friends.indexOf(friendId);
      if (currentUserFriendIndex !== -1) {
        this.friends.splice(currentUserFriendIndex, 1);
      }
    }

    if (this.pendingFriends && this.pendingFriends.length > 0) {
      const currentUserPendingIndex = this.pendingFriends.indexOf(friendId);
      if (currentUserPendingIndex !== -1) {
        this.pendingFriends.splice(currentUserPendingIndex, 1);
      }
    }

    // Save the updated current user
    await this.save();

    // Remove the current user's ID from the friend's friends list
    const friendUser = await mongoose
      .model("attendees")
      .findById(friendId)
      .select("-password"); // Exclude password field

    if (friendUser.friends && friendUser.friends.length > 0) {
      const friendUserFriendIndex = friendUser.friends.indexOf(this._id);
      if (friendUserFriendIndex !== -1) {
        friendUser.friends.splice(friendUserFriendIndex, 1);
      }
    }

    if (friendUser.pendingFriends && friendUser.pendingFriends.length > 0) {
      const friendUserPendingIndex = friendUser.pendingFriends.indexOf(
        this._id
      );
      if (friendUserPendingIndex !== -1) {
        friendUser.pendingFriends.splice(friendUserPendingIndex, 1);
      }
    }

    // Save the updated friend user
    await friendUser.save();

    // Fetch the updated current user after saving
    const updatedCurrentUser = await mongoose
      .model("attendees")
      .findById(this._id)
      .select("-password"); // Exclude password field

    return { currentUser: updatedCurrentUser, friendUser };
  } catch (error) {
    throw error;
  }
};

attendeeSchema.methods.cancelFriend = async function (friendId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      throw new Error("Invalid friendId");
    }

    // Check if the friendId is the same as the current user's id
    if (this._id.equals(friendId)) {
      throw new Error("Cannot cancel friend request to yourself");
    }

    // Check if the friendId is already in the friend list
    if (this.friends.includes(friendId)) {
      throw new Error("Cannot cancel friend request for an existing friend");
    }

    // Check if the friendId exists in the model
    const friendInModel = await mongoose.model("attendees").findById(friendId);
    if (!friendInModel) {
      throw new Error("Friend not found in the model");
    }

    if (!friendInModel.receivedFriendRequests.includes(this._id)) {
      throw new Error("Friend request not found");
    }

    // Remove the current user from the friend's receivedFriendRequests list
    friendInModel.receivedFriendRequests =
      friendInModel.receivedFriendRequests.filter(
        (requesterId) => !requesterId.equals(this._id)
      );

    // Remove the friendId from the current user's sentFriendRequests list
    this.sentFriendRequests = this.sentFriendRequests.filter(
      (sentRequestId) => !sentRequestId.equals(friendId)
    );

    // Save the updated users
    await Promise.all([this.save(), friendInModel.save()]);

    // Fetch the updated users after saving (excluding password fields)
    const updatedUser = await Attendee.findById(this._id).select("-password");
    const updatedFriendUser = await Attendee.findById(friendId).select(
      "-password"
    );

    return { currentUser: updatedUser, friendUser: updatedFriendUser };
  } catch (error) {
    throw error;
  }
};

attendeeSchema.methods.acceptRequest = async function (friendId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      throw new Error("Invalid friendId");
    }

    // Check if the friendId is the same as the current user's id
    if (this._id.equals(friendId)) {
      throw new Error("Cannot accept friend request from yourself");
    }

    // Check if the friendId exists in the model
    const friendInModel = await mongoose.model("attendees").findById(friendId);
    if (!friendInModel) {
      throw new Error("Friend not found in the model");
    }

    // Check if the current user is in the friend's sentFriendRequests list
    if (!this.receivedFriendRequests.includes(friendId)) {
      throw new Error("Friend request not found");
    }

    // Remove the current user from the friend's sentFriendRequests list
    const friend = await mongoose.model("attendees").findById(friendId);
    if (friend) {
      friend.sentFriendRequests = friend.sentFriendRequests.filter(
        (sentRequestId) => !sentRequestId.equals(this._id)
      );
      friend.friends.push(this._id); // Add the current user to the friend's friends list
      await friend.save();
    }

    // Remove the friendId from the current user's receivedFriendRequests list
    this.receivedFriendRequests = this.receivedFriendRequests.filter(
      (receivedRequestId) => !receivedRequestId.equals(friendId)
    );
    this.friends.push(friendId); // Add the friend to the current user's friends list
    await this.save();

    // Fetch the updated users after saving (excluding password fields)
    const updatedUser = await Attendee.findById(this._id).select("-password");
    const updatedFriendUser = await Attendee.findById(friendId).select(
      "-password"
    );

    return { currentUser: updatedUser, friendUser: updatedFriendUser };
  } catch (error) {
    throw error;
  }
};

attendeeSchema.methods.declineRequest = async function (friendId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      throw new Error("Invalid friendId");
    }

    // Check if the friendId is the same as the current user's id
    if (this._id.equals(friendId)) {
      throw new Error("Cannot decline friend request to yourself");
    }

    // Check if the friendId exists in the model
    const friendInModel = await mongoose.model("attendees").findById(friendId);
    if (!friendInModel) {
      throw new Error("Friend not found in the model");
    }

    // Check if the current user is in the friend's sentFriendRequests list
    if (!this.receivedFriendRequests.includes(friendId)) {
      throw new Error("Friend request not found");
    }

    // Remove the current user from the friend's sentFriendRequests list
    const friend = await mongoose.model("attendees").findById(friendId);
    if (friend) {
      friend.sentFriendRequests = friend.sentFriendRequests.filter(
        (sentRequestId) => !sentRequestId.equals(this._id)
      );
      await friend.save();
    }

    // Remove the friendId from the current user's receivedFriendRequests list
    this.receivedFriendRequests = this.receivedFriendRequests.filter(
      (receivedRequestId) => !receivedRequestId.equals(friendId)
    );

    await this.save();

    // Fetch the updated users after saving (excluding password fields)
    const updatedUser = await Attendee.findById(this._id).select("-password");
    const updatedFriendUser = await Attendee.findById(friendId).select(
      "-password"
    );

    return { currentUser: updatedUser, friendUser: updatedFriendUser };
  } catch (error) {
    throw error;
  }
};

attendeeSchema.methods.followFriend = async function (friendId) {
  try {
    // Validate friendId
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      throw new Error("Invalid friendId");
    }

    // Check if the friend exists
    const friend = await Attendee.findById(friendId).select("-password");
    if (!friend) {
      throw new Error("Friend not found");
    }

    // Check if they are already friends
    if (this.following.includes(friendId)) {
      throw new Error("Already following friend");
    }

    // Update 'following' and 'followers' lists
    this.following.push(friendId);
    friend.followers.push(this._id);

    // Save changes
    await Promise.all([this.save(), friend.save()]);

    // Return updated users without passwords
    return {
      currentUser: { ...this.toObject(), password: undefined },
      friendUser: { ...friend.toObject(), password: undefined },
    };
  } catch (error) {
    throw new Error(`Error in followFriend: ${error.message}`);
  }
};

attendeeSchema.methods.unfollowFriend = async function (friendId) {
  try {
    // Validate friendId
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      throw new Error("Invalid friendId");
    }

    // Check if the friend exists
    const friend = await Attendee.findById(friendId).select("-password");
    if (!friend) {
      throw new Error("Friend not found");
    }

    // Check if friendId is in currentUser's 'following' list
    if (!this.following.includes(friendId)) {
      throw new Error("Friend is not in the following list");
    }

    // Check if current user's id is in friend's 'followers' list
    if (!friend.followers.includes(this._id.toString())) {
      throw new Error("Current user is not in friend's followers list");
    }

    // Remove friendId from 'following' list
    this.following = this.following.filter((id) => id.toString() !== friendId);

    // Remove current user's id from friend's 'followers' list
    friend.followers = friend.followers.filter(
      (id) => id.toString() !== this._id.toString()
    );

    // Save changes
    await Promise.all([this.save(), friend.save()]);

    // Return updated users without passwords
    return {
      currentUser: { ...this.toObject(), password: undefined },
      friendUser: { ...friend.toObject(), password: undefined },
    };
  } catch (error) {
    throw new Error(`Error in unfollowFriend: ${error.message}`);
  }
};

const Attendee = mongoose.model("attendees", attendeeSchema);

module.exports = { Attendee };
