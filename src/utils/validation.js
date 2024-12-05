const validator = require("validator");
const validationSignUp = (req) =>{

  const {firstName, lastName, emailId, password,} = req.body;

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


const validateEditProfile = (req) =>{

  const ALLOWED_UPDATE =  ["firstName", "lastName", "skills", "photoUrl", "gender", "age"];

  const isEditAllowed = Object.keys(req.body).every(key => ALLOWED_UPDATE.includes(key))

  return isEditAllowed;
}

module.exports={
  validationSignUp,
  validateEditProfile,
}