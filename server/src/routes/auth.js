const express = require("express");
const User = require("../models/User");
const Renter = require("../models/Renter");
const router = express.Router();

// Register: laging customer
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const user = await User.create({ name, email, password, role: "customer" });
    // every registered customer is also a renter (same ID in both)
    try {
      await Renter.create({
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: String(phone || "").trim() || "N/A",
      });
    } catch (err) {
      await User.findByIdAndDelete(user._id);
      throw err;
    }
    res.status(201).json({
      message: "Registered successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({ message: "Email already registered." });
    if (error.name === "ValidationError")
      return res.status(400).json({ message: error.message });
    next(error);
  }
});

// Login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({
      email: String(email || "").toLowerCase(),
    });
    if (!user || !(await user.matchPassword(password || ""))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    res.json({
      message: "Login successful.",
      user: {
        id: (await Renter.findOne({ email: user.email }))?._id ?? user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
