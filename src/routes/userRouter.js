const express = require("express");
const { userAuth } = require("../middleware/userAuth");
const connectionRequest = require("../models/connectionRequest");

const User = require("../models/user");
const { getUserProfile } = require("../controllers/userController");

const userRouter = express.Router();
const USER_SAFE_DATA ="firstName lastName photoUrl age gender skills about";


userRouter.get("/users/:userId", userAuth, getUserProfile);

userRouter.get("/request/review/recieved",userAuth,async (req,res)=>{
try{
 const loggedInUser = req.user;
  
 const connectionRequestUser = await connectionRequest.find({
 toUserId: loggedInUser._id,
 status:"interested",
 }).populate("fromUserId", USER_SAFE_DATA);

 

 res.json({message:"data fetched succefully ", 
  data: connectionRequestUser,})
}catch(err){
res.status(400).send("something went wrong")
}
});

userRouter.get("/user/connection",userAuth,async  (req, res)=>{
  try{
    const loggedInUser = req.user;

    const connectionRequestUser = await  connectionRequest.find({
     $or: [ {toUserId : loggedInUser._id, status: "accepted"},
            {fromUserId: loggedInUser._id, status: "accepted"},
     ]
   }).populate("fromUserId", USER_SAFE_DATA).populate("toUserId", USER_SAFE_DATA);


   const data  = connectionRequestUser.map((row)=>{
    if(row.fromUserId._id.toString() === loggedInUser._id.toString()){
      return row.toUserId;
    }
    return row.fromUserId;
   })
   res.json({message: " my connections"
    ,data:data});
  }catch(err){
    res.status(400).send("something went wrong"+err);
  }
 
})

userRouter.get("/user/feed",userAuth, async (req, res)=>{

  try{
    const loggedInUser = req.user;

   const page = parseInt(req.query.page) || 1;
   let limit = parseInt(req.query.limit)||10;
    limit = limit > 50 ? 50:limit;

    const skip = (page-1)*limit;

    const connectionRequestUser = await connectionRequest.find({
     $or : [{fromUserId: loggedInUser._id}, {toUserId: loggedInUser._id}],
    }).select("fromUserId toUserId")

    const hideUserFromFeed = new Set();

     connectionRequestUser.forEach((req)=>{
      hideUserFromFeed.add(req.fromUserId.toString());
      hideUserFromFeed.add(req.toUserId.toString());
    })

    

   const users = await User.find({
   $and:[ {_id :{$nin : Array.from(hideUserFromFeed)}} , {_id:{ $ne : loggedInUser._id}},],
   }).select(USER_SAFE_DATA).skip(skip).limit(limit);

    res.json({data:users});
  }catch(err){
    res.status(400).send(" something went wrong" + err);
  }
  
})





// 🔍 GET /api/search/users?q=arjun
userRouter.get("/search/users", userAuth, async (req, res) => {
  try {
    const query = req.query.q;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Query is required" });
    }

    // 🔍 Search by first name or last name (case insensitive)
    const users = await User.find({
      $or: [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
      ],
    }).select("firstName lastName photoUrl about");

    res.status(200).json({ message: "Users fetched", data: users });
  } catch (error) {
    console.error("Search error:", error.message);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
});

module.exports = userRouter;