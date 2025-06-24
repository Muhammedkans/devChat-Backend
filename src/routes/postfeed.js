const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/user");
const Post = require("../models/postModel");
const { userAuth } = require("../middleware/userAuth");

const postFeed = express.Router();

// ✅ Route to get feed posts
postFeed.get("/postFeed", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Get user's following
    const user = await User.findById(userId).select("following");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const authors = [...user.following, userId];

    // ✅ Fetch posts (commentCount already stored)
    const posts = await Post.find({ user: { $in: authors } })
      .sort({ createdAt: -1 })
      .populate("user", "firstName lastName photoUrl")
      .lean();

    // ✅ No need to recalculate commentCount

    res.status(200).json({
      message: "Feed fetched successfully",
      data: posts,
    });

  } catch (error) {
    console.error("Error fetching feed:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
});

module.exports = postFeed;


