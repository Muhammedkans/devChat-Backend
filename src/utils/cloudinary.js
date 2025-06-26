// config/cloudinary.js
const cloudinary = require("cloudinary").v2; // ✅ Use .v2 for latest methods

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // ✅ always use HTTPS for uploads
});

module.exports = cloudinary;
