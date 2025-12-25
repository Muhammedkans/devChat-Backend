// controllers/userController.js

const mongoose = require("mongoose");
const User = require("../models/user");
const Post = require("../models/postModel.js");

const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedInUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 📸 Fetch user posts (using correct field name 'user')
    const posts = await Post.find({ user: userId }) // Fixed: creatorId -> user
      .select("contentImageUrl contentText likes commentCount createdAt")
      .sort({ createdAt: -1 })
      .lean();

    // 👀 Check if logged-in user follows this profile
    const isFollowing = user.followers?.some(
      (followerId) => followerId.toString() === loggedInUserId.toString()
    ) || false;

    // 📦 Return only required info
    res.json({
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        about: user.about || "",
        photoUrl: user.photoUrl || "",
        isPremium: user.isPremium || false,
        postsCount: posts.length,
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0,
        isFollowing,
        posts: posts.map((post) => ({
          _id: post._id,
          contentImageUrl: post.contentImageUrl || "",
          contentText: post.contentText || "",
          likes: post.likes || [],
          commentCount: post.commentCount || 0,
        })),
      }
    });
  } catch (error) {
    console.error("❌ getUserProfile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getUserProfile,
};
