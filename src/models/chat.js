
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    required: false, // Optional for audio messages
  },
  audioUrl: {
    type: String,
    required: false,
  },
  messageType: {
    type: String,
    enum: ["text", "audio"],
    default: "text",
  }
}, { timestamps: true });




const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],

  messages: [messageSchema],
});

const Chat = mongoose.model("Chat", chatSchema);

module.exports = { Chat };


