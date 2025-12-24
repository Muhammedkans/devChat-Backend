const express = require("express");
const { userAuth } = require("../middleware/userAuth");
const ProfileView = require("../models/ProfileView");
const User = require("../models/user");
const analyticsRouter = express.Router();

// 👁️ Record a Profile View
analyticsRouter.post("/profile/view/:userId", userAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const viewerId = req.user._id;

    // Don't record own views
    if (String(userId) === String(viewerId)) {
      return res.status(200).json({ message: "Own profile view not recorded" });
    }

    // Check if viewed recently (optional: e.g., last 24h)
    const recentView = await ProfileView.findOne({
      viewedUser: userId,
      viewer: viewerId,
      createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (!recentView) {
      await ProfileView.create({ viewedUser: userId, viewer: viewerId });
    }

    res.status(200).json({ message: "View recorded" });
  } catch (error) {
    res.status(500).json({ message: "Error recording view", error: error.message });
  }
});

// 📈 Get Profile Analytics
analyticsRouter.get("/profile/analytics", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const isPremium = req.user.isPremium;

    const views = await ProfileView.find({ viewedUser: userId })
      .populate("viewer", "firstName lastName photoUrl headline")
      .sort({ createdAt: -1 });

    const totalViews = views.length;

    if (!isPremium) {
      // Return only count and limited data for non-premium
      return res.status(200).json({
        totalViews,
        message: "Upgrade to Premium to see who viewed your profile!",
        data: [] // Empty list for non-premium
      });
    }

    res.status(200).json({
      totalViews,
      data: views
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching analytics", error: error.message });
  }
});

module.exports = analyticsRouter;
