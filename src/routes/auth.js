const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const { validationSignUp } = require("../utils/validation");
require("dotenv").config();

const authRouter = express.Router();

// ✅ Check environment (for secure cookies)
const isProduction = process.env.NODE_ENV === "production";

// ✅ Signup Route
authRouter.post("/signup", async (req, res) => {
  try {
    validationSignUp(req); // Optional validation

    const { firstName, lastName, emailId, password, age, gender, about } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
      age,
      gender,
      about,
    });

    const savedUser = await user.save();
    const token = await savedUser.getJWT();

    // ✅ Set cookie depending on environment
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction, // 👉 true in production (HTTPS)
      sameSite: isProduction ? "None" : "Lax", // 👉 'None' in prod, 'Lax' in dev
      maxAge: 8 * 3600000, // 8 hours
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        _id: savedUser._id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        emailId: savedUser.emailId,
        photoUrl: savedUser.photoUrl,
      },
    });
  } catch (err) {
    console.error("❌ Signup Error:", err.message);
    res.status(400).json({ error: "Signup failed" });
  }
});

// ✅ Login Route
authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    const user = await User.findOne({ emailId });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = await user.getJWT();

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      maxAge: 8 * 3600000,
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        emailId: user.emailId,
        photoUrl: user.photoUrl,
      },
    });
  } catch (err) {
    console.error("❌ Login Error:", err.message);
    res.status(400).json({ error: "Login failed" });
  }
});


authRouter.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // ✅ use true only in production
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // ✅ required for cross-origin cookies
  });

  return res.status(200).json({ message: "Logged out successfully" });
});



module.exports = authRouter;