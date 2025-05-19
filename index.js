const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

mongoose
  .connect(
    "mongodb+srv://jubayer:dbjubayer@cluster0.plpzaca.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const express = require("express");
const path = require("path");
const cors = require("cors");
const fs = require("fs").promises;

const app = express();
const PORT = 5000;

const corsConfig = {
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
};

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

const User = mongoose.model("User", userSchema);

// Middleware
app.use(cors(corsConfig));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Store active quiz sessions
const activeSessions = {};

// Load questions from JSON file
async function loadQuestions() {
  try {
    const data = await fs.readFile(
      path.join(__dirname, "questions.json"),
      "utf8"
    );
    return JSON.parse(data);
  } catch (err) {
    console.error("Error loading questions:", err);
    return [];
  }
}

// Generate a random session ID
function generateSessionId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

// Select random questions for a quiz
function selectRandomQuestions(allQuestions, count = 10) {
  const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, "jubayer123", (err, decoded) => {
    if (err) return res.sendStatus(403);
    req.userId = decoded.userId;
    next();
  });
}

app.post("/api/auth/signup", async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: "Email already exists" });

    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id }, "jubayer123");
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, "jubayer123");
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

// Initialize a new quiz session and return all questions
app.post("/api/quiz/start", async (req, res) => {
  try {
    const questionCount = req.body.questionCount || 10;
    const allQuestions = await loadQuestions();

    if (allQuestions.length === 0) {
      return res.status(500).json({ error: "No questions available" });
    }

    const sessionId = generateSessionId();
    const selectedQuestions = selectRandomQuestions(
      allQuestions,
      questionCount
    );

    // Store session data
    activeSessions[sessionId] = {
      questions: selectedQuestions,
      startTime: Date.now(),
    };

    // Return all questions without answers
    const questionsWithoutAnswers = selectedQuestions.map((q) => {
      const { answer, ...questionWithoutAnswer } = q;
      return questionWithoutAnswer;
    });

    res.json({
      sessionId,
      totalQuestions: selectedQuestions.length,
      questions: questionsWithoutAnswers,
    });
  } catch (err) {
    console.error("Error starting quiz:", err);
    res.status(500).json({ error: "Failed to start quiz" });
  }
});

// Submit all answers and get results
app.post("/api/quiz/submit", authenticateToken, async (req, res) => {
  const { sessionId, answers } = req.body;

  if (!sessionId || !activeSessions[sessionId]) {
    return res.status(404).json({ error: "Quiz session not found" });
  }

  const session = activeSessions[sessionId];
  const quizTime = Math.floor((Date.now() - session.startTime) / 1000);
  let score = 0;

  const detailedResults = session.questions.map((question, index) => {
    const userAnswer = answers[index] || "";
    const isCorrect = userAnswer === question.answer;
    if (isCorrect) score += 1;

    return {
      question: question.question,
      userAnswer,
      correctAnswer: question.answer,
      isCorrect,
      options: { A: question.A, B: question.B, C: question.C, D: question.D },
    };
  });

  const result = {
    score,
    totalQuestions: session.questions.length,
    percentage: Math.round((score / session.questions.length) * 100),
    timeSpent: quizTime,
    detailedResults,
  };

  // Save to MongoDB
  try {
    const user = await User.findById(req.userId);
    user.scores.push(result);
    await user.save();
  } catch (err) {
    console.error("Error saving result to DB", err);
  }

  delete activeSessions[sessionId];
  res.json(result);
});

// Get quiz results by session ID
app.get("/api/quiz/results/:sessionId", (req, res) => {
  const { sessionId } = req.params;

  if (
    !sessionId ||
    !activeSessions[sessionId] ||
    !activeSessions[sessionId].results
  ) {
    return res.status(404).json({ error: "Quiz results not found" });
  }

  res.json(activeSessions[sessionId].results);
});

app.get("/api/user/profile", authenticateToken, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({
    username: user.username,
    email: user.email,
    scores: user.scores,
  });
});

app.get("/api/leaderboard", async (req, res) => {
  const users = await User.find();
  const leaderboard = [];

  users.forEach((user) => {
    user.scores.forEach((score) => {
      leaderboard.push({
        username: user.username,
        score: score.score,
        percentage: score.percentage,
        timeSpent: score.timeSpent,
      });
    });
  });

  leaderboard.sort((a, b) => b.score - a.score);
  res.json(leaderboard.slice(0, 10));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// module.exports = app;
