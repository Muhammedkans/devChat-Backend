const express = require("express");
const { userAuth } = require("../middleware/userAuth");
const { validateEditProfile } = require("../utils/validation");
validateEditProfile;
const profileRouter = express.Router();


profileRouter.get("/profile/view", userAuth , async (req,res)=>{
  
  try{
  
    const user = req.user;
  
    
    res.send(user);
  }
  catch(error){
    res.status(400).send("something went wrong ");
  }
  });


  profileRouter.patch("/profile/edit",userAuth,async (req,res)=>{
    try{

      if (!validateEditProfile(req)){
        throw new Error("failed update");
      }

      const loggedUser= req.user;


      Object.keys(req.body).forEach( key=>loggedUser[key] = req.body[key]);
       
      await loggedUser.save();
      res.json({message:`${loggedUser.firstName} your profile is succefully updated`,data: loggedUser});


    }catch(err){
      res.status(404).send( "update failed " +err);
      
    }
  })

  module.exports = profileRouter;