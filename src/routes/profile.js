const express = require("express");
const mongoose = require("mongoose");
const { userAuth } = require("../middleware/userAuth");
const { validateEditProfile } = require("../utils/validation");
validateEditProfile;
const upload = require("../config/multer");
const User = require("../models/user");
const profileRouter = express.Router();
const cloudinary = require("../utils/cloudinary")
const fileUpload = require('express-fileupload');
const Post = require("../models/postModel")

profileRouter.post('/upload-photo', userAuth, async (req, res) => {
  try {
    console.log('Request Files:', req.files.photo); // Debugging

    // Check if file is uploaded
    if (!req.files || !req.files.photo) {
      console.log("no files",req.files.photo)
      return res.status(400).json({ message: 'No file uploaded or file key is incorrect' });
    }

    const user = req.user;
    const file = req.files?.photo;
console.log("Uploading to Cloudinary...");
    const result = await cloudinary.uploader.upload(`data:${file.mimetype};base64,${file.data.toString('base64')}`, {
      folder: 'profile-photos',
    });

console.log("Cloudinary Upload Result:", result);
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxFileSize) {
      return res.status(400).json({ message: 'File size exceeds the limit of 5MB.' });
    }
console.log("yes currect size")
       const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ message: 'Only JPEG, PNG, or WEBP images are allowed.' });
    }

    // Delete old photo from Cloudinary if it exists
    if (user.cloudinaryId) {
      await cloudinary.uploader.destroy(user.cloudinaryId);
    }
console.log("delete uerser")
    // Update user's profile photo and Cloudinary ID in the database
    user.photoUrl = result.secure_url;
    user.cloudinaryId = result.public_id;
    await user.save();
console.log("hahha")
    res.status(200).json({ message: 'Profile photo updated successfully', data: user });
  } catch (error) {
    console.error('Error uploading photo:', error.message);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
});




  profileRouter.patch('/profile/edit', userAuth, async (req, res) => {
    try {
      const loggedUser = req.user;
  
      // Validate the request body
      if (!validateEditProfile(req)) {
        return res.status(400).json({ message: 'Invalid update fields' });
      }
  
      // Update user details
      Object.keys(req.body).forEach((key) => (loggedUser[key] = req.body[key]));
  
      // Save the updated user
      await loggedUser.save();
  
      // Send success response
      res.status(200).json({
        message: `${loggedUser.firstName}, your profile has been successfully updated`,
        data: loggedUser,
      });
    } catch (error) {
      console.log(error);
      console.error('Error updating profile:', error); // Log the error for debugging
      res.status(500).json({ message: 'Profile update failed', error: error.message });
    }
  });




  profileRouter.get('/users/:userId/posts', userAuth, async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID', data: [] });
    }

    const posts = await Post.find({ user: userId }).sort({ createdAt: -1 });

    // ✅ Always return a "data" key — even if it's empty
    return res.status(200).json({
      message: posts.length ? 'Posts fetched successfully' : 'No posts found for this user',
      data: posts,
    });

  } catch (error) {
    console.error('Error fetching posts:', error);

    const status = error.name === 'CastError' ? 400 : 500;
    return res.status(status).json({
      message: error.name === 'CastError' ? 'Invalid data format' : 'Something went wrong',
      data: [], // ✅ Always include data field
      error: error.message,
    });
  }
});



  // Get user profile data (for logged-in user)
profileRouter.get('/profile/view', userAuth, async (req, res) => {
  try {
    const userId = req.user.id; // Use the authenticated user's ID

    // Find the user and exclude password and email
    const user = await User.findById(userId).select('-password -email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send response
    res.status(200).json({ message: 'Profile fetched successfully', data: user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
});


  module.exports = profileRouter;