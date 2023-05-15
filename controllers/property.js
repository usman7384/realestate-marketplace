const propertyRouter = require("express").Router();
const Property = require("../models/property");
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

propertyRouter.get("/", async (request, response) => {
  const properties = await Property.find({}).populate("owner", {
    username: 1,
    fullname: 1,
  });
  response.json(properties);
});

propertyRouter.get("/:id", async (request, response) => {
  const property = await Property.findById(request.params.id).populate(
    "owner",
    { username: 1, fullname: 1 },
  );
  if (property) {
    response.json(property);
  } else {
    response.status(404).end();
  }
});

propertyRouter.get("/owner/:id", async (request, response) => {
  const properties = await Property.find({ owner: request.params.id }).populate(
    "owner",
    { username: 1, fullname: 1 },
  );
  if (properties) {
    response.json(properties);
  } else {
    response.status(404).end();
  }
});

propertyRouter.get("/buyer/:id", async (request, response) => {
  const properties = await Property.find({ buyer: request.params.id }).populate(
    "owner",
    { username: 1, fullname: 1 },
  );
  if (properties) {
    response.json(properties);
  } else {
    response.status(404).end();
  }
});

propertyRouter.get("/search/:query", async (request, response) => {
  const properties = await Property.find({
    title: { $regex: request.params.query, $options: "i" },
  }).populate("owner", { username: 1, fullname: 1 });
  if (properties) {
    response.json(properties);
  } else {
    response.status(404).end();
  }
});

propertyRouter.get("/search/:query/:location", async (request, response) => {
  const properties = await Property.find({
    title: { $regex: request.params.query, $options: "i" },
    location: { $regex: request.params.location, $options: "i" },
  }).populate("owner", { username: 1, fullname: 1 });
  if (properties) {
    response.json(properties);
  } else {
    response.status(404).end();
  }
});

propertyRouter.post(
  "/",
  upload.array("attachments"),
  async (request, response) => {
    try {
      const { title, description, price, location, history, tax } =
        request.body;
      const decodedToken = jwt.verify(request.token, process.env.SECRET);
      if (!request.token || !decodedToken.id) {
        return response.status(401).json({ error: "token missing or invalid" });
      }
      const user = await User.findById(decodedToken.id);

      if (!user) {
        return response.status(401).json({ error: "user not found" });
      } else if (user.role !== "seller") {
        return response.status(401).json({ error: "user not authorized" });
      }
      const attachments = request.files.map((file) =>
        file.path.replace(/\\/g, "/"),
      );
      const property = new Property({
        title,
        description,
        price,
        photos: attachments,
        location,
        history,
        tax,
        owner: user._id,
        buyer: null,
        isSold: false,
      });
      console.log(property);
      const savedProperty = await property.save();
      user.propertiesOwned = user.propertiesOwned.concat(savedProperty._id);
      console.log(user);
      await user.save();
      response.json(savedProperty);
    } catch (error) {
      console.log(error);
      response.status(404).end();
    }
  },
);

propertyRouter.delete("/:id", async (request, response) => {
  try {
    const property = await Property.findById(request.params.id);
    const decodedToken = jwt.verify(request.token, process.env.SECRET);
    if (!request.token || !decodedToken.id) {
      return response.status(401).json({ error: "token missing or invalid" });
    }
    const user = await User.findById(decodedToken.id);
    if (!user) {
      return response.status(401).json({ error: "user not found" });
    } else if (user.role !== "seller" || user.role !== "admin") {
      return response.status(401).json({ error: "user not authorized" });
    }
    if (property && property.owner.toString() === user._id.toString()) {
      await Property.findByIdAndRemove(request.params.id);
      response.status(204).end();
    } else {
      response.status(404).end();
    }
  } catch (error) {
    response.status(404).end();
  }
});

propertyRouter.put("/:id", async (request, response) => {
  try {
    const { title, description, price, photos, location, history, tax } =
      request.body;
    const decodedToken = jwt.verify(request.token, process.env.SECRET);
    if (!request.token || !decodedToken.id) {
      return response.status(401).json({ error: "token missing or invalid" });
    }
    const user = await User.findById(decodedToken.id);
    if (!user) {
      return response.status(401).json({ error: "user not found" });
    } else if (user.role !== "seller" || user.role !== "admin") {
      return response.status(401).json({ error: "user not authorized" });
    }
    const property = await Property.findByIdAndUpdate(
      request.params.id,
      {
        title,
        description,
        price,
        photos,
        location,
        history,
        tax,
        buyer: null,
        isSold: false,
      },
      { new: true },
    );
    response.json(property);
  } catch (error) {
    response.status(404).end();
  }
});

