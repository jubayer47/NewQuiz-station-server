const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

let activeSessions = {};

mongoose.connect("mongodb+srv://jubayer:dbjubayer@cluster0.plpzaca.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

function generateSessionId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

function selectRandomQuestions(allQuestions, count = 10) {
  const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const questionCount = req.body.questionCount || 10;
    const data = await fs.readFile(path.resolve('./questions.json'), 'utf8');
    const allQuestions = JSON.parse(data);

    if (allQuestions.length === 0) {
      return res.status(500).json({ error: 'No questions available' });
    }

    const sessionId = generateSessionId();
    const selectedQuestions = selectRandomQuestions(allQuestions, questionCount);

    activeSessions[sessionId] = {
      questions: selectedQuestions,
      startTime: Date.now(),
    };

    const questionsWithoutAnswers = selectedQuestions.map(({ answer, ...rest }) => rest);

    res.json({ sessionId, totalQuestions: selectedQuestions.length, questions: questionsWithoutAnswers });
  } catch (err) {
    console.error('Error starting quiz:', err);
    res.status(500).json({ error: 'Failed to start quiz' });
  }
};