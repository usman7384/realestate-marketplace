const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const usersRouter = require("express").Router();
const User = require("../models/user");
const Property = require("../models/property");


usersRouter.get('/favourites', async (request, response) => {
  try {
    const decodedToken = jwt.verify(request.token, process.env.SECRET);
    if (!request.token || !decodedToken.id) {
      return response.status(401).json({ error: 'token missing or invalid' });
    }

    const user = await User.findById(decodedToken.id).populate('wishlist');
    if (!user) {
      return response.status(401).json({ error: 'user not found' });
    }

    const wishlist = user.wishlist;
    response.json(wishlist);
  } catch (error) {
    response.status(400).json({ message: error.message });
  }
});


usersRouter.get("/sellers", async (request, response) => {
  try {
    const sellers = await User.find({ role: "seller" });
    response.json(sellers);
  } catch (error) {
    response.status(404).end();
  }
});

usersRouter.get("/customers", async (request, response) => {
  try {
    const customers = await User.find({ role: "customer" });
    response.json(customers);
  } catch (error) {
    response.status(404).end();
  }
});

usersRouter.get("/", async (request, response) => {
  const users = await User.find({});
  response.json(users);
});

usersRouter.get("/:id", async (request, response) => {
  const user = await User.findById(request.params.id);
  if (user) {
    response.json(user);
  } else {
    response.status(404).end();
  }
});

usersRouter.get("/username/:username", async (request, response) => {
  const user = await User.findOne({ username: request.params.username });
  if (user) {
    response.json(user);
  } else {
    response.status(404).end();
  }
});



usersRouter.post("/customer", async (request, response) => {
  try {
    const { username, fullname, email, password, phone, address } =
      request.body;
      console.log("i am here")
    const existingUsername = await User.findOne({ username });
    const existingEmail = await User.findOne({ email });
    if (request.body.password.length < 5) {
      return response
        .status(400)
        .json({ error: "Password must be at least 5 characters long" });
    } else if (existingUsername || existingEmail) {
      return response.status(400).json({
        error: "username and email must be unique",
      });
    } else {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const newUser = new User({
        username,
        fullname,
        email,
        password: passwordHash,
        phone,
        address,
        role: "customer",
      });
      console.log(newUser)
      const savedUser = await newUser.save();
      response.status(201).json(savedUser);
    }
  } catch (error) {
    console.log(error)
    response.status(400).json({ message: error.message });
  }
});

usersRouter.post("/seller", async (request, response) => {
  try {
    const { username, fullname, email, password, phone, address } =
      request.body;
    const existingUsername = await User.findOne({ username });
    const existingEmail = await User.findOne({ email });
    if (request.body.password.length < 5) {
      return response
        .status(400)
        .json({ error: "Password must be at least 5 characters long" });
    } else if (existingUsername || existingEmail) {
      return response.status(400).json({
        error: "username and email must be unique",
      });
    } else {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const newUser = new User({
        username,
        fullname,
        email,
        password: passwordHash,
        phone,
        address,
        role: "seller",
      });
      const savedUser = await newUser.save();
      response.status(201).json(savedUser);
    }
  } catch (error) {
    response.status(400).json({ message: error.message });
  }
});


//signup as admin
usersRouter.post("/admin", async (request, response) => {
  try {
    const { username, fullname, email, password, phone, address } =
      request.body;
    const existingUsername = await User.findOne({ username });
    const existingEmail = await User.findOne({ email });
    if (request.body.password.length < 5) {
      return response
        .status(400)
        .json({ error: "Password must be at least 5 characters long" });
    } else if (existingUsername || existingEmail) {
      return response.status(400).json({
        error: "username and email must be unique",
      });
    } else {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const newUser = new User({
        username,
        fullname,
        email,
        password: passwordHash,
        phone,
        address,
        role: "admin",
      });
      const savedUser = await newUser.save();
      response.status(201).json(savedUser);
    }
  } catch (error) {
    response.status(400).json({ message: error.message });
  }
});

