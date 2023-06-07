const config = require("./utils/config");
const express = require("express");
const app = express();
const cors = require("cors");
const middleware = require("./utils/middleware");
const logger = require("./utils/logger");
const mongoose = require("mongoose");
const usersRouter = require("./controllers/user");
const loginRouter = require("./controllers/login");
const messageRouter = require("./controllers/messages");
const appointmentRouter = require("./controllers/appointment");
const propertyRouter = require("./controllers/property");

logger.info("connecting to", config.MONGODB_URI);

mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    logger.info("connected to MongoDB");
  })
  .catch((error) => {
    logger.error("error connecting to MongoDB:", error.message);
  });

app.use(cors());
app.use(express.static("build"));
app.use(express.json());
app.use(middleware.requestLogger);
app.use(middleware.tokenExtractor);
// app.use(middleware.userExtractor);
app.use("/api/login", loginRouter);
app.use("/api/users", usersRouter);
app.use("/api/messages", messageRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/properties", propertyRouter);
app.use(middleware.errorHandler);
app.use(middleware.unknownEndpoint);

module.exports = app;
