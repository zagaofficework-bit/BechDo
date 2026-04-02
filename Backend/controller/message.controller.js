const Message = require("../models/message.model");
const uploadToCloudinary = require("../helper/cloudinaryUpload");
const User = require("../models/user.model");

/* ─────────────────────────────────────────
   HELPER — build deterministic room ID
───────────────────────────────────────── */
const getRoomId = (userId1, userId2) => {
  const users = [userId1.toString(), userId2.toString()].sort();
  return `${users[0]}_${users[1]}`;
};

/* ─────────────────────────────────────────
   SEND MESSAGE
───────────────────────────────────────── */
async function sendMessage(req, res) {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user._id;

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (sender.role === "seller" && receiver.role === "seller") {
      return res.status(403).json({
        success: false,
        message: "Sellers can only chat with admin",
      });
    }

    let imageUrl = "";
    if (req.file) {
      const upload = await uploadToCloudinary(req.file.buffer, {
        resourceType: "image",
        folder: "cashify_chat",
      });
      imageUrl = upload.secure_url;
    }

    const newMessage = await Message.create({
      from: senderId,
      to: receiverId,
      message,
      image: imageUrl,
      messageType: imageUrl ? "image" : "text",
    });

    const populatedMessage = await newMessage.populate([
      { path: "from", select: "firstname lastname role" },
      { path: "to", select: "firstname lastname role" },
    ]);

    const roomId = getRoomId(senderId, receiverId);
    const io = req.app.get("io");
    io.to(roomId).emit("newMessage", populatedMessage);

    res.status(201).json({
      success: true,
      message: "Message sent",
      data: populatedMessage,
    });

  } catch (error) {
    console.error("sendMessage error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
}

/* ─────────────────────────────────────────
   GET MESSAGES
───────────────────────────────────────── */
async function getMessages(req, res) {
  try {
    const { receiverId } = req.query;
    const currentUserId = req.user._id;

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "receiverId is required",
      });
    }

    const currentUser = await User.findById(currentUserId);
    const receiver = await User.findById(receiverId);

    if (!currentUser || !receiver) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (currentUser.role === "seller" && receiver.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Sellers can only fetch messages with admin",
      });
    }

    if (currentUser.role === "admin" && receiver.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "Admin can only fetch messages with sellers",
      });
    }

    const messages = await Message.find({
      $or: [
        { from: currentUserId, to: receiverId },
        { from: receiverId, to: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("from", "firstname lastname role")
      .populate("to", "firstname lastname role");

    const roomId = getRoomId(currentUserId, receiverId);

    res.status(200).json({
      success: true,
      roomId,
      count: messages.length,
      messages,
    });

  } catch (error) {
    console.error("getMessages error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching messages",
    });
  }
}

/* ─────────────────────────────────────────
   DELETE MESSAGE
───────────────────────────────────────── */
async function deleteMessage(req, res) {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    if (message.from.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages",
      });
    }

    await Message.findByIdAndDelete(messageId);

    const roomId = getRoomId(message.from, message.to);
    const io = req.app.get("io");
    io.to(roomId).emit("messageDeleted", { messageId });

    res.status(200).json({
      success: true,
      message: "Message deleted",
    });

  } catch (error) {
    console.error("deleteMessage error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting message",
    });
  }
}

module.exports = {
  sendMessage,
  getMessages,
  deleteMessage,
};