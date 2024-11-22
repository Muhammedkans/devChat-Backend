const express = require("express");
const { userAuth } = require("../middleware/userAuth");

const requestRouter = express.Router();



requestRouter.post("/sendRequest",userAuth, (req ,res)=>{

  const user = req.user;

  res.send(`${user.firstName} is send requested`);

})

module.exports = requestRouter;