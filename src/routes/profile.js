const express = require("express");
const { userAuth } = require("../middleware/userAuth");

const profileRouter = express.Router();


profileRouter.get("/profile", userAuth , async (req,res)=>{
  
  try{
  
    const user = req.user;
  
    console.log(user);
    res.send(user);
  }
  catch(error){
    res.status(400).send("something went wrong ");
  }
  })

  module.exports = profileRouter;