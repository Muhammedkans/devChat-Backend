// ✅ Good practices used:
require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/database");
const { initializeSocket }  = require("../src/utils/socket");

// Routers
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/userRouter");
const chatRouter = require("./routes/chat");
const paymentRouter = require("./routes/payment");
const postRouter = require("./routes/post");
const followRouter = require("./routes/follow");
const postFeed = require("./routes/postfeed");
const commentRouter = require("./routes/commentRoutes");

// ✅ Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin:[
    "http://localhost:5173", 
    "https://mkans-dev-chat-web.vercel.app", 
  ],
  credentials:true,
}));
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}));

// ✅ Routes
app.use("/",authRouter);
app.use("/",profileRouter);
app.use("/",requestRouter);
app.use("/",userRouter);
app.use("/",chatRouter);
app.use("/",paymentRouter);
app.use("/",postRouter);
app.use("/",followRouter);
app.use("/",postFeed);
app.use("/",commentRouter);

// ✅ Server & DB connection
const server = http.createServer(app);

connectDB().then(()=>{
  console.log("✅ Database connected");

  // ✅ Initialize socket.io after DB
  initializeSocket(server); 

  server.listen(process.env.PORT || 7777, () => {
    console.log("🚀 Server running on port", process.env.PORT || 7777);
  });
}).catch(err => {
  console.log("❌ DB Connection error", err);
});



