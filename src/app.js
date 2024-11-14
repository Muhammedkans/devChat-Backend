const express = require("express");

const app = express();

  
app.use("/", (req, res )=>{
  res.send("hahhhhh ");
 })

app.use("/halo" , (req,res) => {
  res.send( " hello world ");
})

app.use("/hai",  (req, res) => {
  res.send(" hahaha");
  })





app.listen(3000);