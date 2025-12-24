const express = require("express");
const mongoose = require("mongoose")
const { userAuth } = require("../middleware/userAuth");
const Post = require("../models/postModel");
const cloudinary = require("cloudinary").v2;
const postRouter = express.Router();
const User = require("../models/user");
const Like = require("../models/like");
const { moderateContent } = require("../utils/aiModerator"); // 🤖 AI Moderator
postRouter.post("/posts", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const contentText = req.body.contentText || "";
    let contentImageUrl = "";

    if (req.files && req.files.photo) {
      const file = req.files.photo;

      // ✅ Validate MIME type
      const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return res.status(400).json({ message: "Invalid image type" });
      }

      // ✅ Validate size (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return res.status(400).json({ message: "Image too large" });
      }

      // ✅ Convert to base64 and upload to Cloudinary
      const base64Image = file.data.toString("base64");
      const dataUri = `data:${file.mimetype};base64,${base64Image}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: "posts",
      });

      contentImageUrl = result.secure_url;
    }

    const { moderateContent } = require("../utils/aiModerator"); // 🤖 AI Moderator

    if (!contentText && !contentImageUrl) {
      return res.status(400).json({ message: "Post must have text or image" });
    }

    // 🤖 AI Safety Check
    const moderationResult = moderateContent(contentText);
    if (!moderationResult.isSafe) {
      return res.status(400).json({
        message: "Your post failed our Community Guidelines check.",
        reason: moderationResult.reason,
        flagged: moderationResult.flaggedWords
      });
    }

    const post = new Post({
      contentText,
      contentImageUrl,
      user: user._id,
    });

    await post.save();

    user.postsCount += 1;
    await user.save();

    res.status(201).json({ message: "Post created", data: post });
  } catch (err) {
    console.error("❌ Post upload error:", err);
    res.status(500).json({ message: "Something went wrong", error: err.message });
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

    // 🔔 Create Notification (If not liking own post)
    if (String(postUser._id) !== String(userId)) {
      const Notification = require("../models/Notification");
      await Notification.create({
        recipient: postUser._id,
        sender: userId,
        type: "like",
        post: post._id,
      });
    }

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

postRouter.get("/posts/all", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    const posts = await Post.find({ user: userId }).populate("user", "firstName lastName photoUrl");

    res.status(200).json({ success: true, posts });
  } catch (error) {
    console.error("Error fetching user posts:", error.message);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
});

// 🔖 Save/Bookmark a Post
postRouter.post("/posts/:postId/save", userAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const user = await User.findById(req.user._id);

    if (user.savedPosts.includes(postId)) {
      return res.status(400).json({ message: "Post already saved" });
    }

    user.savedPosts.push(postId);
    await user.save();

    res.status(200).json({ message: "Post saved successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// ❌ Unsave/Remove Bookmark
postRouter.delete("/posts/:postId/save", userAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const user = await User.findById(req.user._id);

    user.savedPosts = user.savedPosts.filter((id) => id.toString() !== postId);
    await user.save();

    res.status(200).json({ message: "Post removed from bookmarks" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// 📂 Get All Saved Posts
postRouter.get("/posts/saved", userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "savedPosts",
      populate: { path: "user", select: "firstName lastName photoUrl" }
    });

    res.status(200).json({ data: user.savedPosts });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

module.exports = postRouter;




