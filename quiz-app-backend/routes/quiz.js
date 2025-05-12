import express from 'express';
import Quiz from '../models/quiz.js';
import QuizResponse from '../models/quizResponse.js';
import { authenticateUser } from '../middlewares/authenticate.js';

const router = express.Router();

// GET – Hämta alla quiz
router.get('/', authenticateUser, async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .populate('createdBy', 'name')
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
      .populate('createdBy', 'name')
      .exec();

    if (!quiz) {
      return res.status(404).json({ message: 'Quizet finns inte.' });
    }

    res.status(200).json({ quiz });
  } catch (error) {
    console.error('Fel vid hämtning av quiz:', error);
    res.status(500).json({ message: 'Fel vid hämtning av quiz.' });
  }
});

// GET – Hämta submissions för ett specifikt quiz
router.get('/:quizId/submissions', authenticateUser, async (req, res) => {
  try {
    const submissions = await QuizResponse.find({ quiz: req.params.quizId });
    res.status(200).json(submissions);
  } catch (error) {
    console.error('Fel vid hämtning av submissions:', error);
    res.status(500).json({ message: 'Fel vid hämtning av submissions.' });
  }
});

// POST – Skicka in ett quiz-svar
router.post('/:quizId/submit', authenticateUser, async (req, res) => {
  const { quizId } = req.params;
  const { answers } = req.body;

  if (!quizId || !answers) {
    return res.status(400).json({ error: 'Fyll i alla obligatoriska fält.' });
  }

  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quizet finns inte.' });
    }

    const formattedAnswers = answers.map((ans) => ({
      questionText: ans.question,
      answer: ans.answer,
      subAnswers: ans.subAnswers?.map((sub) => ({
        subQuestionText: sub.question,
        subAnswer: sub.answer,
      })) || [],
    }));

    const quizResponse = new QuizResponse({
      quiz: quizId,
      playerName: req.user.name,
      answers: formattedAnswers,
    });

    await quizResponse.save();
    res.status(201).json({ message: 'Svar inskickat!' });
  } catch (err) {
    console.error('Fel vid inskickning av svar:', err);
    res.status(500).json({ error: 'Något gick fel vid inskickning.' });
  }
});

export default router;
