import express from 'express';
import User from '../models/user.js';
import { Roles } from '../models/user.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, password, role } = req.body;


  const existingUser = await User.findOne({ $or: [{ name }] });
  if (existingUser) return res.status(400).json({ message: 'Användarnamn redan upptaget.' });

  const user = new User({
    name,
    password,
    role: role || Roles.PLAYER,
  });

  await user.save();
  res.status(201).json({ message: 'Användare skapad!' });
});


router.post('/login', async (req, res) => {
  const { name, password } = req.body;
  const user = await User.findOne({ name });

  if (!user || !user.comparePassword(password)) {
    return res.status(400).json({ message: 'Fel användarnamn eller lösenord.' });
  }

  res.json({ accessToken: user.accessToken });
});

export default router; 