const express = require("express");
const app = express();

const connectDB = require("./config/database")
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/userRouter");
require("dotenv").config();
const cors = require("cors"); 

const allowedOrigins = process.env.NODE_ENV === 'development'
  ? ['http://localhost:5173'] // Production frontend URL
  : ['https://mkans-devchat.vercel.app'] 
  
app.use(cors({
  origin:allowedOrigins,credentials:true,
})); 
app.use(express.json());
app.use(cookieParser());


app.use("/",authRouter);
app.use("/",profileRouter);
app.use("/",requestRouter);
app.use("/",userRouter);

connectDB().then(()=>{
  console.log("database connection succefull");
  app.listen(process.env.PORT||7777, ()=>{
    console.log( "server is listening port 3000");
  }); 
}).catch(err => {
  
  console.log("databae connection error",err.message);
})

