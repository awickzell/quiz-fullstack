import express from 'express';
import User from '../models/user.js';
import { authenticateUser } from '../middlewares/authenticate.js';

const router = express.Router();

// 🟢 Registrera användare
router.post('/register', async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ message: 'Användarnamn och lösenord krävs' });
  }

  const existingUser = await User.findOne({ name });
  if (existingUser) return res.status(400).json({ message: 'Användarnamn redan upptaget.' });

  const user = new User({ name, password });
  await user.save();

  res.status(201).json({ message: 'Användaren skapas' });
});

// 🟢 Logga in
router.post('/login', async (req, res) => {
  const { name, password } = req.body;

  const user = await User.findOne({ name });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(400).json({ message: 'Fel användarnamn eller lösenord.' });
  }

  res.json({
    message: 'Inloggning lyckades',
    accessToken: user.accessToken,
  });
});

// 🟢 Hämta användarprofil
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Användare inte hittad.' });
    }
    res.json({
      name: user.name,
      _id: user._id,
    });
  } catch (err) {
    res.status(500).json({ message: 'Fel vid hämtning av användarprofil.' });
  }
});

// 🟢 Hämta aktuell användare
router.get('/me', authenticateUser, (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
  });
});

export default router;
