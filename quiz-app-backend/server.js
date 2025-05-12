import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import userRoutes from './routes/user.js';
import quizRoutes from './routes/quiz.js';
import QuizResponse from './models/quizResponse.js'; // Importera quizResponse modellen
import Quiz from './models/quiz.js'; // Importera quiz modellen
import { scheduler } from './utils/scheduler.js';

dotenv.config();

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost/quiz-app';
mongoose.connect(mongoUrl)
  .then(() => console.log('✅ Ansluten till MongoDB'))
  .catch((error) => console.error('❌ Fel vid anslutning till MongoDB:', error));

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Rutter för användare
app.use('/api/users', userRoutes);

// Rutter för quiz
app.use('/api/quizzes', quizRoutes);

// Route för att ta emot och spara quiz-svar
app.post('/api/quizzes/:quizId/submissions', async (req, res) => {
  const { quizId } = req.params;
  const { playerName, answers } = req.body;

  if (!quizId || !playerName || !answers) {
    return res.status(400).send({ error: 'Fyll i alla obligatoriska fält.' });
  }

  try {
    // Hämta quizet från databasen för att säkerställa att det finns
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).send({ error: 'Quizet finns inte.' });
    }

    // Formatera svaren inklusive eventuella följdfrågor
    const formattedAnswers = answers.map(answer => {
      return {
        questionText: answer.questionText,
        answer: answer.answer,
        subAnswers: answer.subAnswers || [] // Hantera följdfrågor om de finns
      };
    });

    // Skapa ett quizResponse (svar på quizet)
    const quizResponse = new QuizResponse({
      quiz: quizId,
      playerName,
      answers: formattedAnswers
    });

    // Spara quiz-svaret i databasen
    await quizResponse.save();

    res.status(201).send(quizResponse); // Skicka tillbaka det sparade svaret som svar
  } catch (err) {
    console.error('Fel vid sparande av quiz-svar:', err);
    res.status(500).send({ error: 'Något gick fel, försök igen senare.' });
  }
});

app.get('/', (req, res) => {
  res.send('🚀 Välkommen till Quiz App API!');
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`✅ Servern körs på http://localhost:${port}`);
  scheduler();
});
