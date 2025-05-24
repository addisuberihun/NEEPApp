const mongoose = require("mongoose")

const chatRoomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teachers", // Changed from "Teacher" to "Teachers"
      required: true,
    },
    moderators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teachers", // Changed from "Teacher" to "Teachers"
      },
    ],
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "participants.userModel",
        },
        userModel: {
          type: String,
          enum: ["students", "Teachers"], // Changed from "Teacher" to "Teachers"
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("ChatRoom", chatRoomSchema)



