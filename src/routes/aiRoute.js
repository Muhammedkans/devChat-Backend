const express = require("express");
const aiRouter = express.Router();
const { userAuth } = require("../middleware/userAuth");

// 🤖 AI Code Review Logic (Simulated Intelligence)
const analyzeCode = (code) => {
  const suggestions = [];

  if (!code) return { status: "neutral", message: "No code detected." };

  // 1. Detect Debugging
  if (code.includes("console.log")) {
    suggestions.push("⚠️ Recommendation: Remove 'console.log' statements before production to keep logs clean.");
  }

  // 2. Detect Old JS
  if (code.includes("var ")) {
    suggestions.push("ℹ️ Suggestion: Use 'let' or 'const' instead of 'var' for better scope management.");
  }

  // 3. Detect Complexity
  if (code.split("\n").length > 50) {
    suggestions.push("⚠️ Complexity Alert: This snippet is long. Consider breaking it into smaller helper functions.");
  }

  // 4. Detect Loops
  if (code.includes("for (")) {
    suggestions.push("💡 Tip: Consider using .map(), .filter(), or .reduce() for cleaner array operations if applicable.");
  }

  if (suggestions.length === 0) {
    return { status: "success", message: "✅ Excellent! Your code looks clean and follows standard practices." };
  }

  return { status: "warning", message: "🔍 AI Code Review:", suggestions };
};

// POST /ai/analyze - Private Route
aiRouter.post("/ai/analyze", userAuth, async (req, res) => {
  try {
    const { content } = req.body;

    // Simulate AI Processing Delay (for realism)
    await new Promise(resolve => setTimeout(resolve, 1500));

    const analysis = analyzeCode(content);

    res.status(200).json({
      message: "AI Analysis Complete",
      data: analysis
    });

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ message: "AI Engine Failed", error: error.message });
  }
});

module.exports = aiRouter;
