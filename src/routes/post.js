const express = require("express");
const { userAuth } = require("../middleware/userAuth");
const Post = require("../models/postModel");
const cloudinary = require("cloudinary");
const Like =  require("../models/like");
const mongoose = require("mongoose");
const postRouter = express.Router();
const User = require("../models/user")

postRouter.post('/posts', userAuth, async (req, res) => {
  try {
    // Get the authenticated user info from userAuth middleware
    const user = req.user;

    // Get the optional text content from the request body
    // (when the client sends text with the post, it should be in req.body.contentText)
    const contentText = req.body.contentText || ''; // If no text sent, make it empty string

    // Initialize an empty variable to hold the image URL
    let contentImageUrl = '';

    // Check if the request has files (image uploaded)
    if (req.files && req.files.photo) {
      const file = req.files.photo; // Get the uploaded image file

      // Debug print file info for developer to check
      console.log('File Details:', {
        name: file.name,
        size: file.size,
        mimetype: file.mimetype,
        tempFilePath: file.tempFilePath,
      });

      // Allowed image MIME types — these are the formats we accept
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

      // Check if uploaded file is allowed type
      if (!allowedMimeTypes.includes(file.mimetype)) {
        console.log(file.mimetype);
        return res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.' });
      }

      // Limit file size to max 5MB
      const maxFileSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxFileSize) {
        return res.status(400).json({ message: 'File size exceeds the limit of 5MB.' });
      }

      // Upload the image to Cloudinary
      // Note: We convert file buffer to base64 string and send to Cloudinary uploader
      const result = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.data.toString('base64')}`, 
        {
          folder: 'posts', // Put the image inside 'posts' folder in Cloudinary
        }
      );

      // Store the secure Cloudinary URL in contentImageUrl to save later
      contentImageUrl = result.secure_url;
    }

    // Validation: 
    // If both contentText is empty AND no image was uploaded, then return error
    if (!contentText && !contentImageUrl) {
      return res.status(400).json({ message: 'Please provide text content or upload an image for the post.' });
    }

    // Create new Post document with the available data
    const post = new Post({
      contentText,        // Save text content (may be empty)
      contentImageUrl,    // Save image URL (may be empty)
      user: user._id,     // Save reference to the user who created the post
    });

    // Save the post in the database (MongoDB)
    await post.save();

    // Update user's posts count by 1 (increase by 1)
    user.postsCount += 1;
    await user.save();

    // Respond to client with success message and the new post data
    res.status(201).json({ message: 'Post created successfully', data: post });

  } catch (error) {
    // If anything goes wrong in the above steps, catch the error and print it
    console.error('Error creating post:', error);
    // Send generic error message to client with error details
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
});





postRouter.post('/posts/:postId/like', userAuth, async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id; // Authenticated user's ID

    // Simple validation: Check if postId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    // Step 1: Check if the user already liked the post
    const existingLike = await Like.findOne({ user: userId, post: postId });
    if (existingLike) {
      return res.status(400).json({ message: 'You already liked this post' });
    }

    // Step 2: Create a new Like record
    const like = new Like({ user: userId, post: postId });
    await like.save();

    // Step 3: Update the Post's likes array
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    post.likes.push(userId); // Add user to the likes array
    await post.save();

    // Step 4: Increment the User's likesCount
    const postUser = await User.findById(post.user); // User who created the post
    if (!postUser) {
      return res.status(404).json({ message: 'Post creator not found' });
    }
    postUser.likesCount += 1; // Increment likesCount
    await postUser.save();

    // Step 5: Send success response
    res.status(201).json({ message: 'Post liked successfully', data: like });
  } catch (error) {
    console.error('Error liking post:', error);

    // Handle specific errors
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid data format' });
    }

    // Generic error response
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
});





postRouter.delete('/posts/:postId/like', userAuth, async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id; // Authenticated user's ID

    // Simple validation: Check if postId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    // Step 1: Check if the user has liked the post
    const existingLike = await Like.findOne({ user: userId, post: postId });
    if (!existingLike) {
      return res.status(400).json({ message: 'You have not liked this post' });
    }

    // Step 2: Remove the Like record
    await Like.deleteOne({ _id: existingLike._id });

    // Step 3: Update the Post's likes array
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    post.likes = post.likes.filter((id) => id.toString() !== userId); // Remove user from likes array
    await post.save();

    // Step 4: Decrement the User's likesCount
    const postUser = await User.findById(post.user); // User who created the post
    if (!postUser) {
      return res.status(404).json({ message: 'Post creator not found' });
    }
    postUser.likesCount -= 1; // Decrement likesCount
    await postUser.save();

    // Step 5: Send success response
    res.status(200).json({ message: 'Post unliked successfully' });
  } catch (error) {
    console.error('Error unliking post:', error);

    // Handle specific errors
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid data format' });
    }

    // Generic error response
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
});

postRouter.get("/posts/all",userAuth,async (req, res)=>{
try {
   const userId = req.user._id;

    const posts = await Post.find({ user: userId }).populate("user", "firstName lastName photoUrl");

    res.status(200).json({ success: true, posts });
  } catch (error) {
    console.error("Error fetching user posts:", error.message);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
})
module.exports = postRouter;




