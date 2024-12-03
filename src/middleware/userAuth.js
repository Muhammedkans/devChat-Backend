const jwt = require("jsonwebtoken");
const express = require("express");
const User = require("../models/user");

const userAuth = async  (req,res,next)=> {
   try{
    const {token} = req.cookies;

    if(!token){
    
      throw new Error(" please login");
    }
    const decordedValue = await jwt.verify(token,"Dev@chat$790");

    if(!decordedValue){
      throw new Error("please login token not found ")
    }

    const {_id} =  decordedValue;

    const user = await User.findById(_id);

    if(!user){
      throw new Error("user not found");
    }

    req.user = user; 
   console.log(req.user)
   
    next();
   }catch(err){
    res.status(400).send("invalid credentials")
   }


}


module.exports = {
  userAuth,
}

