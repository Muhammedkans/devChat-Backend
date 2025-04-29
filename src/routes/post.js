const express = require("express");
const { userAuth } = require("../middleware/userAuth");
const Post = require("../models/post");
const cloudinary = require("cloudinary");
const Like =  require("../models/like");
const mongoose = require("mongoose");
const postRouter = express.Router();
const User = require("../models/user")


postRouter.post('/posts', userAuth, async (req, res) => {
  try {
    console.log('Request Files:', req.files); // Debugging

    const user = req.user;

    // Check if a file is uploaded
    if (!req.files || !req.files.photo) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.files.photo; // Get the uploaded file

    // Log the file details
    console.log('File Details:', {
      name: file.name,
      size: file.size,
      mimetype: file.mimetype,
      tempFilePath: file.tempFilePath,
    });

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif','image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      console.log(file.mimetype)
      return res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG, and GIF are allowed.' });
    }

    // Validate file size (5MB limit)
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxFileSize) {
      return res.status(400).json({ message: 'File size exceeds the limit of 5MB.' });
    }

    // Upload the photo to Cloudinary
    const result = await cloudinary.uploader.upload(`data:${file.mimetype};base64,${file.data.toString('base64')}`, {
      folder: 'posts',
    });

    // Create a new post with the photo URL
    const post = new Post({
      contentImageUrl: result.secure_url, // Save the photo URL
      user: user._id, // Save the user ID
    });

    // Save the post to the database
    await post.save();

    // Increment the user's posts count
    user.postsCount += 1;
    await user.save();

    // Send a success response
    res.status(201).json({ message: 'Post created successfully', data: post });
  } catch (error) {
    console.error('Error creating post:', error);
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


module.exports = postRouter;




