const express = require("express");

const app = express();
const connectDB = require("./config/database")
const User  = require("./models/user");
const user = require("./models/user");
app.use(express.json())

app.post("/signup", async (req, res)=>{
 const user = new User(req.body);
 console.log(req.body)

 try{
  await user.save()
  res.send(" User added succefully");
}catch(err){
  res.status(400).send("failed to add to database");
}

})

app.get("/user", async (req, res)=>{
  const userEmail = req.body.emailId;
  console.log(userEmail)
try{
 const user =  await User.findOne({emailId:userEmail});
 if(!user){
  res.status(400).send("user not found ");
 }
 else{
  res.send(user)  
 }
}
catch(err){
  res.status(400).send("something went wrong ")
}
 
})


app.get("/feed",async (req,res)=>{
  const userEmail = req.body.emailId;

  try{
 const users = await  User.find({emailId:userEmail});
 if(users.length=== 0) {
  res.status(400).send("user not found ");
 }
 else{
  res.send(users);
 }
  
  }
  catch(err){
    res.status(400).send(err,"something went wrong")
  }

})

connectDB().then(()=>{
  console.log("database connection succefull");
  app.listen(3000, ()=>{
    console.log( "server is listening port 3000");
  }); 
}).catch(err => {
  console.log("databae connection error",err);
})

