const express = require("express");
const { userAuth } = require("../middleware/userAuth");
const { validateEditProfile } = require("../utils/validation");
validateEditProfile;
const upload = require("../config/multer");
const User = require("../models/user");
const profileRouter = express.Router();
const cloudinary = require("../utils/cloudinary")
const fileUpload = require('express-fileupload');
const Post = require("../models/post")
profileRouter.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
}));

profileRouter.post('/upload-photo', userAuth, async (req, res) => {
  try {
    console.log('Request Files:', req.files); // Debugging

    // Check if file is uploaded
    if (!req.files || !req.files.photo) {
      return res.status(400).json({ message: 'No file uploaded or file key is incorrect' });
    }

    const user = req.user;
    const file = req.files?.photo;

    const result = await cloudinary.uploader.upload(`data:${file.mimetype};base64,${file.data.toString('base64')}`, {
      folder: 'profile-photos',
    });


    const maxFileSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxFileSize) {
      return res.status(400).json({ message: 'File size exceeds the limit of 5MB.' });
    }

    // Delete old photo from Cloudinary if it exists
    if (user.cloudinaryId) {
      await cloudinary.uploader.destroy(user.cloudinaryId);
    }

    // Update user's profile photo and Cloudinary ID in the database
    user.photoUrl = result.secure_url;
    user.cloudinaryId = result.public_id;
    await user.save();

    res.status(200).json({ message: 'Profile photo updated successfully', data: user });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
});





profileRouter.get('/posts/allpost', userAuth, async (req, res) => {
  try {
    const userId = req.user._id; // Get the authenticated user's ID

    // Fetch all posts by the user
    const posts = await Post.find({ user: userId }).sort({ createdAt: -1 }); // Sort by latest first

    res.status(200).json({ message: 'Posts fetched successfully', data: posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
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
      console.error('Error updating profile:', error); // Log the error for debugging
      res.status(500).json({ message: 'Profile update failed', error: error.message });
    }
  });



  profileRouter.get('/users/:userId/posts', userAuth, async (req, res) => {
    try {
      const userId = req.params.userId;
  
      // Fetch all posts by the user
      const posts = await Post.find({ user: userId }).sort({ createdAt: -1 }); // Sort by latest first
  
   if(!posts){
    return res.status(400).json({message: 'no posts found'});
   }

      res.status(200).json({ message: 'Posts fetched successfully', data: posts });
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
  });



  module.exports = profileRouter;