const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const Message = require("../model/messageModel");
const ChatRoom = require("../model/chatRoomModel");

const initializeSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: "*", // Update with your frontend URL in production
      methods: ["GET", "POST"],
    },
  });

  // Track active users per room
  const roomUsers = {};

  // Authentication middleware for Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "yourSecretKey");
      socket.user = decoded;
      next();
    } catch (error) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  // Connection event
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Keep track of which rooms this socket is in
    const userRooms = new Set();

    // Join a chat room
    socket.on("join_room", async (roomId) => {
      try {
        // Check if chat room exists
        const chatRoom = await ChatRoom.findById(roomId);
        if (!chatRoom) {
          socket.emit("error", { message: "Chat room not found" });
          return;
        }

        // Join the room
        socket.join(roomId);
        userRooms.add(roomId);
        console.log(`User ${socket.user.userId} joined room: ${roomId}`);

        // Initialize room users tracking if needed
        if (!roomUsers[roomId]) {
          roomUsers[roomId] = new Set();
        }

        // Add user to active users for this room
        roomUsers[roomId].add(socket.id);

        // Get active users count
        const activeUsersCount = roomUsers[roomId].size;

        // Notify room that a new user joined
        socket.to(roomId).emit("user_joined", {
          userId: socket.user.userId,
          role: socket.user.role,
        });

        // Broadcast active users count to everyone in the room
        io.to(roomId).emit("active_users_count", activeUsersCount);
      } catch (error) {
        console.error("Socket join room error:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // Leave a chat room
    socket.on("leave_room", (roomId) => {
      handleLeaveRoom(socket, roomId);
    });

    // Function to handle leaving a room
    const handleLeaveRoom = (socket, roomId) => {
      socket.leave(roomId);
      userRooms.delete(roomId);
      console.log(`User ${socket.user.userId} left room: ${roomId}`);

      // Remove user from active users for this room
      if (roomUsers[roomId]) {
        roomUsers[roomId].delete(socket.id);

        // Get updated active users count
        const activeUsersCount = roomUsers[roomId].size;

        // Notify room that a user left
        socket.to(roomId).emit("user_left", {
          userId: socket.user.userId,
          role: socket.user.role,
        });

        // Broadcast active users count to everyone in the room
        io.to(roomId).emit("active_users_count", activeUsersCount);

        // Clean up empty room tracking
        if (roomUsers[roomId].size === 0) {
          delete roomUsers[roomId];
        }
      }
    };

    // Send a message
    socket.on("send_message", async (data) => {
      try {
        const { roomId, content, imageUrl } = data;
        const userId = socket.user.userId;
        const userModel = socket.user.role === "teacher" ? "Teachers" : "students";

        // Check if chat room exists
        const chatRoom = await ChatRoom.findById(roomId);
        if (!chatRoom) {
          socket.emit("error", { message: "Chat room not found" });
          return;
        }

        // Check if user is a participant
        const isParticipant = chatRoom.participants.some(
          (p) => p.userId.toString() === userId && p.userModel === userModel
        );

        if (!isParticipant) {
          socket.emit("error", {
            message: "You must join the chat room before sending messages",
          });
          return;
        }

        // Validate that at least content or imageUrl is provided
        if (!content && !imageUrl) {
          socket.emit("error", {
            message: "Message content or image is required",
          });
          return;
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

        // Broadcast the message to all users in the room
        io.to(roomId).emit("receive_message", message);
      } catch (error) {
        console.error("Socket send message error:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Moderate a message (teachers only)
    socket.on("moderate_message", async (data) => {
      try {
        const { messageId } = data;
        const teacherId = socket.user.userId;

        // Verify the user is a teacher
        if (socket.user.role !== "teacher") {
          socket.emit("error", { message: "Only teachers can moderate messages" });
          return;
        }

        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit("error", { message: "Message not found" });
          return;
        }

        // Check if teacher is a moderator for this chat room
        const chatRoom = await ChatRoom.findById(message.chatRoom);
        if (!chatRoom.moderators.includes(teacherId)) {
          socket.emit("error", {
            message: "You are not a moderator for this chat room",
          });
          return;
        }

        // Update message
        message.isModerated = true;
        message.moderatedBy = teacherId;
        message.isDeleted = true;

        await message.save();

        // Notify all users in the room that a message was moderated
        io.to(message.chatRoom.toString()).emit("message_moderated", {
          messageId: message._id,
          moderatedBy: teacherId,
        });
      } catch (error) {
        console.error("Socket moderate message error:", error);
        socket.emit("error", { message: "Failed to moderate message" });
      }
    });

    // Typing indicator
    socket.on("typing", (data) => {
      const { roomId } = data;

      // Broadcast to everyone in the room except the sender
      socket.to(roomId).emit("user_typing", {
        userId: socket.user.userId,
        role: socket.user.role,
      });
    });

    // Stop typing indicator
    socket.on("stop_typing", (data) => {
      const { roomId } = data;

      // Broadcast to everyone in the room except the sender
      socket.to(roomId).emit("user_stop_typing", {
        userId: socket.user.userId,
      });
    });

    // Request for active users count
    socket.on("get_active_users", (roomId) => {
      if (roomUsers[roomId]) {
        socket.emit("active_users_count", roomUsers[roomId].size);
      } else {
        socket.emit("active_users_count", 0);
      }
    });

    // Disconnect event
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);

      // Leave all rooms this socket was in
      for (const roomId of userRooms) {
        handleLeaveRoom(socket, roomId);
      }
    });
  });

  return io;
};

module.exports = { initializeSocket };




