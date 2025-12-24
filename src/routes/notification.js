const express = require("express");
const { userAuth } = require("../middleware/userAuth");
const Notification = require("../models/Notification");

const notificationRouter = express.Router();

// 🔔 GET /notifications - Get all notifications for logged in user
notificationRouter.get("/notifications", userAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("sender", "firstName lastName photoUrl")
      .populate("post", "contentText")
      .sort({ createdAt: -1 });

    res.status(200).json({ data: notifications });
  } catch (error) {
    console.error("Notification Error:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

module.exports = notificationRouter;
