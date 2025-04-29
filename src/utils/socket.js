const socket = require("socket.io");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const  {Chat}  = require("../models/chat");
const  Post  = require("../models/post"); // Import the Post model
const user = require("../models/user");

const getSecreatedRoomId = (userId, targetUserId) => {
  return crypto.createHash("sha256")
    .update([userId, targetUserId].sort().join("-"))
    .digest("hex");
};

const initializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: ["http://localhost:5173", "https://mkans-dev-chat-web.vercel.app"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const cookies = socket.handshake.headers.cookie;
    const token = cookies ? cookies.split('=')[1] : null;

    if (!token) {
      return next(new Error("Authentication token is missing"));
    }

    jwt.verify(token, process.env.JWT_TOKEN, (err, decoded) => {
      if (err) {
        return next(new Error("Invalid authentication token"));
      }

      console.log(decoded);
      socket.user = decoded;
      next();
    });
  });

  io.on("connection", (socket) => {
    console.log("User connected: " + socket.id);

    // Join Chat Room
    socket.on("joinChat", ({ firstName, userId, targetUserId }) => {
      const roomId = getSecreatedRoomId(userId, targetUserId);
      console.log(firstName + " joining " + roomId);
      socket.join(roomId);
    });

    // Send Message
    socket.on("sendMessage", async ({ firstName, lastName, userId, targetUserId, text }) => {
      try {
        const roomId = getSecreatedRoomId(userId, targetUserId);
        console.log(firstName + " " + text);

        let chat = await Chat.findOne({
          participants: { $all: [userId, targetUserId] },
        });

        if (!chat) {
          chat = new Chat({
            participants: [userId, targetUserId],
            messages: [],
          });
        }

        chat.messages.push({
          senderId: userId,
          text,
        });

        await chat.save();
        io.to(roomId).emit("messageReceived", { firstName, lastName, text });
      } catch (err) {
        console.log(err);
      }
    });

    // Like Post
    socket.on("likePost", async ({ postId, userId }) => {
      try {
        // Validate postId and userId
        if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(userId)) {
          throw new Error("Invalid postId or userId");
        }

        // Find the post and update the likes array
        const post = await Post.findByIdAndUpdate(
          postId,
          { $addToSet: { likes: userId } }, // Add user ID to likes array (no duplicates)
          { new: true } // Return the updated post
        );

        if (!post) {
          throw new Error("Post not found");
        }

        // Emit the updated like count to all clients
        io.emit("postLiked", { postId, likes: post.likes });
      } catch (err) {
        console.error("Error liking post:", err.message);
        socket.emit("likeError", { message: err.message });
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

module.exports = initializeSocket;
