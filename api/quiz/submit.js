const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');

let activeSessions = {};

mongoose.connect("mongodb+srv://jubayer:dbjubayer@cluster0.plpzaca.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

function authenticateToken(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    return null;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const decoded = authenticateToken(req);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });

  const { sessionId, answers } = req.body;
  const session = activeSessions[sessionId];
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const quizTime = Math.floor((Date.now() - session.startTime) / 1000);
  let score = 0;

  const detailedResults = session.questions.map((q, i) => {
    const isCorrect = answers[i] === q.answer;
    if (isCorrect) score++;
    const { answer, ...rest } = q;
    return { ...rest, userAnswer: answers[i], correctAnswer: answer, isCorrect };
  });

  const result = {
    score,
    totalQuestions: session.questions.length,
    percentage: Math.round((score / session.questions.length) * 100),
    timeSpent: quizTime,
    detailedResults,
  };

  try {
    const user = await User.findById(decoded.userId);
    user.scores.push(result);
    await user.save();
  } catch (err) {
    console.error('Error saving result to DB', err);
  }

  delete activeSessions[sessionId];
  res.json(result);
};