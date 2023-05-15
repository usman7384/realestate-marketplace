const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  photos: [{ type: String, required: true }],
  location: { type: String, required: true },
  history: { type: String, required: true },
  tax: { type: Number, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isSold: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  verificationComments: { type: String, default: "Not Verified" },
});

const Property = mongoose.model("Property", propertySchema);

module.exports = Property;
