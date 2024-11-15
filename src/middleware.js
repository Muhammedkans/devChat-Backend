const auth =  (req,res,next)=> {
 console.log("------------------------");
const token = "xyz";
 console.log("hai");
  if(!token ){
    res.status(500).send(" unKnown auth ");
  }
  else{
next();

  }
}
const unauthorization =  (req,res,next)=> {
  console.log("------------------------");
  const token = "xyz";
 console.log("hai");
  if(!token ){
    res.status(500).send(" unKnown auth ");
  }
  else{
next();

  }
}

module.exports = {
  auth,
  unauthorization,
}

