import QuizResponse from '../models/quizResponse.js';

const liveQuizSessions = new Map();

export const setupLiveQuizHandlers = (io, socket) => {
  console.log(`📡 Socket ansluten: ${socket.id}`);

  socket.on('join-quiz', ({ quizId, playerId, playerName }) => {
    console.log(`➡️ join-quiz: quizId=${quizId}, playerId=${playerId}, playerName=${playerName}`);

    if (!quizId || !playerId || !playerName) {
      console.warn('⚠️ Ogiltiga uppgifter för join-quiz');
      return socket.emit('error', { message: 'Ogiltiga uppgifter för att gå med i quiz.' });
    }

    socket.join(quizId);

    if (!liveQuizSessions.has(quizId)) {
      console.log(`📘 Skapar ny session för quizId=${quizId}`);
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
    console.log(`👥 Nuvarande spelare i quiz ${quizId}:`, players);

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
    console.log(`👑 host-quiz: quizId=${quizId}, antal frågor=${quizData?.questions?.length ?? 0}`);
    socket.join(quizId);

    if (!liveQuizSessions.has(quizId)) {
      console.log(`📘 Skapar ny session som host för quiz ${quizId}`);
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

    socket.to(quizId).emit('host-joined');
  });

  socket.on('start-quiz', ({ quizId }) => {
    console.log(`▶️ start-quiz: quizId=${quizId}`);
    const session = liveQuizSessions.get(quizId);
    if (!session || !session.quiz) {
      console.warn(`⚠️ start-quiz: Ingen session eller quizdata för quizId=${quizId}`);
      return;
    }

    session.currentQuestionIndex = 0;
    session.currentQuestionAnswers = new Map();

    io.to(quizId).emit('quiz-started');

    const firstQuestion = session.quiz.questions[0];
    console.log(`📨 Skickar första frågan till spelare och host`);

    const emitQuestion = (socketId) => {
      io.to(socketId).emit('show-question', firstQuestion);
      io.to(socketId).emit('question-metadata', {
        currentIndex: 1,
        total: session.quiz.questions.length,
      });
    };

    for (const player of session.players.values()) {
      emitQuestion(player.socketId);
    }

    if (session.hostSocketId) {
      emitQuestion(session.hostSocketId);
    }
  });

  socket.on('player-ready', ({ quizId, playerId }) => {
    console.log(`✅ player-ready: playerId=${playerId}, quizId=${quizId}`);
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
  });

  socket.on('next-question', ({ quizId, questionIndex }) => {
    console.log(`⏭️ next-question: quizId=${quizId}, index=${questionIndex}`);
    const session = liveQuizSessions.get(quizId);
    if (!session || !session.quiz) return;

    const question = session.quiz.questions[questionIndex];
    if (!question) return;

    session.currentQuestionIndex = questionIndex;
    session.currentQuestionAnswers = new Map();

    const emitQuestion = (socketId) => {
      io.to(socketId).emit('show-question', question);
      io.to(socketId).emit('question-metadata', {
        currentIndex: questionIndex + 1,
        total: session.quiz.questions.length,
      });
    };

    for (const player of session.players.values()) {
      emitQuestion(player.socketId);
    }

    if (session.hostSocketId) {
      emitQuestion(session.hostSocketId);
    }
  });

  socket.on('submit-answer', ({ quizId, playerId, answerData }) => {
    console.log(`📝 submit-answer: quizId=${quizId}, playerId=${playerId}`);
    const session = liveQuizSessions.get(quizId);
    const player = session?.players.get(playerId);

    if (!session || !player) return;

    if (!session.currentQuestionAnswers.has(playerId)) {
      session.currentQuestionAnswers.set(playerId, answerData);

      const update = {
        count: session.currentQuestionAnswers.size,
        totalPlayers: session.players.size,
      };

      io.to(quizId).emit('answer-count-update', update);

      session.answers.push({
        playerName: player.playerName,
        answerData,
      });

      io.to(player.socketId).emit('answer-confirmed');
    }
  });

  socket.on('end-quiz', async ({ quizId }) => {
    const session = liveQuizSessions.get(quizId);
    if (!session) return;

    try {
      for (const { playerName, answerData } of session.answers) {
        let structuredAnswers = [];

        if (typeof answerData === 'string') {
          structuredAnswers = [{
            questionText: 'Okänd fråga',
            answer: answerData,
            subAnswers: [],
          }];
        } else if (Array.isArray(answerData)) {
          structuredAnswers = answerData;
        } else if (answerData && typeof answerData === 'object') {
          structuredAnswers = [answerData];
        } else {
          console.warn('⚠️ Ovänat format på answerData:', answerData);
        }

        const newResponse = new QuizResponse({
          quiz: quizId,
          playerName,
          answers: structuredAnswers,
        });
        await newResponse.save();
      }

      io.to(quizId).emit('quiz-ended', { summary: session.answers });
      liveQuizSessions.delete(quizId);
    } catch (error) {
      console.error('Fel vid sparande av livequiz-svar:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket frånkopplad: ${socket.id}`);
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
        console.log(`👤 Spelare frånkopplad: ${disconnectedPlayerId}, uppdaterar lobby för quizId=${quizId}`);

        io.to(quizId).emit('lobby-update', { players });

        if (session.players.size === 0) {
          console.log(`🧹 Inga spelare kvar, rensar session för quizId=${quizId}`);
          liveQuizSessions.delete(quizId);
        }
        break;
      }

      if (session.hostSocketId === socket.id) {
        console.log(`👑 Host frånkopplad för quizId=${quizId}`);
        session.hostSocketId = null;
        io.to(quizId).emit('host-disconnected');
      }
    }
  });
};