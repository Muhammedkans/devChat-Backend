const validator = require("validator");
const validationSignUp = (req) =>{

  const {firstName, lastName, emailId, password} = req.body;

  if(!firstName || !lastName){
    throw new Error("please enter valid name");
  }
  else if(!validator.isEmail(emailId)){
    throw new Error(" invalid credention");
  }
  else if(!validator.isStrongPassword(password)){
    throw new Error("please enter valid password");
  }
}


module.exports={
  validationSignUp,
}