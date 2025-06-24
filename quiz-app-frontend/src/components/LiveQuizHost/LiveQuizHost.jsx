import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import QuestionBox from '../../components/QuestionBox/QuestionBox';
import styles from './LiveQuizHost.module.css';

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

  const handleQuestionClick = (index) => {
    if (!quiz || !socket) return;

    socket.emit('next-question', { quizId, questionIndex: index });
    setCurrentIndex(index + 1);
    setAnswerCount(0);
  };

  const endQuiz = () => {
    if (!quiz || !socket) return;
    socket.emit('end-quiz', { quizId });
    navigate('/dashboard');
  };

  if (!quiz) return <p>Laddar quiz...</p>;

  const currentQuestion = quiz.questions[currentIndex - 1];

  return (
    <div className={styles.liveQuizContainer}>
      <h1 className={styles.quizTitle}>{quiz.title}</h1>
      <p className={styles.playerCount}>Spelare anslutna: {players.length}</p>

      {quizStarted ? (
        <>
          <div className={styles.activeQuestionBox}>
            <p className={styles.questionStatus}>
              Fråga {Math.min(currentIndex, quiz.questions.length)} / {quiz.questions.length}
            </p>
            <p className={styles.answerStatus}>
              Antal svar: {answerCount} / {totalPlayers}
            </p>
            {currentQuestion && (
              <QuestionBox question={currentQuestion} index={currentIndex - 1} isHost={true} />
            )}
          </div>

          <div className={styles.questionSelector}>
            {quiz.questions.map((q, i) => (
              <div
                key={i}
                className={`${styles.questionButton} ${currentIndex - 1 === i ? styles.active : ''}`}
                onClick={() => handleQuestionClick(i)}
              >
                Fråga {i + 1}
              </div>
            ))}
          </div>

          <button className={styles.endQuizButton} onClick={endQuiz}>
            Avsluta quiz
          </button>
        </>
      ) : (
        <p className={styles.waitingMessage}>Väntar på att quiz ska startas...</p>
      )}
    </div>
  );
};

export default LiveQuizHost;
