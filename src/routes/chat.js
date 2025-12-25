const express = require("express");
const { userAuth } = require("../middleware/userAuth");
const { Chat } = require("../models/chat");
const mongoose = require("mongoose");
const chatRouter = express.Router();

chatRouter.get("/chat/:targetUserId", userAuth, async (req, res) => {
  const { targetUserId } = req.params;
  const userId = req.user._id;

  try {
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: "Invalid target user ID" });
    }

    let chat = await Chat.findOne({
      participants: { $all: [userId, targetUserId] },
    }).populate({
      path: "messages.senderId",
      select: "firstName lastName photoUrl", // ✅ added photoUrl here
    });

    if (!chat) {
      chat = new Chat({
        participants: [userId, targetUserId],
        messages: [],
      });
      await chat.save();
    }

    res.json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 🎤 Upload Voice Note
const cloudinary = require("../utils/cloudinary");

chatRouter.post("/chat/upload-audio", userAuth, async (req, res) => {
  try {
    if (!req.files || !req.files.audio) {
      return res.status(400).json({ message: "No audio file uploaded" });
    }

    const file = req.files.audio;
    console.log("🎤 Received Audio File:", file.name, file.mimetype, file.size);

    // Upload to Cloudinary with 'auto' resource type to handle various formats
    const result = await cloudinary.uploader.upload(`data:${file.mimetype};base64,${file.data.toString("base64")}`, {
      resource_type: "auto",
      folder: "chat-voice-notes",
    });

    console.log("✅ Audio Uploaded to Cloudinary:", result.secure_url);

    res.status(200).json({
      message: "Audio uploaded successfully",
      audioUrl: result.secure_url
    });
  } catch (error) {
    console.error("Audio Upload Error:", error);
    res.status(500).json({ message: "Failed to upload audio", error: error.message });
  }
});

module.exports = chatRouter;


