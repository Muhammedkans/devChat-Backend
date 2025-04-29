const express  = require("express");
const mongoose = require("mongoose")

const User = require("../models/user");
const { userAuth } = require("../middleware/userAuth");
const postFeed = express.Router();
const Post = require("../models/post")



postFeed.get('/postFeed', userAuth, async (req, res) => {
  try {
    const userId = req.user._id; // Logged-in user's ID

    // Simple validation: Check if userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Find the logged-in user and populate their following list
    const user = await User.findById(userId).select('following');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch posts from users the logged-in user is following
    const posts = await Post.find({ user: { $in: user.following } })
      .sort({ createdAt: -1 }) // Sort by latest first
      .populate('user', 'firstName lastName photoUrl'); // Include user details

    // Check if posts exist
    if (!posts || posts.length === 0) {
      return res.status(404).json({ message: 'No posts found in your feed' });
    }

    // Send success response
    res.status(200).json({ message: 'Feed fetched successfully', data: posts });
  } catch (error) {
    console.error('Error fetching feed:', error);

    // Handle specific errors
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid data format' });
    }

    // Generic error response
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
}); 

module.exports =postFeed