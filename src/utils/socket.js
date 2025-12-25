const socketIO = require("socket.io");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { Chat } = require("../models/chat");
const User = require("../models/user");

let io;

const getSecretRoomId = (userId1, userId2) => {
  return crypto
    .createHash("sha256")
    .update([userId1, userId2].sort().join("-"))
    .digest("hex");
};

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "https://mkans-dev-chat-web.vercel.app",
      ],
      credentials: true,
    },
  });

  const onlineUsers = new Map();

  // ✅ Middleware: Auth with JWT in Cookie
  io.use((socket, next) => {
    try {
      const rawCookie = socket.handshake.headers.cookie;
      if (!rawCookie) return next(new Error("❌ No cookie found"));

      const token = rawCookie
        .split(";")
        .find((c) => c.trim().startsWith("token="))
        ?.split("=")[1];

      if (!token) return next(new Error("❌ Token missing"));

      jwt.verify(token, process.env.JWT_TOKEN, (err, decoded) => {
        if (err) return next(new Error("❌ Invalid token"));
        socket.user = decoded;
        next();
      });
    } catch (err) {
      next(new Error("❌ Auth middleware failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id;
    console.log("✅ Connected:", userId);

    // ✅ Track online users
    const prevCount = onlineUsers.get(userId) || 0;
    onlineUsers.set(userId, prevCount + 1);
    io.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));

    // ✅ Join private chat room
    socket.on("joinChat", ({ targetUserId }) => {
      const roomId = getSecretRoomId(userId, targetUserId);
      socket.join(roomId);
    });

    // ✅ Handle Send Message
    socket.on("sendMessage", async ({ targetUserId, text, audioUrl, messageType = "text" }) => {
      if (!targetUserId) return;
      if (messageType === "text" && !text?.trim()) return;
      if (messageType === "audio" && !audioUrl) return;

      const roomId = getSecretRoomId(userId, targetUserId);

      try {
        let chat = await Chat.findOne({
          participants: { $all: [userId, targetUserId] },
        });

        if (!chat) {
          chat = new Chat({ participants: [userId, targetUserId], messages: [] });
        }

        const message = {
          senderId: userId,
          text: messageType === "text" ? text : "",
          audioUrl: messageType === "audio" ? audioUrl : "",
          messageType,
          createdAt: new Date(),
        };

        chat.messages.push(message);
        await chat.save();

        const sender = await User.findById(userId).select("firstName lastName photoUrl");

        const finalMsg = {
          userId: sender._id,
          firstName: sender.firstName,
          lastName: sender.lastName,
          photoUrl: sender.photoUrl,
          text: message.text,
          audioUrl: message.audioUrl,
          messageType: message.messageType,
          createdAt: message.createdAt,
        };

        io.to(roomId).emit("messageReceived", finalMsg);
      } catch (err) {
        console.error("❌ sendMessage error:", err.message);
      }
    });

    // 🤝 Connection Requests (Real-time)
    socket.on("sendConnectionRequest", ({ toUserId, fromUser }) => {
      // Notify the recipient if they are online
      io.emit("newConnectionRequest", { toUserId, fromUser });
    });

    socket.on("connectionResponse", ({ toUserId, fromUserId, status }) => {
      // status: 'accepted' or 'rejected'
      io.emit("connectionStatusUpdate", { toUserId, fromUserId, status });
    });

    // ✅ Like Updates Broadcast
    socket.on("likeUpdate", ({ postId, userId, action }) => {
      if (!postId || !userId || !["like", "unlike"].includes(action)) return;
      io.emit("likeUpdate", { postId, userId, action });
    });

    socket.on("likeUpdated", (updatedPost) => {
      if (updatedPost?._id) {
        io.emit("likeUpdated", updatedPost);
      }
    });

    // ❌ No need to handle comment events here (already done in controller via getIO().emit())

    // ❌ Disconnect cleanup
    socket.on("disconnect", () => {
      const count = onlineUsers.get(userId) || 0;
      if (count <= 1) {
        onlineUsers.delete(userId);
      } else {
        onlineUsers.set(userId, count - 1);
      }

      io.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));
      console.log("❌ Disconnected:", userId);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

module.exports = { initializeSocket, getIO };









































