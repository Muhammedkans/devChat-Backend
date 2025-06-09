// controllers/commentController.js
const Comment = require("../models/Comment")

// 🔥 Create Comment
 const createComment = async (req, res) => {
  try {
    const { text } = req.body;
    const { postId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.create({
      text,
      post: postId,
      user: userId,
    });

    await comment.populate("user", "firstName lastName photoUrl");

    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to add comment" });
  }
};

// 📥 Get All Comments
 const getCommentsForPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({ post: postId })
      .sort({ createdAt: -1 })
      .populate("user", "firstName lastName photoUrl");

    res.status(200).json({ success: true, data: comments });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch comments" });
  }
};


module.exports = {
  createComment,
  getCommentsForPost
}
