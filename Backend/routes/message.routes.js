const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const messageController = require("../controller/message.controller");
const { ChatUpload } = require("../middleware/multer.middleware");

// Send a message (with optional image)
router.post("/send", authMiddleware.authMiddleware, ChatUpload, messageController.sendMessage);

// Get messages between two users
router.get("/", authMiddleware.authMiddleware, messageController.getMessages);

// Delete a single message
router.delete("/:messageId", authMiddleware.authMiddleware, messageController.deleteMessage);

module.exports = router;