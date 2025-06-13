const socket = require("socket.io");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { Chat } = require("../models/chat");
const { Post } = require("../models/post");

const getSecretRoomId = (userId, targetUserId) => {
  return crypto.createHash("sha256")
    .update([userId, targetUserId].sort().join("-"))
    .digest("hex");
};

const initializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "https://mkans-dev-chat-web.vercel.app",
      ],
      credentials: true,
    },
  });

  // 🛡️ JWT Authentication Middleware
  io.use((socket, next) => {
    try {
      const cookies = socket.handshake.headers.cookie;
      const token = cookies?.split("=")[1];

      if (!token) return next(new Error("Token missing"));

      jwt.verify(token, process.env.JWT_TOKEN, (err, decoded) => {
        if (err) return next(new Error("Invalid token"));
        socket.user = decoded;
        next();
      });
    } catch (err) {
      next(new Error("Auth error"));
    }
  });

  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.user._id);
    socket.join(socket.user._id);

    // ---------------- 🗨️ CHAT ----------------
    socket.on("joinChat", ({ targetUserId }) => {
      const roomId = getSecretRoomId(socket.user._id, targetUserId);
      socket.join(roomId);
    });

    socket.on("sendMessage", async ({ targetUserId, text }) => {
      try {
        const roomId = getSecretRoomId(socket.user._id, targetUserId);

        let chat = await Chat.findOne({
          participants: { $all: [socket.user._id, targetUserId] },
        });

        if (!chat) {
          chat = new Chat({
            participants: [socket.user._id, targetUserId],
            messages: [],
          });
        }

        const newMessage = {
          senderId: socket.user._id,
          text,
          createdAt: new Date(),
        };

        chat.messages.push(newMessage);
        await chat.save();

        io.to(roomId).emit("messageReceived", newMessage);
      } catch (err) {
        console.error("Send Message Error:", err);
      }
    });

    // ---------------- ❤️ LIKE / UNLIKE ----------------
    socket.on("likeUpdate", async ({ postId, action }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(postId)) {
          throw new Error("Invalid postId");
        }

        const post = await Post.findById(postId);
        if (!post) throw new Error("Post not found");

        const actingUserId = socket.user._id;
        const hasLiked = post.likes.some(
          (id) => id.toString() === actingUserId.toString()
        );

        let updated = false;

        if (action === "like" && !hasLiked) {
          post.likes.push(actingUserId);
          updated = true;
        } else if (action === "unlike" && hasLiked) {
          post.likes = post.likes.filter(
            (id) => id.toString() !== actingUserId.toString()
          );
          updated = true;
        }

        if (updated) {
          await post.save();

          io.emit("likeUpdate", {
            postId,
            userId: actingUserId,
            action,
          });
        }
      } catch (err) {
        console.error("Socket Like Error:", err.message);
        socket.emit("likeError", { message: err.message });
      }
    });

    // ---------------- 💬 COMMENT ----------------
    socket.on("commentPost", async ({ postId, text }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(postId)) {
          throw new Error("Invalid postId");
        }

        const post = await Post.findById(postId);
        if (!post) throw new Error("Post not found");

        const newComment = {
          _id: new mongoose.Types.ObjectId(),
          user: socket.user._id,
          text,
          createdAt: new Date(),
        };

        post.comments.unshift(newComment);
        await post.save();

        io.emit("postCommented", {
          postId,
          comment: newComment,
        });
      } catch (err) {
        console.error("Comment error:", err.message);
        socket.emit("commentError", { message: err.message });
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.user._id);
    });
  });

  return io;
};

module.exports = initializeSocket;







