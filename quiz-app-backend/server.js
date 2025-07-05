import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import http from 'http';
import { Server } from 'socket.io';
import userRoutes from './routes/user.js';
import quizRoutes from './routes/quiz.js';
import { scheduler } from './utils/scheduler.js';
import { setupLiveQuizHandlers } from './socketHandlers/liveQuiz.js';

dotenv.config();

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost/quiz-app';
mongoose.connect(mongoUrl)
  .then(() => console.log('✅ Ansluten till MongoDB'))
  .catch((error) => console.error('❌ Fel vid anslutning till MongoDB:', error));

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

// Rutter
app.use('/api/users', userRoutes);
app.use('/api/quizzes', quizRoutes);

// Root-route
app.get('/', (req, res) => {
  res.send('🚀 Välkommen till Quiz App API!');
});

// 404-hantering
app.use((req, res) => {
  res.status(404).json({ error: 'Endpointen finns inte.' });
});

// ------------------- SOCKET.IO-HANTERING -------------------

io.on('connection', (socket) => {
  console.log(`📡 Ny användare ansluten: ${socket.id}`);
  setupLiveQuizHandlers(io, socket);
});

// -----------------------------------------------------------

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`✅ Servern körs på http://localhost:${port}`);
  scheduler();
});
