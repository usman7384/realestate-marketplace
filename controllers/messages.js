const messageRouter = require("express").Router();
const Message = require("../models/message");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./attachments");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

// Create multer upload middleware
const upload = multer({ storage });

messageRouter.get("/sent/:sender", async (request, response) => {
  try {
    const decodedToken = jwt.verify(request.token, process.env.SECRET);
    if (!request.token || !decodedToken.id) {
      return response.status(401).json({ error: "token missing or invalid" });
    }
    const user = await User.findById(decodedToken.id);
    if (!user) {
      return response.status(401).json({ error: "user not found" });
    }
    if (
      user.role === "admin" ||
      user._id.toString() === request.params.sender.toString()
    ) {
      const messages = await Message.find({ sender: request.params.sender });
      response.json(messages);
    }
  } catch (error) {
    response.status(404).end();
  }
});

messageRouter.get("/recieved/:reciever", async (request, response) => {
  try {
    const decodedToken = jwt.verify(request.token, process.env.SECRET);
    if (!request.token || !decodedToken.id) {
      return response.status(401).json({ error: "token missing or invalid" });
    }
    const user = await User.findById(decodedToken.id);
    if (!user) {
      return response.status(401).json({ error: "user not found" });
    }
    if (
      user.role === "admin" ||
      user._id.toString() === request.params.reciever.toString()
    ) {
      const messages = await Message.find({
        receiver: request.params.reciever,
      });
      response.json(messages);
    }
  } catch (error) {
    response.status(404).end();
  }
});

messageRouter.get("/:sender/:reciever", async (request, response) => {
  try {
    console.log(request.params);
    const decodedToken = jwt.verify(request.token, process.env.SECRET);
    if (!request.token || !decodedToken.id) {
      return response.status(401).json({ error: "token missing or invalid" });
    }
    const user = await User.findById(decodedToken.id);
    console.log(user)
    if (!user) {
      return response.status(401).json({ error: "user not found" });
    }
    if (
      user.role === "admin" ||
      user._id.toString() === request.params.reciever.toString() ||
      user._id.toString() === request.params.sender.toString()
    ) {
      console.log("here");
      const messages = await Message.find({
        sender: request.params.sender,
        receiver: request.params.reciever,
      });
      console.log(messages);
      response.json(messages);
    }
  } catch (error) {
    console.log(error);
    response.status(404).end();
  }
});

//send a simple message
messageRouter.post("/simple", async (request, response) => {
  try {
    const { sender, reciever, content } = request.body;
    const senderUser = await User.findById(sender);
    const recieverUser = await User.findById(reciever);
    const message = new Message({
      sender: senderUser._id,
      receiver: recieverUser._id,
      content,
      dateTime: new Date(),
    });
    const savedMessage = await message.save();
    response.json(savedMessage);
  } catch (error) {
    response.status(400).end();
  }
});
//send a message with attachments
messageRouter.post(
  "/attachment",
  upload.array("attachments"),
  async (request, response) => {
    try {
      const { sender, reciever, content } = request.body;
      const senderUser = await User.findById(sender);
      const recieverUser = await User.findById(reciever);
      if (!senderUser || !recieverUser) {
        return response
          .status(400)
          .json({ error: "Invalid sender or reciever." });
      }
      const attachments = request.files.map((file) =>
        file.path.replace(/\\/g, "/"),
      );
      const message = new Message({
        sender: senderUser._id,
        receiver: recieverUser._id,
        content,
        attachments,
        dateTime: new Date(),
      });
      const savedMessage = await message.save();
      response.json(savedMessage);
    } catch (error) {
      console.log(error);
      response.status(500).json({ error: "Failed to send message." });
    }
  },
);

//search in messages

messageRouter.get("/search", async (request, response) => {
  try {
    const { keyword } = request.query;
    const messages = await Message.find({
      content: { $regex: keyword, $options: "i" },
    });
    response.json(messages);
  } catch (error) {
    response.status(400).end();
  }
});
//archuive a message
messageRouter.put("/:messageId/archive", async (request, response) => {
  try {
    const { messageId } = request.params;
    const message = await Message.findByIdAndUpdate(
      messageId,
      { isArchived: true },
      { new: true },
    );
    response.json(message);
  } catch (error) {
    response.status(400).end();
  }
});

//unarchive a message

messageRouter.put("/:messageId/unarchive", async (request, response) => {
  try {
    const { messageId } = request.params;
    const message = await Message.findByIdAndUpdate(
      messageId,
      { isArchived: false },
      { new: true },
    );
    response.json(message);
  } catch (error) {
    response.status(400).end();
  }
});
//mark as read
messageRouter.put("/:messageId/read", async (request, response) => {
  try {
    const { messageId } = request.params;
    const message = await Message.findByIdAndUpdate(
      messageId,
      { isRead: true },
      { new: true },
    );
    response.json(message);
  } catch (error) {
    response.status(400).end();
  }
});
//delete a message
messageRouter.delete("/:messageId", async (request, response) => {
  try {
    const { messageId } = request.params;
    const message = await Message.findByIdAndDelete(messageId);
    response.status(204).end();
  } catch (error) {
    response.status(400).end();
  }
});
module.exports = messageRouter;
