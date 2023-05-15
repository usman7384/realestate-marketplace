const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: { type: String, required: true },
  dateTime: { type: Date, required: true },
  attachments: [{ type: String }],
  isRead: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
