const appointmentRouter = require("express").Router();
const Appointment = require("../models/appointment");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Property = require("../models/property");
const mongoose = require("mongoose");

appointmentRouter.post("/", async (request, response) => {
  try {
    const { sellerId, buyerId, propertyId } = request.body;
    const sellerfound = await User.findById(sellerId);
    const buyerfound = await User.findById(buyerId);
    const propertyfound = await Property.findById(propertyId);
    const propertyOwner = await User.findById(propertyfound.owner._id);
    if(!sellerfound || !buyerfound || !propertyfound){
      return response.status(404).json({ error: "Seller, buyer or property not found." });
    }
    console.log(sellerfound)
    console.log(propertyOwner)
    console.log(sellerfound._id)
    console.log(propertyOwner._id)
    if(!(sellerfound._id.equals( propertyOwner._id))){
      return response.status(401).json({ error: "Seller is not the owner of the property." });
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
module.exports = appointmentRouter;
