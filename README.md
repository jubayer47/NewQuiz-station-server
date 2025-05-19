# 🎯 Quiz Master - Full Stack Quiz App

A full-stack quiz application that allows users to sign up, take timed quizzes, view their results, track play history, and compete on a global leaderboard. Built using React for the frontend, Express.js for the backend, and MongoDB for persistent storage.

---

## 🚀 Live Demo

- **Frontend**: [https://quiz-station-client.vercel.app](https://quiz-station-client.vercel.app)
- **Backend API**: [https://quiz-station-server-ten.vercel.app](https://quiz-station-server-ten.vercel.app)

---

## 🧠 Features

### ✅ General

- Responsive UI with TailwindCSS
- Uses Trivia API to fetch real-time questions
- Seamless navigation using React Router
- Clean and modular codebase

### 🧩 Frontend (React + TailwindCSS)

- Home page with quiz start option
- Quiz page with dynamic 10-question game
- Results page showing detailed analysis
- Signup & login functionality with JWT
- User profile page showing play history
- Leaderboard with top 10 users
- Session storage & local storage integration

### 🛠️ Backend (Node.js + Express + MongoDB)

- REST API using Express
- CORS configured for Vercel
- Auth routes: `/signup`, `/login` using JWT
- Quiz session routes: `/quiz/start`, `/quiz/submit`, `/quiz/results/:sessionId`
- MongoDB integration for:
  - User data
  - Quiz history
  - Leaderboard
- Modular code with middleware for JWT authentication

---

## 📦 Installation

### 🔧 Prerequisites

- Node.js
- npm or yarn
- MongoDB Atlas

---

## ⚙️ Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Set up environment variables in a `.env` file
touch .env