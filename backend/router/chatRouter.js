const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
  createChatRoom,
  getAllChatRooms,
  getChatRoomById,
  joinChatRoom,
  addModerator,
  deleteChatRoom,
  countChatRooms,
} = require("../controller/chatRoomController");
const { sendMessage, getMessages, moderateMessage } = require("../controller/messageController");
const upload = require("../middleware/multerConfig");

// Chat room routes
router.post("/rooms", verifyToken, createChatRoom);
router.get("/rooms", verifyToken, getAllChatRooms);
router.get("/rooms/:roomId", verifyToken, getChatRoomById);
router.post("/rooms/:roomId/join", verifyToken, joinChatRoom);
router.post("/rooms/moderator", verifyToken, addModerator);
router.delete("/rooms/:roomId", verifyToken, deleteChatRoom);
router.get("/count", verifyToken, countChatRooms);

// Message routes
router.post("/messages", verifyToken, sendMessage);
router.post("/messages/image", verifyToken, upload.single("image"), sendMessage); // Route for image uploads
router.get("/rooms/:roomId/messages", verifyToken, getMessages);
router.patch("/messages/:messageId/moderate", verifyToken, moderateMessage);

module.exports = router;







