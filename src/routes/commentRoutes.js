// routes/commentRoutes.js
const express = require("express")

const { createComment, getCommentsForPost } = require("../controllers/commentController");
const { userAuth } = require("../middleware/userAuth");

const commentRouter = express.Router();

commentRouter.post("/posts/:postId/comment",userAuth, createComment);
commentRouter.get("/posts/:postId/comments",userAuth, getCommentsForPost);

module.exports = commentRouter;

