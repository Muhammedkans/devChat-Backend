const Comment = require("../models/Comment");
const Post = require("../models/postModel"); // ✅ Step 1: Import Post model
const { getIO } = require("../utils/socket"); // ✅ For real-time update (if using socket.io)


// 🔥 Create Comment
const createComment = async (req, res) => {
  try {
    const { text } = req.body;
    const { postId } = req.params;
    const userId = req.user._id;

    // ✅ Create comment
    const comment = await Comment.create({
      text,
      post: postId,
      user: userId,
    });

    await comment.populate("user", "firstName lastName photoUrl");

    // ✅ Step 2: Increment comment count in Post
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $inc: { commentCount: 1 } },
      { new: true }
    );

    // ✅ Step 3: Emit socket event for comment count update
    const io = getIO(); // get socket instance
    io.emit("commentCountUpdate", {
      postId: updatedPost._id.toString(),
      commentCount: updatedPost.commentCount,
    });

    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    console.error("Comment error:", err);
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
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch comments" });
  }
};

module.exports = {
  createComment,
  getCommentsForPost,
};

