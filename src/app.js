const express = require("express");
const {auth} = require("./middleware/userAuth");
const {unauthorization} = require("./middleware/userAuth");
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