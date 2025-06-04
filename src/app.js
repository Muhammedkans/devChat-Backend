
require("dotenv").config();
const express = require("express");
const app = express();
  
const fileUpload = require("express-fileupload");
const connectDB = require("./config/database")
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/userRouter");

 
app.use(cookieParser());
const cors = require("cors"); 
const http = require("http");
const initializeSocket  = require("../src/utils/socket");
const chatRouter = require("./routes/chat");
const paymentRouter = require("./routes/payment");
const postRouter = require("./routes/post");
const followRouter = require("./routes/follow");
const postFeed = require("./routes/postfeed");




app.use(express.json());
app.use(cors({
  origin:[
    "http://localhost:5173", // Local development
    "https://mkans-dev-chat-web.vercel.app", // Production
  ],  credentials:true,
}));   

app.use("/",authRouter);
app.use("/",profileRouter);
app.use("/",requestRouter);
app.use("/",userRouter);
app.use("/",chatRouter);
app.use("/",paymentRouter);
app.use("/",postRouter);
app.use("/",followRouter);
app.use("/",postFeed);
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
}));

const server = http.createServer(app);

initializeSocket(server) 

connectDB().then(()=>{
  console.log("database connection succefull");
  server.listen(process.env.PORT||7777, ()=>{
    console.log( "server is listening port 7777");
  }); 
}).catch(err => {
  
  console.log("databae connection error",err);
});

