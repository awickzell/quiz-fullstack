// LiveQuizHost.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';

const LiveQuizHost = () => {
  const { quizId } = useParams();
  const socket = useSocket();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [quiz, setQuiz] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerCount, setAnswerCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [players, setPlayers] = useState([]);
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/quizzes/${quizId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuiz(res.data.quiz);
      } catch (err) {
        console.error('Kunde inte hämta quiz:', err);
      }
    };
    fetchQuiz();
  }, [quizId, token]);

  // 🟢 Emit start-quiz först när quiz är laddad och host vy är mountad
  useEffect(() => {
    if (socket && quiz) {
      socket.emit('start-quiz', { quizId });
    }
  }, [socket, quizId, quiz]);

  useEffect(() => {
    if (!socket) return;

    socket.emit('host-quiz', { quizId, quizData: quiz });

    socket.on('lobby-update', ({ players }) => {
      setPlayers(players);
      setTotalPlayers(players.length);
    });

    socket.on('answer-count-update', ({ count, totalPlayers }) => {
      setAnswerCount(count);
      setTotalPlayers(totalPlayers);
    });

    socket.on('quiz-started', () => {
      setQuizStarted(true);
      setCurrentIndex(1);
      setAnswerCount(0);
    });

    return () => {
      socket.off('lobby-update');
      socket.off('answer-count-update');
      socket.off('quiz-started');
    };
  }, [socket, quizId, quiz]);

  const sendNext = () => {
    if (!quiz || !socket) return;

    if (currentIndex < quiz.questions.length) {
      socket.emit('next-question', { quizId, questionIndex: currentIndex });
      setAnswerCount(0);
      setCurrentIndex((prev) => prev + 1);
    } else {
      socket.emit('end-quiz', { quizId });
      navigate('/dashboard');
    }
  };

  if (!quiz) return <p>Laddar quiz...</p>;

  return (
    <div className="host-container">
      <h1>Live Quiz: {quiz.title}</h1>
      <p>Spelare anslutna: {players.length}</p>

      {quizStarted ? (
        <>
          <p>
            Fråga {Math.min(currentIndex, quiz.questions.length)} / {quiz.questions.length}
          </p>
          <p>
            Antal svar: {answerCount} / {totalPlayers}
          </p>
          <button onClick={sendNext}>
            {currentIndex < quiz.questions.length ? 'Nästa fråga' : 'Avsluta quiz'}
          </button>
        </>
      ) : (
        <p>Väntar på att quiz ska startas...</p>
      )}
    </div>
  );
};

export default LiveQuizHost;
