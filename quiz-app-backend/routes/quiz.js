import express from 'express';
import Quiz from '../models/quiz.js';
import QuizResponse from '../models/quizResponse.js';
import { authenticateUser } from '../middlewares/authenticate.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

// ----------------- Bilduppladdning -----------------
router.post('/upload-image', authenticateUser, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Ingen bild bifogades.' });
  }

  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.status(200).json({ imageUrl });
});

// ----------------- Skapa nytt quiz -----------------
router.post('/', authenticateUser, async (req, res) => {
  const { title, questions, isLiveQuiz } = req.body;

  if (!title || !questions) {
    return res.status(400).json({ error: 'Title and questions are required.' });
  }

  try {
    const newQuiz = new Quiz({
      title,
      questions,
      isLiveQuiz,
      createdBy: req.user._id,
    });

    await newQuiz.save();
    res.status(201).json(newQuiz);
  } catch (err) {
    console.error('Error creating quiz:', err);
    res.status(500).json({ message: 'Fel vid skapande av quiz.' });
  }
});

// ----------------- Hämta alla quiz -----------------
router.get('/', authenticateUser, async (req, res) => {
  try {
    const quizzes = await Quiz.find().populate('createdBy', 'name _id');
    res.status(200).json(quizzes);
  } catch (error) {
    console.error('Fel vid hämtning av quizen:', error);
    res.status(500).json({ message: 'Fel vid hämtning av quizen.' });
  }
});

// ----------------- Hämta ett specifikt quiz -----------------
router.get('/:quizId', authenticateUser, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ message: 'Quizet finns inte.' });
    res.status(200).json({ quiz });
  } catch (error) {
    console.error('Fel vid hämtning av quiz:', error);
    res.status(500).json({ message: 'Fel vid hämtning av quiz.' });
  }
});

// ----------------- Radera quiz -----------------
router.delete('/:quizId', authenticateUser, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ message: 'Quizet finns inte.' });
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Du har inte rätt att radera detta quiz.' });
    }

    await Quiz.findByIdAndDelete(req.params.quizId);
    await QuizResponse.deleteMany({ quiz: quiz._id }); // Ta bort live submissions också
    res.status(200).json({ message: 'Quiz raderat.' });
  } catch (err) {
    console.error('Fel vid radering av quiz:', err);
    res.status(500).json({ message: 'Fel vid radering av quiz.' });
  }
});

// ----------------- Uppdatera quiz -----------------
router.put('/:quizId', authenticateUser, async (req, res) => {
  const { title, questions, isLiveQuiz } = req.body;

  if (!title || !questions) {
    return res.status(400).json({ error: 'Title and questions are required.' });
  }

  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ message: 'Quizet finns inte.' });
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Du har inte rätt att redigera detta quiz.' });
    }

    quiz.title = title;
    quiz.questions = questions;
    quiz.isLiveQuiz = isLiveQuiz;
    await quiz.save();

    res.status(200).json(quiz);
  } catch (err) {
    console.error('Fel vid redigering av quiz:', err);
    res.status(500).json({ message: 'Fel vid redigering av quiz.' });
  }
});

// ----------------- Skicka in svar -----------------
router.post('/:quizId/submit', authenticateUser, async (req, res) => {
  const { quizId } = req.params;
  const { answers } = req.body;

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ message: 'Svar saknas eller är inte korrekt formaterade.' });
  }

  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quizet finns inte.' });

    const formattedSubmission = {
      playerName: req.user.name,
      submittedAt: new Date(),
      answers: answers.map((answerObj, index) => {
        const quizQuestion = quiz.questions[index];
        const maxSubQuestions = quizQuestion?.subQuestions?.length || 0;
        const safeSubAnswers = (answerObj.subAnswers || []).slice(0, maxSubQuestions);

        return {
          questionText: quizQuestion?.questionText || 'Okänd fråga',
          answer: answerObj.answer,
          subAnswers: safeSubAnswers.map((sub, subIndex) => ({
            subQuestionText: quizQuestion?.subQuestions?.[subIndex]?.questionText || 'Okänd följdfråga',
            subAnswer: sub.subAnswer,
          })),
        };
      }),
    };

    if (quiz.isLiveQuiz) {
      const liveSubmission = new QuizResponse({
        quiz: quiz._id,
        ...formattedSubmission,
      });
      await liveSubmission.save();
    } else {
      quiz.submissions.push(formattedSubmission);
      await quiz.save();
    }

    res.status(200).json({ message: 'Svar inskickade framgångsrikt.' });
  } catch (err) {
    console.error('Fel vid inskickning av svar:', err);
    res.status(500).json({ message: 'Något gick fel vid inskickning av svar.' });
  }
});

