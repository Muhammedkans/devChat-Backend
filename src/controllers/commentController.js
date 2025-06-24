const Comment = require("../models/Comment");
const Post = require("../models/postModel");
const { getIO } = require("../utils/socket");

// ✅ CREATE COMMENT (Real-time Safe & Clean)
const createComment = async (req, res) => {
  try {
    const { text } = req.body;
    const { postId } = req.params;
    const userId = req.user._id;

    if (!text || !postId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // ✅ Create the new comment
    const comment = await Comment.create({
      text,
      post: postId,
      user: userId,
    });

    // ✅ Populate user fields for frontend display
    await comment.populate("user", "firstName lastName photoUrl");

    // ✅ Get accurate comment count from DB
    const commentCount = await Comment.countDocuments({ post: postId });

    // ✅ Update post comment count
    await Post.findByIdAndUpdate(postId, { commentCount });

    // ✅ Emit real-time events to all clients
    const io = getIO();
    io.emit("newComment", { postId, comment });
    io.emit("commentCountUpdate", { postId, commentCount });

    // ✅ Send response
    res.status(201).json({
      success: true,
      data: comment,
    });

  } catch (err) {
    console.error("❌ Comment creation failed:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to add comment",
    });
  }
};

// ✅ GET COMMENTS FOR A SPECIFIC POST
const getCommentsForPost = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!postId) {
      return res.status(400).json({
        success: false,
        message: "Post ID is required",
      });
    }

    const comments = await Comment.find({ post: postId })
      .sort({ createdAt: -1 })
      .populate("user", "firstName lastName photoUrl")
      .lean();

    res.status(200).json({
      success: true,
      data: comments,
    });

  } catch (err) {
    console.error("❌ Fetching comments failed:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch comments",
    });
  }
};

module.exports = {
  createComment,
  getCommentsForPost,
};







