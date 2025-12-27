const express = require('express');
const storyRouter = express.Router();
const { userAuth } = require('../middleware/userAuth');
const Story = require('../models/story');
const User = require('../models/user');

// 🟢 Add a Story
storyRouter.post("/add", userAuth, async (req, res) => {
  try {
    const { mediaUrl, type } = req.body;

    if (!mediaUrl) {
      return res.status(400).json({ message: "Media URL is required" });
    }

    const story = new Story({
      userId: req.user._id,
      mediaUrl,
      type: type || 'image'
    });

    await story.save();

    res.json({ message: "Story added successfully", data: story });

  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

// 🔵 Get Stories Feed (Grouped by User)
storyRouter.get("/feed", userAuth, async (req, res) => {
  try {
    const currentUser = req.user;

    // Get list of users to fetch stories from (Self + Following)
    // Ideally should fetch following list. For now, let's fetch all stories or just demo logic.
    // Let's rely on standard logic: My stories + Following stories.

    // Fetch stories that have not expired
    const stories = await Story.find({
      expiresAt: { $gt: new Date() }
    })
      .populate('userId', 'firstName lastName photoUrl isPremium')
      .sort({ createdAt: 1 });

    // Group stories by user
    const groupedStories = {};

    stories.forEach(story => {
      const uid = story.userId._id.toString();
      if (!groupedStories[uid]) {
        groupedStories[uid] = {
          user: story.userId,
          stories: []
        };
      }
      groupedStories[uid].stories.push(story);
    });

    // Convert to array
    const feed = Object.values(groupedStories);

    // Sort: My story first, then others
    feed.sort((a, b) => {
      if (a.user._id.toString() === currentUser._id.toString()) return -1;
      if (b.user._id.toString() === currentUser._id.toString()) return 1;
      return 0;
    });

    res.json({ data: feed });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

// 👁️ View Story (Mark as viewed)
storyRouter.post("/view/:storyId", userAuth, async (req, res) => {
  try {
    const { storyId } = req.params;
    await Story.findByIdAndUpdate(storyId, {
      $addToSet: { viewers: req.user._id }
    });
    res.json({ message: "Story viewed" });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

module.exports = storyRouter;
