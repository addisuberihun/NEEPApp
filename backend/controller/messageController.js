const Message = require("../model/messageModel");
const ChatRoom = require("../model/chatRoomModel");

const sendMessage = async (req, res) => {
  try {
    const { roomId, content } = req.body;
    const userId = req.user.userId;
    const userModel = req.user.role === "teacher" ? "Teachers" : "students";

    // Check if chat room exists
    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: "Chat room not found",
      });
    }

    // Check if user is a participant
    const isParticipant = chatRoom.participants.some(
      (p) => p.userId.toString() === userId && p.userModel === userModel
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "You must join the chat room before sending messages",
      });
    }

    // Handle image upload if present
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Validate that at least one of content or image is provided
    if (!content && !imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Message content or image is required",
      });
    }

    // Create and save the message
    const message = new Message({
      chatRoom: roomId,
      sender: {
        userId,
        userModel,
      },
      content: content || "",
      imageUrl,
    });

    await message.save();

    // Populate sender info
    await message.populate({
      path: "sender.userId",
      select: "name role subject",
    });

    // Emit the message via socket
    req.io.to(roomId).emit("receive_message", message);

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;

    const messages = await Message.find({
      chatRoom: roomId,
      isDeleted: false,
    })
      .populate({
        path: "sender.userId",
        select: "name role subject",
      })
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message,
    });
  }
};

const moderateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const teacherId = req.user.userId;

    // Verify the user is a teacher
    if (req.user.role !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "Only teachers can moderate messages",
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check if teacher is a moderator for this chat room
    const chatRoom = await ChatRoom.findById(message.chatRoom);
    if (!chatRoom.moderators.includes(teacherId)) {
      return res.status(403).json({
        success: false,
        message: "You are not a moderator for this chat room",
      });
    }

    // Update message
    message.isModerated = true;
    message.moderatedBy = teacherId;
    message.isDeleted = true;

    await message.save();

    // Notify all users in the room
    req.io.to(message.chatRoom.toString()).emit("message_moderated", {
      messageId: message._id,
      moderatedBy: teacherId,
    });

    res.status(200).json({
      success: true,
      message: "Message moderated successfully",
    });
  } catch (error) {
    console.error("Moderate message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to moderate message",
      error: error.message,
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  moderateMessage,
};