propertyRouter.put("/buy/:id", async (request, response) => {
  try {
    const decodedToken = jwt.verify(request.token, process.env.SECRET);
    if (!request.token || !decodedToken.id) {
      return response.status(401).json({ error: "token missing or invalid" });
    }
    const user = await User.findById(decodedToken.id);
    console.log(user);
    if (!user) {
      return response.status(401).json({ error: "user not found" });
    } else if (user.role !== "customer") {
      return response.status(401).json({ error: "user not authorized" });
    }
    const property = await Property.findByIdAndUpdate(
      request.params.id,
      {
        buyer: user._id,
        isSold: true,
      },
      { new: true },
    );
    console.log(property);
    response.json(property);
  } catch (error) {
    response.status(404).end();
  }
});

propertyRouter.put("/cancel/:id", async (request, response) => {
  try {
    const decodedToken = jwt.verify(request.token, process.env.SECRET);
    if (!request.token || !decodedToken.id) {
      return response.status(401).json({ error: "token missing or invalid" });
    }
    const user = await User.findById(decodedToken.id);
    if (!user) {
      return response.status(401).json({ error: "user not found" });
    } else if (user.role !== "buyer") {
      return response.status(401).json({ error: "user not authorized" });
    }
    const property = await Property.findByIdAndUpdate(
      request.params.id,
      {
        buyer: null,
        isSold: false,
      },
      { new: true },
    );
    response.json(property);
  } catch (error) {
    response.status(404).end();
  }
});

propertyRouter.put("/:id/approve", async (request, response) => {
  try {
    const decodedToken = jwt.verify(request.token, process.env.SECRET);
    if (!request.token || !decodedToken.id) {
      return response.status(401).json({ error: "token missing or invalid" });
    }
    const user = await User.findById(decodedToken.id);
    if (!user) {
      return response.status(401).json({ error: "user not found" });
    } else if (user.role !== "admin") {
      return response.status(401).json({ error: "user not authorized" });
    }

    const propertyId = request.params.id;
    const property = await Property.findById(propertyId);

    if (!property) {
      return response.status(404).json({ error: "Property not found." });
    }

    property.isApproved = true;
    property.verificationComments = "Property approved by admin";

    const savedProperty = await property.save();
    response.json(savedProperty);
  } catch (error) {
    response.status(500).json({ error: "Failed to approve property." });
  }
});

propertyRouter.put("/:id/verify", async (request, response) => {
  try {
    const decodedToken = jwt.verify(request.token, process.env.SECRET);
    if (!request.token || !decodedToken.id) {
      return response.status(401).json({ error: "token missing or invalid" });
    }
    const user = await User.findById(decodedToken.id);
    if (!user) {
      return response.status(401).json({ error: "user not found" });
    } else if (user.role !== "admin") {
      return response.status(401).json({ error: "user not authorized" });
    }

    const propertyId = request.params.id;
    const property = await Property.findById(propertyId);

    if (!property) {
      return response.status(404).json({ error: "Property not found." });
    }

    property.isVerified = true;
    property.verificationComments = "Property documents verified";

    const savedProperty = await property.save();
    response.json(savedProperty);
  } catch (error) {
    response.status(500).json({ error: "Failed to verify property." });
  }
});

propertyRouter.get("/approved", async (request, response) => {
  try {
    const approvedProperties = await Property.find({ isApproved: true });
    response.json(approvedProperties);
  } catch (error) {
    response
      .status(500)
      .json({ error: "Failed to retrieve approved properties." });
  }
});

propertyRouter.get("/verified", async (request, response) => {
  try {
    const verifiedProperties = await Property.find({ isVerified: true });
    response.json(verifiedProperties);
  } catch (error) {
    response
      .status(500)
      .json({ error: "Failed to retrieve verified properties." });
  }
});

module.exports = propertyRouter;