// ----------------- Hämta submissions (ENDAST för vanliga quiz) -----------------
router.get('/:quizId/submissions', authenticateUser, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ message: 'Quizet hittades inte.' });

    if (quiz.isLiveQuiz) {
      return res.status(400).json({ message: 'Det här är ett livequiz. Använd /live/:quizId/submissions istället.' });
    }

    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Du har inte rätt att se dessa submissions.' });
    }

    const submissions = quiz.submissions.map((submission) => {
      const answers = submission.answers.map((answerObj, index) => {
        const question = quiz.questions[index];
        const maxSubQuestions = question?.subQuestions?.length || 0;
        const safeSubAnswers = (answerObj.subAnswers || []).slice(0, maxSubQuestions);

        return {
          questionText: answerObj.questionText || question?.questionText || 'Okänd fråga',
          answer: answerObj.answer || '',
          subAnswers: safeSubAnswers.map((subAnswerObj, subIndex) => ({
            subQuestionText: subAnswerObj.subQuestionText || question?.subQuestions?.[subIndex]?.questionText || 'Okänd följdfråga',
            subAnswer: subAnswerObj.subAnswer || '',
          })),
        };
      });

      return {
        playerName: submission.playerName,
        submittedAt: submission.submittedAt,
        answers,
      };
    });

    res.status(200).json({ submissions });
  } catch (err) {
    console.error('Fel vid hämtning av submissions:', err);
    res.status(500).json({ message: 'Kunde inte hämta submissions.' });
  }
});

// ----------------- Hämta submissions för LIVEQUIZ -----------------
router.get('/live/:quizId/submissions', authenticateUser, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ message: 'Quizet hittades inte.' });

    if (!quiz.isLiveQuiz) {
      return res.status(400).json({ message: 'Det här är inte ett livequiz.' });
    }

    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Du har inte rätt att se dessa submissions.' });
    }

    const liveSubmissions = await QuizResponse.find({ quiz: quiz._id });

    const submissions = liveSubmissions.map((submission) => {
      const answers = submission.answers.map((answerObj, index) => {
        const question = quiz.questions[index];
        const maxSubQuestions = question?.subQuestions?.length || 0;
        const safeSubAnswers = (answerObj.subAnswers || []).slice(0, maxSubQuestions);

        return {
          questionText: answerObj.questionText || question?.questionText || 'Okänd fråga',
          answer: answerObj.answer || '',
          answerTime: answerObj.responseTime || null,   // Här lägger vi till svarstiden
          subAnswers: safeSubAnswers.map((subAnswerObj, subIndex) => ({
            subQuestionText: subAnswerObj.subQuestionText || question?.subQuestions?.[subIndex]?.questionText || 'Okänd följdfråga',
            subAnswer: subAnswerObj.subAnswer || '',
          })),
        };
      });

      return {
        playerName: submission.playerName,
        submittedAt: submission.submittedAt,
        answers,
      };
    });

    res.status(200).json({ submissions });
  } catch (err) {
    console.error('Fel vid hämtning av live submissions:', err);
    res.status(500).json({ message: 'Kunde inte hämta live submissions.' });
  }
});

export default router;
