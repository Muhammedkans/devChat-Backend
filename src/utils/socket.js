const socketIO = require("socket.io");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { Chat } = require("../models/chat");
const User = require("../models/user");
const Post = require("../models/post"); // ✅ Needed for comment saving

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

  const onlineUsers = new Map();

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

  io.on("connection", (socket) => {
    const userId = socket.user._id;
    console.log("✅ Socket connected:", userId);

    const prevCount = onlineUsers.get(userId) || 0;
    onlineUsers.set(userId, prevCount + 1);
    io.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));

    socket.on("userOnline", (userIdFromClient) => {
      if (userIdFromClient && !onlineUsers.has(userIdFromClient)) {
        onlineUsers.set(userIdFromClient, 1);
        io.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));
        console.log("📡 userOnline emitted manually by client:", userIdFromClient);
      }
    });

    socket.on("joinChat", ({ targetUserId }) => {
      const roomId = getSecretRoomId(userId, targetUserId);
      socket.join(roomId);
    });

    socket.on("sendMessage", async ({ targetUserId, text }) => {
      if (!targetUserId || !text?.trim()) return;

      try {
        const roomId = getSecretRoomId(userId, targetUserId);

        let chat = await Chat.findOne({ participants: { $all: [userId, targetUserId] } });
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

    // ✅ Like Feature
    socket.on("likeUpdate", ({ postId, userId, action }) => {
      io.emit("likeUpdate", { postId, userId, action });
    });

    socket.on("likeUpdated", (updatedPost) => {
      io.emit("likeUpdated", updatedPost);
    });

    // ✅ ✅ ✅ Real-Time Comment Feature (NEW)
    socket.on("newComment", async ({ postId, comment }) => {
      try {
        if (!postId || !comment?._id) return;

        // You can optionally validate and fetch more info here
        io.emit("newComment", {
          postId,
          comment,
        });
      } catch (err) {
        console.error("❌ Error in newComment socket:", err.message);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", userId);
      const currentCount = onlineUsers.get(userId) || 0;
      if (currentCount <= 1) {
        onlineUsers.delete(userId);
      } else {
        onlineUsers.set(userId, currentCount - 1);
      }

      io.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));
    });
  });

  return io;
};

module.exports = initializeSocket;



























