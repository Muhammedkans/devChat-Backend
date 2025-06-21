const express  = require("express");
const mongoose = require("mongoose")

const User = require("../models/user");
const { userAuth } = require("../middleware/userAuth");
const postFeed = express.Router();
const Post = require("../models/postModel")

postFeed.get('/postFeed', userAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Get the user's following list
    const user = await User.findById(userId).select('following');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Include own ID in the feed
    const authorsToShow = [...user.following, userId];

    const posts = await Post.find({ user: { $in: authorsToShow } })
      .sort({ createdAt: -1 })
      .populate('user', 'firstName lastName photoUrl');

    return res.status(200).json({ message: 'Feed fetched', data: posts });

  } catch (error) {
    console.error('Error fetching feed:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid data format' });
    }

    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
});





module.exports =postFeed