//edit user
usersRouter.put("/:id", async (request, response) => {
  try {
    const { username, fullname, email, password, phone, address } =
      request.body;
      console.log(request.body)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    console.log("reqtok",request.token)
    const decodedToken = jwt.verify(request.token, process.env.SECRET);
    console.log("dec",decodedToken);
    if (!request.token || !decodedToken.id) {
      return response.status(401).json({ error: "token missing or invalid" });
    }
    console.log(request.token, decodedToken.id)
    const user = await User.findById(decodedToken.id);
    if (!user) {
      return response.status(401).json({ error: "user not found" });
    }
    console.log(user)
    if (request.params.id !== decodedToken.id) {
      if (user.role == "admin") {
        const updatedUser = await User.findByIdAndUpdate(
          request.params.id,
          {
            username,
            fullname,
            email,
            password: passwordHash,
            phone,
            address,
          },
          { new: true },
        );
        response.json(updatedUser);
      } else {
        return response.status(401).json({ error: "user not authorized" });
      }
    } else if (request.params.id == decodedToken.id) {
      const updatedUser = await User.findByIdAndUpdate(
        request.params.id,
        {
          username,
          fullname,
          email,
          password: passwordHash,
          phone,
          address,
        },
        { new: true },
      );
      response.json(updatedUser);
      response.json(deletedUser);
    }
  } catch (error) {
    response.status(400).json({ message: error.message });
  }
});

//delete a user
usersRouter.delete("/:id", async (request, response) => {
  try {
    console.log(request.params.id);
    console.log(request.token);
    const decodedToken = jwt.verify(request.token, process.env.SECRET);
    if (!request.token || !decodedToken.id) {
      return response.status(401).json({ error: "token missing or invalid" });
    }
    const user = await User.findById(decodedToken.id);
    if (!user) {
      return response.status(401).json({ error: "user not found" });
    }
    console.log(user);
    if (request.params.id !== decodedToken.id) {
      if (user.role == "admin") {
        const deletedUser = await User.findByIdAndRemove(request.params.id);
        response.json(deletedUser);
      } else {
        return response.status(401).json({ error: "user not authorized" });
      }
    } else if (request.params.id == decodedToken.id) {
      const deletedUser = await User.findByIdAndRemove(request.params.id);
      response.json(deletedUser);
    }
  } catch (error) {
    response.status(400).json({ message: error.message });
  }
});



usersRouter.put("/wishlist/:Propertyid", async (request, response) => {
  console.log(request.params);
  try {
    const Propertyid  = request.params.Propertyid;
    console.log("prtropt",Propertyid);
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
    const property = await Property.findById(Propertyid);
    console.log(property);

    const updatedUser = await User.findById(user._id);
    updatedUser.wishlist.push(Propertyid);
    await updatedUser.save();
    console.log(updatedUser.wishlist);
    response.json(updatedUser);
  } catch (error) {
    response.status(400).json({ message: error.message });
  }
});

usersRouter.delete("/wishlist/:propertyId", async (request, response) => {
  try {
    const propertyId = request.params.propertyId;
    console.log(propertyId)
    console.log(request.token);
    const decodedToken = jwt.verify(request.token, process.env.SECRET);
    if (!request.token || !decodedToken.id) {
      return response.status(401).json({ error: "token missing or invalid" });
    }

    const user = await User.findById(decodedToken.id);
    if (!user) {
      return response.status(401).json({ error: "user not found" });
    } else if (user.role !== "customer") {
      return response.status(401).json({ error: "user not authorized" });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return response.status(404).json({ error: "property not found" });
    }
    console.log(property);
    user.wishlist.pull(propertyId);
    await user.save();

    response.json(user);
  } catch (error) {
    response.status(400).json({ message: error.message });
  }
});





  


module.exports = usersRouter;
