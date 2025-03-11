const mongoose = require("mongoose");


const likeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User who liked the post
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true }, // Post that was liked
  createdAt: { type: Date, default: Date.now }, // Timestamp
});

const Like = mongoose.model('Like', likeSchema);
module.exports = Like;