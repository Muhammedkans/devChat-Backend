const mongoose  = require("mongoose");

const connectDB = async ()=>{
 await mongoose.connect("mongodb+srv://kanskabeer:muhammedkans0675@cluster0.gq5dq.mongodb.net/devchat")
}
module.exports = connectDB

