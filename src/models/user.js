const mongoose  = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const userSchema = new mongoose.Schema({
  firstName: {
    type:String,
    required:true,
    minLength:4,
    maxLength:50,
  },
  lastName:{
    type:String,
  },
  emailId:{
    type: String,
    lowercase:true,
    required:true,
    unique:true,
    trim:true,
    validate(value){
      if(!validator.isEmail(value)){
        throw new Error("Please enter valid email");
      }
    },
  },
  password:{
    type:String,
    required:true,
    validate(value){
      if(!validator.isStrongPassword(value)){
        throw new Error("please enter valid password");
      }
    }
  },
  age:{
    type:Number,
    min:18,  
  },
  gender:{
    type:String,
    validate(value){
      if(!["male", "female", "others"].includes(value)){
        throw new Error("Gender Data is not Valid");
      }
    },
  },


isPremium:{
  type:Boolean,
  default:false,
},

membershipType:{
  type:String
},

  photoUrl:{
    type:String,
    default: "https://imgs.search.brave.com/ej2p7ae3HRK8vA-ngeyb5DmL4pvyM2YgcrV8a0ygffA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4u/dmVjdG9yc3RvY2su/Y29tL2kvcHJldmll/dy0xeC82Mi81OS9k/ZWZhdWx0LWF2YXRh/ci1waG90by1wbGFj/ZWhvbGRlci1wcm9m/aWxlLWljb24tdmVj/dG9yLTIxNjY2MjU5/LmpwZw",
    validate(value){
     if(!validator.isURL(value)){
        throw new Error(" please enter valid url")
     }
    },
  },
  about:{
    type:String,
    default:"this is default about ",
  },
  skills:{
   type: [String],
  }
},{
  timestamps:true,
})


userSchema.methods.getJWT = async  function(){
  const user = this;

  const token = await jwt.sign({_id:user._id},process.env.JWT_TOKEN,{expiresIn:"7d",});
  
  return token;

}

userSchema.methods.validatePassword = async function(password){
  const user = this;
  const isPassword = await bcrypt.compare(password, user.password);

  return isPassword;
}
module.exports =  mongoose.model("User", userSchema);