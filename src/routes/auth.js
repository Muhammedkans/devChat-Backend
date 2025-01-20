const express = require("express");

const authRouter = express.Router();

const {validationSignUp} = require("../utils/validation")

const bcrypt = require("bcrypt");

const User = require("../models/user");

require("dotenv").config();


authRouter.post("/signup", async (req, res)=>{
 
  validationSignUp(req);
 
  const {firstName, lastName, emailId, password,age,gender, about} = req.body;
 
  const passwordHash = await bcrypt.hash(password,10);
 
  const user = new User({
   firstName,
   lastName,
   emailId,
   password:passwordHash,
   age,
   gender,
   about,
  });
  
 
  try{
   const saveUser = await user.save()
   const token = await saveUser.getJWT();  
 
  
   
   res.cookie("token", token, {
    httpOnly: true,
    secure: true, // Render uses HTTPS
    sameSite: 'none', // Required for cross-origin cookies
    expires: new Date(Date.now() + 8 * 3600000), // Expire in 8 hours
  });
  
   res.json({message:" User added succefully", data:saveUser}); 

 }catch(err){
  
   res.status(400).send(err +"failed to add to database");
 }
 
 })



 authRouter.post("/login", async  (req, res)=>{

  try{

    const {emailId, password} = req.body;

    const user = await User.findOne({emailId:emailId})
  
    if(!user){
      throw new Error(" invalid credential");
    }
  
    const isPassword = await user.validatePassword(password)
  
   if(isPassword){
     
    const token = await user.getJWT();
    console.log(token); 

    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // Render uses HTTPS
      sameSite: 'none', // Required for cross-origin cookies
      expires: new Date(Date.now() + 8 * 3600000), // Expire in 8 hours
    });
    res.send(user);
   }
   else{
    res.status(400).send("invalid credetial");
   }
  }
  catch(err){
    
    res.status(400).send("invalid credetial");
  }
  
 

})

authRouter.post("/logout",(req, res)=>{
 res.cookie("token",null,{expires:new Date(Date.now()),});
 res.send("succefully logout");
})


module.exports = authRouter;