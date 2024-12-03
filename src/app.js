const express = require("express");
const app = express();
const connectDB = require("./config/database")
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/userRouter");
const cors = require("cors");
app.use(cors({
  origin:"http://localhost:5173",credentials:true,
})); 
app.use(express.json());
app.use(cookieParser());


app.use("/",authRouter);
app.use("/",profileRouter);
app.use("/",requestRouter);
app.use("/",userRouter);

connectDB().then(()=>{
  console.log("database connection succefull");
  app.listen(3000, ()=>{
    console.log( "server is listening port 3000");
  }); 
}).catch(err => {
  console.log("databae connection error",err);
})

