const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  scores: [
    {
      score: Number,
      totalQuestions: Number,
      percentage: Number,
      timeSpent: Number,
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);