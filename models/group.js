const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { Attendee } = require("./attendee");

const groupSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
  },
  privacy: {
    type: String,
    enum: ["public", "private"],
    default: "public",
  },
  superAdmin: {
    type: Schema.Types.ObjectId,
    ref: "Attendee",
  },
  invites: {
    type: Schema.Types.ObjectId,
    ref: "Attendee",
  },
  members: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "Attendee",
      },
      status: {
        type: String,
        enum: ["member", "admin", "suspended", "superAdmin"],
        default: "member",
      },
    },
  ],
  adminRequests: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "Attendee",
      },
    },
  ],
  messages: [
    {
      sender: {
        type: Schema.Types.ObjectId,
        ref: "Attendee",
      },
      textContent: {
        type: String,
      },
      imageContent: {
        type: [String],
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

groupSchema.methods = {
  initializeSuperAdmin: function (userId) {
    this.superAdmin = userId;

    // Add the user as 'superAdmin' in the group
    this.addMember(userId, "superAdmin");

    // Add the group ID to the user's 'groups' list
    Attendee.findById(userId)
      .then((user) => {
        if (user) {
          user.groups.push(this._id); // Assuming _id is the group's ObjectId
          return user.save();
        } else {
          throw new Error("User not found");
        }
      })
      .catch((error) => {
        console.error("Error adding group to user's groups list:", error);
      });
  },

  addMember: function (userId, status = "member") {
    const existingMember = this.members.find((member) =>
      member.user.equals(userId)
    );

    if (!existingMember) {
      this.members.push({ user: userId, status });

      // Add the group ID to the user's 'groups' list
      Attendee.findById(userId)
        .then((user) => {
          if (user) {
            user.groups.push(this._id); // Assuming _id is the group's ObjectId
            return user.save();
          } else {
            throw new Error("User not found");
          }
        })
        .catch((error) => {
          console.error(
            "Error adding group to user's groups list during addMember:",
            error
          );
        });
    } else {
      // If the member already exists, update their status
      existingMember.status = status;
    }
  },

  suspendMember: function (userId) {
    const existingMember = this.members.find((member) =>
      member.user.equals(userId)
    );

    if (existingMember) {
      // Check if the member is not a superAdmin before updating the status
      if (existingMember.status !== "superAdmin") {
        existingMember.status = "suspended";
      } else {
        console.log("Cannot suspend a superAdmin.");
        // You may choose to throw an error or handle it differently based on your requirements.
      }
    }
  },

  blockUser: function (userId) {
    const existingMemberIndex = this.members.findIndex((member) =>
      member.user.equals(userId)
    );

    if (existingMemberIndex !== -1) {
      const existingMember = this.members[existingMemberIndex];

      // Check if the member is not a superAdmin before updating the status
      if (existingMember.status !== "superAdmin") {
        // Mark the member as 'blocked'
        existingMember.status = "blocked";

        // Remove the group ID from the user's 'groups' list
        Attendee.findById(userId)
          .then((user) => {
            if (user) {
              user.groups = user.groups.filter(
                (group) => !group.equals(this._id)
              ); // Assuming _id is the group's ObjectId
              return user.save();
            } else {
              throw new Error("User not found");
            }
          })
          .catch((error) => {
            console.error(
              "Error removing group from user's groups list during blockUser:",
              error
            );
          });
      } else {
        console.log("Cannot block a superAdmin.");
        // You may choose to throw an error or handle it differently based on your requirements.
      }
    }
  },

  removeMember: function (userId) {
    const existingMemberIndex = this.members.findIndex((member) =>
      member.user.equals(userId)
    );

    if (existingMemberIndex !== -1) {
      const existingMember = this.members[existingMemberIndex];

      // Check if the member is not a superAdmin before removing
      if (existingMember.status !== "superAdmin") {
        // Remove the member from the members list
        const removedMember = this.members.splice(existingMemberIndex, 1)[0];

        // No need to mark the member as 'removed' since they are being removed from the group

        // Remove the group ID from the member's 'groups' list
        Attendee.findById(userId)
          .then((user) => {
            if (user) {
              user.groups = user.groups.filter(
                (group) => !group.equals(this._id)
              ); // Assuming _id is the group's ObjectId
              return user.save();
            } else {
              throw new Error("User not found");
            }
          })
          .catch((error) => {
            console.error(
              "Error removing group from user's groups list during removeMember:",
              error
            );
          });
      } else {
        console.log("Cannot remove a superAdmin.");
        // You may choose to throw an error or handle it differently based on your requirements.
      }
    }
  },

  sendMessage: function (senderId, content) {
    this.messages.push({ sender: senderId, content });
  },

  requestAdmin: function (userId) {
    const existingRequest = this.adminRequests.find((request) =>
      request.user.equals(userId)
    );
    if (!existingRequest) {
      this.adminRequests.push({ user: userId });
    }
  },

  makeAdmin: function (userId) {
    const existingMember = this.members.find((member) =>
      member.user.equals(userId)
    );

    if (existingMember) {
      // Check if the member is not a superAdmin before updating the status
      if (existingMember.status !== "superAdmin") {
        existingMember.status = "admin";
      } else {
        console.log("Cannot make a superAdmin into an admin.");
        // You may choose to throw an error or handle it differently based on your requirements.
      }
    }
  },

  acceptAdminRequest: function (userId) {
    // Remove the request from adminRequests
    const requestIndex = this.adminRequests.findIndex((request) =>
      request.user.equals(userId)
    );
    if (requestIndex !== -1) {
      this.adminRequests.splice(requestIndex, 1);

      // Make the user an admin
      this.makeAdmin(userId);
    }
  },

  declineAdminRequest: function (userId) {
    // Remove the request from adminRequests
    const requestIndex = this.adminRequests.findIndex((request) =>
      request.user.equals(userId)
    );
    if (requestIndex !== -1) {
      this.adminRequests.splice(requestIndex, 1);
    }
  },
};

const Group = mongoose.model("groups", groupSchema);

module.exports = { Group };
