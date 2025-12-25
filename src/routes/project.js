const express = require('express');
const projectRouter = express.Router();
const { userAuth } = require('../middleware/userAuth');
const Project = require('../models/project');
const User = require('../models/user');

// 🟢 Add a New Project
projectRouter.post("/add", userAuth, async (req, res) => {
  try {
    const { title, description, techStack, githubLink, liveLink, imageUrl } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and Description are required" });
    }

    // Validate links if provided
    // Using a basic regex or just simple check
    // Ideally should use a validator library

    const project = new Project({
      userId: req.user._id,
      title,
      description,
      techStack: Array.isArray(techStack) ? techStack : techStack?.split(',').map(t => t.trim()),
      githubLink,
      liveLink,
      imageUrl
    });

    await project.save();

    res.json({ message: "Project added successfully", data: project });

  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

// 🔵 Get Projects of a User
projectRouter.get("/user/:userId", userAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const projects = await Project.find({ userId }).sort({ createdAt: -1 });
    res.json({ data: projects });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

// 🔴 Delete a Project
projectRouter.delete("/:projectId", userAuth, async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const project = await Project.findOne({ _id: projectId, userId: req.user._id });

    if (!project) {
      return res.status(404).json({ message: "Project not found or you don't have permission" });
    }

    await Project.findByIdAndDelete(projectId);
    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

module.exports = projectRouter;
