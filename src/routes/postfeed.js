const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/user");
const Post = require("../models/postModel");
const { userAuth } = require("../middleware/userAuth");

const postFeed = express.Router();

// ✅ Route to get all posts (not just followed users)
postFeed.get("/postFeed", userAuth, async (req, res) => {
  try {
    // ✅ Fetch all posts from all users, newest first
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .populate("user", "firstName lastName photoUrl") // show user info
      .lean();

    res.status(200).json({
      message: "Public feed fetched successfully",
      data: posts,
    });

  } catch (error) {
    console.error("❌ Error fetching public feed:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
});

module.exports = postFeed;



