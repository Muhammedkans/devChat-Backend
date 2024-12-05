const mongoose  = require("mongoose");

const connectDB = async ()=>{
 await mongoose.connect(
  "mongodb+srv://kanskabeer:muhammedkans0675@muhammed0.gq5dq.mongodb.net/devChat")
}
module.exports = connectDB


