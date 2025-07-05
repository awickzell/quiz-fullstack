import QuizResponse from '../models/quizResponse.js';
import { startTimer, stopTimer, clearTimers } from '../utils/timerManager.js';

const liveQuizSessions = new Map();

export const setupLiveQuizHandlers = (io, socket) => {
  console.log(`📡 Socket ansluten: ${socket.id}`);

  socket.on('join-quiz', ({ quizId, playerId, playerName }) => {
    if (!quizId || !playerId || !playerName) {
      return socket.emit('error', { message: 'Ogiltiga uppgifter för att gå med i quiz.' });
    }

    socket.join(quizId);

    if (!liveQuizSessions.has(quizId)) {
      liveQuizSessions.set(quizId, {
        players: new Map(),
        answers: [],
        quiz: null,
        currentQuestionIndex: 0,
        currentQuestionAnswers: new Map(),
        hostSocketId: null,
      });
    }

    const session = liveQuizSessions.get(quizId);
    session.players.set(playerId, { playerName, socketId: socket.id });

    const players = Array.from(session.players.values()).map((p) => p.playerName);
    io.to(quizId).emit('lobby-update', { players });

    if (session.quiz && session.currentQuestionIndex < session.quiz.questions.length) {
      const currentQuestion = session.quiz.questions[session.currentQuestionIndex];
      socket.emit('show-question', currentQuestion);
      socket.emit('question-metadata', {
        currentIndex: session.currentQuestionIndex + 1,
        total: session.quiz.questions.length,
      });
    }
  });

  socket.on('host-quiz', ({ quizId, quizData }) => {
    socket.join(quizId);

    if (!liveQuizSessions.has(quizId)) {
      liveQuizSessions.set(quizId, {
        players: new Map(),
        answers: [],
        quiz: null,
        currentQuestionIndex: 0,
        currentQuestionAnswers: new Map(),
        hostSocketId: null,
      });
    }

    const session = liveQuizSessions.get(quizId);
    session.quiz = quizData;
    session.currentQuestionIndex = 0;
    session.currentQuestionAnswers = new Map();
    session.hostSocketId = socket.id;

    const players = Array.from(session.players.values()).map(p => p.playerName);
    socket.emit('lobby-update', { players });
    socket.to(quizId).emit('host-joined');
  });

  socket.on('start-quiz', ({ quizId }) => {
    const session = liveQuizSessions.get(quizId);
    if (!session || !session.quiz) return;

    session.currentQuestionIndex = 0;
    session.currentQuestionAnswers = new Map();

    io.to(quizId).emit('quiz-started');

    const firstQuestion = session.quiz.questions[0];
    const questionIndex = 0;

    const emitQuestion = (socketId, playerId) => {
      io.to(socketId).emit('show-question', firstQuestion);
      io.to(socketId).emit('question-metadata', {
        currentIndex: 1,
        total: session.quiz.questions.length,
      });

      if (playerId !== 'HOST') {
        startTimer(quizId, playerId, questionIndex);
      }
    };

    for (const [playerId, player] of session.players.entries()) {
      emitQuestion(player.socketId, playerId);
    }

    if (session.hostSocketId) {
      emitQuestion(session.hostSocketId, 'HOST');
    }
  });

  socket.on('player-ready', ({ quizId, playerId }) => {
    const session = liveQuizSessions.get(quizId);
    if (!session || !session.quiz) return;

    const player = session.players.get(playerId);
    if (!player) return;

    const question = session.quiz.questions[session.currentQuestionIndex];
    if (!question) return;

    io.to(player.socketId).emit('show-question', question);
    io.to(player.socketId).emit('question-metadata', {
      currentIndex: session.currentQuestionIndex + 1,
      total: session.quiz.questions.length,
    });

    startTimer(quizId, playerId, session.currentQuestionIndex);
  });

  socket.on('next-question', ({ quizId, questionIndex }) => {
    const session = liveQuizSessions.get(quizId);
    if (!session || !session.quiz) return;

    const question = session.quiz.questions[questionIndex];
    if (!question) return;

    session.currentQuestionIndex = questionIndex;
    session.currentQuestionAnswers = new Map();

    const emitQuestion = (socketId, playerId) => {
      io.to(socketId).emit('show-question', question);
      io.to(socketId).emit('question-metadata', {
        currentIndex: questionIndex + 1,
        total: session.quiz.questions.length,
      });

      if (playerId !== 'HOST') {
        startTimer(quizId, playerId, questionIndex);
      }
    };

    for (const [playerId, player] of session.players.entries()) {
      emitQuestion(player.socketId, playerId);
    }

    if (session.hostSocketId) {
      emitQuestion(session.hostSocketId, 'HOST');
    }
  });

  socket.on('submit-answer', ({ quizId, playerId, playerName, answerData }) => {
    const session = liveQuizSessions.get(quizId);
    const player = session?.players.get(playerId);

    if (!session || !player) return;
    if (session.currentQuestionAnswers.has(playerId)) return;

    const questionIndex = session.currentQuestionIndex;
    const responseTimeMs = stopTimer(quizId, playerId, questionIndex);

    session.currentQuestionAnswers.set(playerId, {
      ...answerData,
      responseTime: responseTimeMs,
    });

    const question = session.quiz.questions[questionIndex];

    let playerEntry = session.answers.find(entry => entry.playerName === player.playerName);
    if (!playerEntry) {
      playerEntry = {
        playerName: player.playerName,
        answerData: [],
      };
      session.answers.push(playerEntry);
    }

    playerEntry.answerData.push({
      ...answerData,
      responseTime: responseTimeMs,
      questionId: answerData.questionId || question?._id || null,
    });

    const answeredPlayers = Array.from(session.currentQuestionAnswers.keys())
      .map(id => session.players.get(id)?.playerName)
      .filter(Boolean);

    io.to(quizId).emit('answer-count-update', {
      count: session.currentQuestionAnswers.size,
      totalPlayers: session.players.size,
      answeredPlayers,
    });

    io.to(player.socketId).emit('answer-confirmed');
  });

  socket.on('end-quiz', async ({ quizId }) => {
    const session = liveQuizSessions.get(quizId);
    if (!session) return;

    try {
      for (const { playerName, answerData } of session.answers) {
        const structuredAnswers = (Array.isArray(answerData) ? answerData : []).map(ans => {
          const question = session.quiz.questions.find(q => {
            const qId = q._id?.toString?.();
            const aId = ans.questionId?.toString?.();
            return qId && aId && qId === aId;
          });

          return {
            questionText: question?.questionText || 'Okänd fråga',
            answer: ans.answer || '',
            responseTime: ans.responseTime ?? null,
            subAnswers: Array.isArray(ans.subAnswers)
              ? ans.subAnswers.map(sub => ({
                  subQuestionText: sub.subQuestionText || '',
                  subAnswer: sub.subAnswer || '',
                  correct: sub.correct ?? false,
                }))
              : [],
          };
        });

        const newResponse = new QuizResponse({
          quiz: quizId,
          playerName,
          answers: structuredAnswers,
        });

        await newResponse.save();
      }

      clearTimers(quizId);
      io.to(quizId).emit('quiz-ended', { summary: session.answers });
      liveQuizSessions.delete(quizId);
    } catch (error) {
      console.error('Fel vid sparande av livequiz-svar:', error);
    }
  });

  socket.on('disconnect', () => {
    for (const [quizId, session] of liveQuizSessions.entries()) {
      let disconnectedPlayerId = null;

      for (const [playerId, player] of session.players.entries()) {
        if (player.socketId === socket.id) {
          disconnectedPlayerId = playerId;
          break;
        }
      }

      if (disconnectedPlayerId) {
        session.players.delete(disconnectedPlayerId);
        const players = Array.from(session.players.values()).map((p) => p.playerName);
        io.to(quizId).emit('lobby-update', { players });

        if (session.players.size === 0) {
          liveQuizSessions.delete(quizId);
        }
        break;
      }

      if (session.hostSocketId === socket.id) {
        session.hostSocketId = null;
        io.to(quizId).emit('host-disconnected');
      }
    }
  });
};
