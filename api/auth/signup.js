const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');

mongoose.connect("mongodb+srv://jubayer:dbjubayer@cluster0.plpzaca.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: 'Email already exists' });

    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Signup failed' });
  }
};