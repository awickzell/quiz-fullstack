import express from 'express';
import Quiz from '../models/quiz.js';
import { authenticateUser } from '../middlewares/authenticate.js';

const router = express.Router();

// GET – Hämta alla quiz
router.get('/', authenticateUser, async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .populate('createdBy', 'name') // Populera användaren och hämta 'name' från användarens data
      .exec();
    res.status(200).json(quizzes);
  } catch (error) {
    console.error('Fel vid hämtning av quizen:', error);
    res.status(500).json({ message: 'Fel vid hämtning av quizen.' });
  }
});

// GET – Hämta ett specifikt quiz
router.get('/:quizId', authenticateUser, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId)
      .populate('createdBy', 'name') // Hämta skaparen av quizet
      .exec();

    if (!quiz) {
      return res.status(404).json({ message: 'Quizet finns inte.' });
    }

    res.status(200).json(quiz);
  } catch (error) {
    console.error('Fel vid hämtning av quiz:', error);
    res.status(500).json({ message: 'Fel vid hämtning av quiz.' });
  }
});

export default router;
