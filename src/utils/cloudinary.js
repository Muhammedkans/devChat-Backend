const cloudinary  = require("cloudinary");



cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,  // Your Cloudinary Cloud Name
  api_key: process.env.CLOUDINARY_API_KEY,        // Your API Key
  api_secret: process.env.CLOUDINARY_API_SECRET   // Your API Secret
});


module.exports = cloudinary;