const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chatRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
    },
    sender: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "sender.userModel",
        required: true,
      },
      userModel: {
        type: String,
        enum: ["students", "Teachers"],
        required: true,
      },
    },
    content: {
      type: String,
      trim: true, // Removed required to allow image-only messages
    },
    imageUrl: {
      type: String, // Store URL of uploaded image
      trim: true,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isModerated: {
      type: Boolean,
      default: false,
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teachers",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);


