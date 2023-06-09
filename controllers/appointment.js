const appointmentRouter = require("express").Router();
const Appointment = require("../models/appointment");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Property = require("../models/property");
const mongoose = require("mongoose");


appointmentRouter.get("/", async (request, response) => {
  try {
   const appointments = await Appointment.find({}).populate("buyer").populate("seller").populate("property");
    response.json(appointments);
    console.log(appointments)
  } catch (error) {
    response.status(404).end();
  }
});

appointmentRouter.post("/:id", async (request, response) => {
  try {
    const id = request.params.id;
    console.log(id)
    const propertyfound = await Property.findById(id);
    if (!propertyfound) {
      return response.status(404).json({ error: "Property not found." });
    }

    const decodedToken = jwt.verify(request.token, process.env.SECRET);
    if (!request.token || !decodedToken.id) {
      return response.status(401).json({ error: "Token missing or invalid." });
    }

    const buyerfound = await User.findById(decodedToken.id);
    if (!buyerfound) {
      return response.status(401).json({ error: "Buyer not found." });
    }
    console.log(propertyfound.owner._id)

    const sellerfound = await User.findById(propertyfound.owner._id);
    if (!sellerfound) {
      return response.status(404).json({ error: "Seller not found." });
    }

    const appointment = new Appointment({
      buyer: buyerfound._id,
      seller: sellerfound._id,
      property: propertyfound._id,
      dateTime: new Date(),
      status: "pending",
    });

    const savedAppointment = await appointment.save();
    response.json(savedAppointment);
  } catch (error) {
    response.status(400).json({ error: "Failed to create appointment." });
  }
});




appointmentRouter.get("/buyer/:buyerId", async (request, response) => {
  try {
    const { buyerId } = request.params;

    const appointments = await Appointment.find({ buyer: buyerId })
      .populate("seller", "name")
      .populate("property", "title");

    response.json(appointments);
  } catch (error) {
    response.status(500).json({ error: "Failed to retrieve appointments." });
  }
});




//cancel an appointment
appointmentRouter.put("/:id/cancel", async (request, response) => {
  try {
    const { id } = request.params;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return response.status(404).json({ error: "Appointment not found." });
    }

    appointment.status = "cancelled";

    const savedAppointment = await appointment.save();
    response.json(savedAppointment);
  } catch (error) {
    response.status(500).json({ error: "Failed to cancel appointment." });
  }
});
//get all seller appointments
appointmentRouter.get("/seller/:sellerId", async (request, response) => {
  try {
    const { sellerId } = request.params;
    console.log(sellerId);

    const appointments = await Appointment.find({ seller: sellerId })
      .populate("buyer", "name")
      .populate("property", "title");

    response.json(appointments);
  } catch (error) {
    response.status(500).json({ error: "Failed to retrieve appointments." });
  }
});

//confirm an appointment
appointmentRouter.put("/:id/confirm", async (request, response) => {
  try {
    const { id } = request.params;
    console.log(id);

    const appointment = await Appointment.findById(id);
    console.log(appointment);
    if (!appointment) {
      return response.status(404).json({ error: "Appointment not found." });
    }

    const decodedToken = jwt.verify(request.token, process.env.SECRET);
    if (!request.token || !decodedToken.id) {
      return response.status(401).json({ error: "token missing or invalid" });
    }
    const user = await User.findById(decodedToken.id);
    console.log(user);
    if (!user) {
      return response.status(401).json({ error: "user not found" });
    } else if (user.role !== "admin") {
      return response.status(401).json({ error: "user not authorized" });
    }

    appointment.status = "confirmed";

    const savedAppointment = await appointment.save();
    response.json(savedAppointment);
  } catch (error) {
    console.log(error);
    response.status(500).json({ error: "Failed to confirm appointment." });
  }
});


module.exports = appointmentRouter;
