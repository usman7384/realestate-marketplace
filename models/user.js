const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true, match: /.+\@.+\..+/ },
  password: { type: String, required: true, minlength: 5 },
  phone: { type: String, required: true, minlength: 11 },
  address: { type: String, required: true },
  role: {
    type: String,
    enum: ["admin", "seller", "customer"],
    default: "customer",
    required: true,
  },
  propertiesOwned: [{ type: mongoose.Schema.Types.ObjectId, ref: "Property" }],
  propertiesBought: [{ type: mongoose.Schema.Types.ObjectId, ref: "Property" }],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Property" }],
});

const User = mongoose.model("User", userSchema);

module.exports = User;
