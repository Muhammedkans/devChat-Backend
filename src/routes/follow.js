const express  = require("express");
const mongoose = require("mongoose")

const User = require("../models/user");
const { userAuth } = require("../middleware/userAuth");
const followRouter = express.Router();




// Follow a user
followRouter.post('/users/:userId/follow', userAuth, async (req, res) => {
  try {
    const targetUserId = req.params.userId; // User to follow
    const currentUserId = req.user.id; // Authenticated user's ID

    // Simple validation: Check if targetUserId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Step 1: Check if the user is trying to follow themselves
    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    // Step 2: Check if the user is already following the target user
    const currentUser = await User.findById(currentUserId);
    if (currentUser.following.includes(targetUserId)) {
      return res.status(400).json({ message: 'You are already following this user' });
    }

    // Step 3: Add the target user to the current user's following array
    currentUser.following.push(targetUserId);
    currentUser.followingCount += 1; // Increment followingCount
    await currentUser.save();

    // Step 4: Add the current user to the target user's followers array
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    targetUser.followers.push(currentUserId);
    targetUser.followersCount += 1; // Increment followersCount
    await targetUser.save();

    // Step 5: Send success response
    res.status(200).json({ message: 'Followed successfully', data: targetUser });
  } catch (error) {
    console.error('Error following user:', error);

    // Handle specific errors
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid data format' });
    }

    // Generic error response
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
});




// Unfollow a user
followRouter.delete('/users/:userId/unfollow', userAuth, async (req, res) => {
  try {
    const targetUserId = req.params.userId; // User to unfollow
    const currentUserId = req.user.id; // Authenticated user's ID

    // Simple validation: Check if targetUserId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Step 1: Check if the user is trying to unfollow themselves
    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: 'You cannot unfollow yourself' });
    }

    // Step 2: Check if the user is following the target user
    const currentUser = await User.findById(currentUserId);
    if (!currentUser.following.includes(targetUserId)) {
      return res.status(400).json({ message: 'You are not following this user' });
    }

    // Step 3: Remove the target user from the current user's following array
    currentUser.following = currentUser.following.filter((id) => id.toString() !== targetUserId);
    currentUser.followingCount -= 1; // Decrement followingCount
    await currentUser.save();

    // Step 4: Remove the current user from the target user's followers array
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    targetUser.followers = targetUser.followers.filter((id) => id.toString() !== currentUserId);
    targetUser.followersCount -= 1; // Decrement followersCount
    await targetUser.save();

    // Step 5: Send success response
    res.status(200).json({ message: 'Unfollowed successfully', data: targetUser });
  } catch (error) {
    console.error('Error unfollowing user:', error);

    // Handle specific errors
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid data format' });
    }

    // Generic error response
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
});


module.exports = followRouter;