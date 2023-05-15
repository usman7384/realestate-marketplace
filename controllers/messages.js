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


module.exports = messageRouter;
