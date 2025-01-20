const express = require("express");
const { userAuth } = require("../middleware/userAuth");
const User = require("../models/user");
const requestRouter = express.Router();
const ConnectionRequest = require("../models/connectionRequest");



requestRouter.post("/request/send/:status/:toUserId",userAuth, async (req ,res)=>{


  try{
    const  fromUserId = req.user._id;
    const  toUserId =  req.params.toUserId;
    const status = req.params.status;

   const allowedStatus = ["ignore", "interested"];

   const statusChecking = allowedStatus.includes(status);

   if (!statusChecking){

    throw new Error("checking status is not valid");  
   }

   const toUser = await User.findById(toUserId);

   if(!toUser){
    throw new Error(" user is not sign  ");
   }

   const existingConnectionRequest = await ConnectionRequest.findOne({
    $or:[
      {fromUserId,toUserId},
      {fromUserId:toUserId, toUserId: fromUserId},
    ],
   });

   if(existingConnectionRequest){
    throw new Error("connection request already exist");
   }
 
   const connectionRequest = new ConnectionRequest({
    fromUserId,
    toUserId,
    status,
   })

   const data = await connectionRequest.save();

   res.json({
    message: "connection Request Sent Succefully",
    data,
   });

  }catch(err){
    
 res.status(400).send("error happeing"+err.message);
  }
 

})


requestRouter.post("/request/review/:status/:requestId",userAuth, async(req,res)=>{
  try{
    const loggedInUser = req.user;

    const {status ,requestId} = req.params;

    const allowedStatus = ["accepted","rejected"];

   const allowedStatusChecking =  allowedStatus.includes(status);

   if(!allowedStatusChecking){

    throw new Error("status is not allowed");
   }

   const connectionRequest = await ConnectionRequest.findOne({
    _id:requestId,
    toUserId:loggedInUser._id,
    status:"interested",
   })

   if(!connectionRequest){
    throw new Error(" no request found ");
   }

    connectionRequest.status = status;

    const data  = await connectionRequest.save();
    res.json({message: "connection request " + status, data})
  }catch(err){
    
    res.status(404).send("something went wrong"+err.message);
  }
})

module.exports = requestRouter;

