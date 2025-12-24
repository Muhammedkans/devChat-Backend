const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/user");
const Post = require("../models/postModel");
const { userAuth } = require("../middleware/userAuth");

const postFeed = express.Router();

// ✅ Route to get all posts (not just followed users)
// ✅ Optimized Route with Pagination (Lazy Loading)
postFeed.get("/postFeed", userAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // ✅ Fetch only `limit` posts at a time (Fast & Scalable)
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "firstName lastName photoUrl headline") // Added headline
      .lean();

    const totalPosts = await Post.countDocuments();
    const hasMore = skip + posts.length < totalPosts;

    res.status(200).json({
      message: "Public feed fetched successfully",
      data: posts,
      pagination: {
        page,
        limit,
        hasMore,
        totalPosts
      }
    });

  } catch (error) {
    console.error("❌ Error fetching public feed:", error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
});

module.exports = postFeed;



