const express = require("express");
const {auth} = require("./middleware");
const {unauthorization} = require("./middleware");
const app = express();


app.use("/admin", auth);

app.use("/admin/getdata",  (req, res)=>{
   console.log("hahhaha");
  res.send("authorization succeffullyy");
});


app.use("/user", unauthorization, (req, res)=>{
  console.log("hahhaha");
 res.send("authorization succeffullyy");
});

app.listen(3000);  