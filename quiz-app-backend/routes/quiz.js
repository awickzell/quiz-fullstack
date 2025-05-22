import express from 'express'; 
import Quiz from '../models/quiz.js';
import QuizResponse from '../models/quizResponse.js';
import { authenticateUser } from '../middlewares/authenticate.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

// Bilduppladdning
router.post('/upload-image', authenticateUser, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Ingen bild bifogades.' });
  }

  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.status(200).json({ imageUrl });
});

// POST – Skapa ett quiz
router.post('/', authenticateUser, async (req, res) => {
  const { title, questions } = req.body;

  if (!title || !questions) {
    return res.status(400).json({ error: 'Title and questions are required.' });
  }

  try {
    const newQuiz = new Quiz({
      title,
      questions,
      createdBy: req.user._id,
    });

    await newQuiz.save();
    res.status(201).json(newQuiz);
  } catch (err) {
    console.error('Error creating quiz:', err);
    res.status(500).json({ message: 'Fel vid skapande av quiz.' });
  }
});

// GET – Hämta alla quiz
router.get('/', authenticateUser, async (req, res) => {
  try {
    const quizzes = await Quiz.find().populate('createdBy', 'name _id');
    res.status(200).json(quizzes);
  } catch (error) {
    console.error('Fel vid hämtning av quizen:', error);
    res.status(500).json({ message: 'Fel vid hämtning av quizen.' });
  }
});

// GET – Hämta ett specifikt quiz
router.get('/:quizId', authenticateUser, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);

    if (!quiz) {
      return res.status(404).json({ message: 'Quizet finns inte.' });
    }

    res.status(200).json({ quiz });
  } catch (error) {
    console.error('Fel vid hämtning av quiz:', error);
    res.status(500).json({ message: 'Fel vid hämtning av quiz.' });
  }
});

// DELETE – Radera ett specifikt quiz
router.delete('/:quizId', authenticateUser, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);

    if (!quiz) {
      return res.status(404).json({ message: 'Quizet finns inte.' });
    }

    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Du har inte rätt att radera detta quiz.' });
    }

    await Quiz.findByIdAndDelete(req.params.quizId);
    res.status(200).json({ message: 'Quiz raderat.' });
  } catch (err) {
    console.error('Fel vid radering av quiz:', err);
    res.status(500).json({ message: 'Fel vid radering av quiz.' });
  }
});


// PUT – Redigera ett specifikt quiz
router.put('/:quizId', authenticateUser, async (req, res) => {
  const { title, questions } = req.body;

  if (!title || !questions) {
    return res.status(400).json({ error: 'Title and questions are required.' });
  }

  try {
    const quiz = await Quiz.findById(req.params.quizId);

    if (!quiz) {
      return res.status(404).json({ message: 'Quizet finns inte.' });
    }

    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Du har inte rätt att redigera detta quiz.' });
    }

    quiz.title = title;
    quiz.questions = questions;

    await quiz.save();
    res.status(200).json(quiz);
  } catch (err) {
    console.error('Fel vid redigering av quiz:', err);
    res.status(500).json({ message: 'Fel vid redigering av quiz.' });
  }
});

// POST – Visa alla spelares svar för skaparen av quizet
router.post('/:quizId/grade', authenticateUser, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);

    if (!quiz) {
      return res.status(404).json({ message: 'Quizet hittades inte.' });
    }

    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Du får inte rätta detta quiz.' });
    }

    const gradingView = quiz.submissions.map((submission) => {
      const answers = submission.answers.map((answerObj, index) => {
        const question = quiz.questions[index];

        const subAnswers = (answerObj.subAnswers || []).map((subAnswerObj, subIndex) => ({
          subQuestionText: subAnswerObj.subQuestionText || question?.subQuestions?.[subIndex]?.questionText || 'Okänd följdfråga',
          subAnswer: subAnswerObj.subAnswer || '',
        }));

        return {
          questionText: answerObj.questionText || question?.questionText || 'Okänd fråga',
          answer: answerObj.answer || '',
          subAnswers: subAnswers,
        };
      });

      return {
        playerName: submission.playerName,
        submittedAt: submission.submittedAt,
        answers: answers,
      };
    });

    res.status(200).json({ gradingView });
  } catch (err) {
    console.error('Fel vid hämtning av spelarsvar:', err);
    res.status(500).json({ message: 'Något gick fel vid rättningen.' });
  }
});

// POST – Skicka in quizsvar (✅ uppdaterad med subAnswers)
router.post('/:quizId/submit', authenticateUser, async (req, res) => {
  const { quizId } = req.params;
  const { answers } = req.body;

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ message: 'Svar saknas eller är inte korrekt formaterade.' });
  }

  try {
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({ message: 'Quizet finns inte.' });
    }

    const submission = {
      playerName: req.user.name,
      submittedAt: new Date(),
      answers: answers.map((answerObj) => ({
        questionText: answerObj.questionText,
        answer: answerObj.answer,
        subAnswers: (answerObj.subAnswers || []).map((sub) => ({
          subQuestionText: sub.subQuestionText,
          subAnswer: sub.subAnswer,
        })),
      })),
    };

    quiz.submissions.push(submission);
    await quiz.save();

    res.status(200).json({ message: 'Svar inskickade framgångsrikt.' });
  } catch (err) {
    console.error('Fel vid inskickning av svar:', err);
    res.status(500).json({ message: 'Något gick fel vid inskickning av svar.' });
  }
});

// GET – Hämta submissioner med följdfrågor
router.get('/:quizId/submissions', authenticateUser, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);

    if (!quiz) {
      return res.status(404).json({ message: 'Quizet hittades inte.' });
    }

    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Du har inte rätt att se dessa submissions.' });
    }

    const submissionsWithQuestions = quiz.submissions.map((submission) => {
      const mappedAnswers = submission.answers.map((answerObj, index) => {
        const question = quiz.questions[index];

        return {
          questionText: answerObj.questionText || question?.questionText || 'Okänd fråga',
          answer: answerObj.answer || '',
          subAnswers: (answerObj.subAnswers || []).map((subAnswerObj, subIndex) => ({
            subQuestionText: subAnswerObj.subQuestionText || question?.subQuestions?.[subIndex]?.questionText || 'Okänd följdfråga',
            subAnswer: subAnswerObj.subAnswer || '',
          })),
        };
      });

      return {
        playerName: submission.playerName,
        submittedAt: submission.submittedAt,
        answers: mappedAnswers,
      };
    });

    res.status(200).json({ submissions: submissionsWithQuestions });
  } catch (err) {
    console.error('Fel vid hämtning av submissions:', err);
    res.status(500).json({ message: 'Kunde inte hämta submissions.' });
  }
});

export default router;
