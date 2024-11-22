const express = require("express");

const authRouter = express.Router();

const {validationSignUp} = require("../utils/validation")

const bcrypt = require("bcrypt");

const User = require("../models/user");



authRouter.post("/signup", async (req, res)=>{
 
  validationSignUp(req);
 
  const {firstName, lastName, emailId, password} = req.body;
 
  const passwordHash = await bcrypt.hash(password,10);
 
  const user = new User({
   firstName,
   lastName,
   emailId,
   password:passwordHash,
  });
  console.log(user)
 
  try{
   await user.save()
   res.send(" User added succefully");
 }catch(err){
   console.log(err);
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

    res.cookie("token",token,{expires:new Date(Date.now()+ 8*3600000),});
    res.send("Login succefull");
   }
   else{
    res.status(400).send("invalid credetial");
   }
  }
  catch(err){
    console.log(err)
    res.status(400).send("invalid credetial");
  }
  
 

})


module.exports = authRouter;