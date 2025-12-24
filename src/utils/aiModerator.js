const badWords = ["abuse", "kill", "idiot", "stupid", "hate", "terror", "scam"];

const moderateContent = (text) => {
  if (!text) return { isSafe: true };

  const lowerText = text.toLowerCase();
  const foundBadWords = badWords.filter((word) => lowerText.includes(word));

  if (foundBadWords.length > 0) {
    return {
      isSafe: false,
      reason: "Content contains inappropriate language.",
      flaggedWords: foundBadWords,
    };
  }

  return { isSafe: true };
};

module.exports = { moderateContent };
