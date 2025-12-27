// ✅ Load environment variables first
require("dotenv").config();

const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");

// ✅ Database and Socket setup
const connectDB = require("./config/database");
const { initializeSocket } = require("./utils/socket");

// ✅ Routers
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/userRouter");
const chatRouter = require("./routes/chat");
const paymentRouter = require("./routes/payment");
const postRouter = require("./routes/post");
const followRouter = require("./routes/follow");
const postFeed = require("./routes/postfeed");
const commentRoutes = require("./routes/commentRoutes");
const aiRouter = require("./routes/aiRoute"); // 🤖 AI Route
const notificationRouter = require("./routes/notification"); // 🔔 Notifications
const analyticsRouter = require("./routes/analytics"); // 📈 Analytics
const projectRouter = require("./routes/project"); // 💻 Projects
const storyRouter = require("./routes/story"); // 🎥 Stories

// ✅ Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://mkans-dev-chat-web.vercel.app"
  ],
  credentials: true,
}));
app.use(fileUpload({
  useTempFiles: false,
  limits: { fileSize: 5 * 1024 * 1024 },
}));

// ✅ Mount routes
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", chatRouter);
app.use("/", paymentRouter);
app.use("/", postRouter);
app.use("/", followRouter);
app.use("/", postFeed);
app.use("/", commentRoutes);
app.use("/", aiRouter); // 🤖 Enable AI Features
app.use("/", notificationRouter);
app.use("/", analyticsRouter);
app.use("/project", projectRouter); // 💻 Project Portfolio
app.use("/story", storyRouter); // 🎥 DevStories

// ✅ Create server and connect DB
const server = http.createServer(app);

connectDB()
  .then(() => {
    console.log("✅ Database connected");
    initializeSocket(server);
    server.listen(process.env.PORT || 7777, () => {
      console.log("🚀 Server running on port", process.env.PORT || 7777);
    });
  })
  .catch((err) => {
    console.error("❌ DB Connection error:", err);
  });





