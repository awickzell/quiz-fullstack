import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';

import userRoutes from './routes/user.js';
import quizRoutes from './routes/quiz.js';
import { scheduler } from './utils/scheduler.js';

dotenv.config();

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost/quiz-app';
mongoose.connect(mongoUrl)
  .then(() => console.log('✅ Ansluten till MongoDB'))
  .catch((error) => console.error('❌ Fel vid anslutning till MongoDB:', error));

const app = express();

app.use(cors());
app.use(bodyParser.json());

// API-rutter
app.use('/api/users', userRoutes);
app.use('/api/quizzes', quizRoutes);

// Root-rout för att verifiera att API fungerar
app.get('/', (req, res) => {
  res.send('🚀 Välkommen till Quiz App API!');
});

// Fångar alla okända endpoints
app.use((req, res) => {
  res.status(404).json({ error: 'Endpointen finns inte.' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`✅ Servern körs på http://localhost:${port}`);
  scheduler();
});
