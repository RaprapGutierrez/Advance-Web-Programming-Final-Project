require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./db");
const User = require("./models/User");

(async () => {
  await connectDB();
  const exists = await User.findOne({ role: "owner" });
  if (exists) {
    console.log("Owner already exists.");
  } else {
    await User.create({
      name: process.env.OWNER_NAME,
      email: process.env.OWNER_EMAIL,
      password: process.env.OWNER_PASSWORD,
      role: "owner",
    });
    console.log("Owner created.");
  }
  await mongoose.connection.close();
})();
