const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  contentImageUrl:{
    type:String,
    required:false
  },
  contentText: {
    type: String,
    required: false // Optional text content
  },
  user:{
    type: mongoose.Schema.Types.ObjectId,
    required:true,
    ref:'User'
  },
  likes:[{type:mongoose.Schema.Types.ObjectId, ref: 'User'}]
},{timestamps:true})


const Post = mongoose.model('Post', postSchema);

module.exports =Post;