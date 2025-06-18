
const express = require("express");
const { userAuth } = require("../middleware/userAuth");
const { Chat } = require("../models/chat");
const mongoose = require("mongoose")
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
      select: "firstName lastName",
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


module.exports = chatRouter;