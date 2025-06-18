const socketIO = require("socket.io");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { Chat } = require("../models/chat");

const getSecretRoomId = (userId1, userId2) => {
  return crypto
    .createHash("sha256")
    .update([userId1, userId2].sort().join("-"))
    .digest("hex");
};

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "https://mkans-dev-chat-web.vercel.app"
      ],
      credentials: true,
    },
  });

  const onlineUsers = new Set();

  // ✅ Socket Middleware - Auth
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
    } catch (error) {
      console.error("Auth error:", error.message);
      next(new Error("Authentication failed"));
    }
  });

  // ✅ On Socket Connection
  io.on("connection", (socket) => {
    const userId = socket.user._id;
    console.log("✅ Socket connected:", userId);

    onlineUsers.add(userId);
    io.emit("updateOnlineUsers", Array.from(onlineUsers));

    // Join private room for direct messages
    socket.on("joinChat", ({ targetUserId }) => {
      const roomId = getSecretRoomId(userId, targetUserId);
      socket.join(roomId);
      console.log(`🔗 ${userId} joined room ${roomId}`);
    });

    // ✅ Handle message send
    socket.on("sendMessage", async ({ targetUserId, text, firstName, lastName }) => {
      if (!targetUserId || !text?.trim()) return;

      try {
        const roomId = getSecretRoomId(userId, targetUserId);

        let chat = await Chat.findOne({
          participants: { $all: [userId, targetUserId] },
        });

        if (!chat) {
          chat = new Chat({
            participants: [userId, targetUserId],
            messages: [],
          });
        }

        const message = {
          senderId: userId,
          text,
          createdAt: new Date(),
        };

        chat.messages.push(message);
        await chat.save();

        // 🔁 Emit message to both users in the room
        io.to(roomId).emit("messageReceived", {
          firstName,
          lastName,
          text: message.text,
          userId,
        });
      } catch (err) {
        console.error("❌ Send message error:", err.message);
      }
    });

    // ✅ On Disconnect
    socket.on("disconnect", () => {
      console.log("❌ Disconnected:", userId);
      onlineUsers.delete(userId);
      io.emit("updateOnlineUsers", Array.from(onlineUsers));
    });
  });

  return io;
};

module.exports = initializeSocket;






















