
const socket = require("socket.io");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const getSecreatedRoomId =(userId , targetUserId) =>{
return  crypto.createHash("sha256")
  .update([userId,targetUserId].sort().join("-"))
  .digest("hex")
}

const initializeSocket = (server) =>{



const io = socket(server,
{cors:{origin:["http://localhost:5173"],credentials:true}});



io.use( (socket, next) => {
 
 const cookies = socket.handshake.headers.cookie;
 
 const token = cookies ? cookies.split('=')[1] : null;

  if (!token) {
    return next(new Error("Authentication token is missing"));
  }

  
   jwt.verify(token, process.env.JWT_TOKEN, (err, decoded) => {
   
    if (err) {
     
      return next(new Error("Invalid authentication token"));
    }

    console.log(decoded);
    socket.user = decoded;
    
    next();
  });
});



io.on("connection", (socket) =>{

  console.log("User connected: " + socket.id);


  socket.on("joinChat" , ({firstName, userId , targetUserId})=>{
  const roomId = getSecreatedRoomId(userId , targetUserId);
console.log(firstName + " joining"+ roomId);
  socket.join(roomId);
  });

  socket.on("sendMessage", ({firstName,userId,targetUserId, text })=>{

    const roomId = getSecreatedRoomId(userId , targetUserId);
    console.log(firstName + " " +text);
    io.to(roomId).emit("messageReceived",{firstName,text})
  });

  socket.on("disconnect", ()=> {
    console.log("User disconnected:", socket.user.username);
  });
});

}

module.exports= initializeSocket
