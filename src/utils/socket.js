const socketIO = require("socket.io");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { Chat } = require("../models/chat");
const User = require("../models/user");

const getSecretRoomId = (userId1, userId2) => {
  return crypto
    .createHash("sha256")
    .update([userId1, userId2].sort().join("-"))
    .digest("hex");
};

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: ["http://localhost:5173", "https://mkans-dev-chat-web.vercel.app"],
      credentials: true,
    },
  });

  const onlineUsers = new Set();

  // ✅ Authenticate user using token from cookies
  io.use((socket, next) => {
    try {
      const cookie = socket.handshake.headers.cookie;
      if (!cookie) return next(new Error("Cookie not found"));

      const token = cookie.split("=")[1];
      if (!token) return next(new Error("Token missing"));

      jwt.verify(token, process.env.JWT_TOKEN, (err, decoded) => {
        if (err) return next(new Error("Invalid token"));
        socket.user = decoded;
        next();
      });
    } catch (err) {
      console.error("Socket auth error:", err.message);
      return next(new Error("Authentication failed"));
    }
  });

  // ✅ On new socket connection
  io.on("connection", (socket) => {
    const userId = socket.user._id;
    console.log("✅ Socket connected:", userId);

    // ✅ Mark user online
    onlineUsers.add(userId);
    io.emit("updateOnlineUsers", Array.from(onlineUsers));
    socket.join(userId); // optional personal room

    // ✅ Emit userOnline manually if frontend emits it again
    socket.on("userOnline", (userIdFromClient) => {
      if (userIdFromClient && !onlineUsers.has(userIdFromClient)) {
        onlineUsers.add(userIdFromClient);
        io.emit("updateOnlineUsers", Array.from(onlineUsers));
        console.log("📡 userOnline emitted again:", userIdFromClient);
      }
    });

    // ✅ Join private chat room
    socket.on("joinChat", ({ targetUserId }) => {
      const roomId = getSecretRoomId(userId, targetUserId);
      socket.join(roomId);
    });

    // ✅ Send and save chat message
    socket.on("sendMessage", async ({ targetUserId, text }) => {
      if (!targetUserId || !text?.trim()) return;

      try {
        const roomId = getSecretRoomId(userId, targetUserId);

        let chat = await Chat.findOne({
          participants: { $all: [userId, targetUserId] },
        });

        if (!chat) {
          chat = new Chat({ participants: [userId, targetUserId], messages: [] });
        }

        const message = {
          senderId: userId,
          text,
          createdAt: new Date(),
        };

        chat.messages.push(message);
        await chat.save();

        const sender = await User.findById(userId).select("firstName lastName photoUrl");

        io.to(roomId).emit("messageReceived", {
          userId: sender._id,
          firstName: sender.firstName,
          lastName: sender.lastName,
          photoUrl: sender.photoUrl,
          text: message.text,
          createdAt: message.createdAt,
        });
      } catch (err) {
        console.error("❌ Error sending message:", err.message);
      }
    });

    // ✅ Real-time Post Like Update
    socket.on("likeUpdate", ({ postId, userId, action }) => {
      // Broadcast to all (or optionally specific users)
      io.emit("likeUpdate", { postId, userId, action }); // 👈 PostCard.jsx
    });

    // ✅ Optimized likeUpdated version to directly replace post (FeedPosts.jsx)
    socket.on("likeUpdated", (updatedPost) => {
      io.emit("likeUpdated", updatedPost);
    });

    // ✅ On disconnect
    socket.on("disconnect", () => {
      console.log("❌ Disconnected:", userId);
      onlineUsers.delete(userId);
      io.emit("updateOnlineUsers", Array.from(onlineUsers));
    });
  });

  return io;
};

module.exports = initializeSocket;

























