const mongoose = require("mongoose");

const profileViewSchema = new mongoose.Schema(
  {
    viewedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate views in a short period (optional: could limit to 1 view per 24h per user)
profileViewSchema.index({ viewedUser: 1, viewer: 1, createdAt: 1 });

module.exports = mongoose.model("ProfileView", profileViewSchema);
