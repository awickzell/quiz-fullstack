import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import styles from './LiveQuizPlayer.module.css';

const LiveQuizPlayer = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();

  const [quiz, setQuiz] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [question, setQuestion] = useState(null);
  const [questionMeta, setQuestionMeta] = useState({ currentIndex: 0, total: 0 });
  const [answer, setAnswer] = useState('');
  const [subAnswers, setSubAnswers] = useState([]);
  const [waitingText, setWaitingText] = useState('Väntar på nästa fråga...');
  const [answerConfirmed, setAnswerConfirmed] = useState(false);

  const token = localStorage.getItem('token');

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

    if (quizId && token) {
      fetchQuiz();
    }
  }, [quizId, token]);

  useEffect(() => {
    const storedPlayerId = localStorage.getItem('playerId');
    const storedPlayerName = localStorage.getItem('playerName');

    if (storedPlayerId && storedPlayerName) {
      setPlayerId(storedPlayerId);
      setPlayerName(storedPlayerName);
    } else {
      alert('Ingen spelarinformation hittades. Gå tillbaka till lobby.');
      navigate('/dashboard');
    }
  }, [navigate]);

  useEffect(() => {
    if (!socket || !quizId || !playerId || !playerName) return;

    socket.emit('join-quiz', { quizId, playerId, playerName });

    const handleShowQuestion = (questionData) => {
      setQuestion(questionData);
      setAnswer('');
      setAnswerConfirmed(false);

      if (questionData.subQuestions && questionData.subQuestions.length > 0) {
        setSubAnswers(questionData.subQuestions.map(() => ''));
      } else {
        setSubAnswers([]);
      }

      setWaitingText('');
    };

    const handleQuestionMetadata = (meta) => {
      setQuestionMeta(meta);
    };

    const handleAnswerConfirmed = () => {
      setAnswerConfirmed(true);
    };

    const handleQuizEnded = () => {
      setWaitingText('Quizet har avslutats');
      setQuestion(null);

      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    };

    const handleError = (error) => {
      alert(`Fel: ${error.message}`);
    };

    socket.on('show-question', handleShowQuestion);
    socket.on('question-metadata', handleQuestionMetadata);
    socket.on('answer-confirmed', handleAnswerConfirmed);
    socket.on('quiz-ended', handleQuizEnded);
    socket.on('error', handleError);

    return () => {
      socket.off('show-question', handleShowQuestion);
      socket.off('question-metadata', handleQuestionMetadata);
      socket.off('answer-confirmed', handleAnswerConfirmed);
      socket.off('quiz-ended', handleQuizEnded);
      socket.off('error', handleError);
    };
  }, [socket, quizId, playerId, playerName, navigate]);

  const handleSubAnswerChange = (index, value) => {
    const updated = [...subAnswers];
    updated[index] = value;
    setSubAnswers(updated);
  };

  const submitAnswer = () => {
    if (
      (!answer || answer.trim() === '') &&
      !(question?.subQuestions?.length > 0 && subAnswers.every(a => a.trim() !== ''))
    ) {
      alert('Fyll i alla svar innan du skickar');
      return;
    }

    socket.emit('submit-answer', {
      quizId,
      playerId,
      answerData: {
        questionId: question._id,
        answer,
        subAnswers: question?.subQuestions?.map((subQ, i) => ({
          subQuestionText: subQ.questionText,
          subAnswer: subAnswers[i],
        })) || [],
      },
    });
  };

  if (!playerId || !playerName) return <div>Laddar spelarinformation...</div>;
  if (!quiz) return <div>Laddar quiz...</div>;

  return (
    <div className={styles.quizPageContainer}>
      <h1 className={styles.quizTitle}>{quiz.title}</h1>
      <p className={styles.quizInfo}>
        Fråga {questionMeta.currentIndex} av {questionMeta.total}
      </p>

      {question ? (
        <div className={styles.liveQuizContainer}>
          <h3 className={styles.questionTitle}>{question.questionText}</h3>

          {question.type === 'multipleChoice' && Array.isArray(question.options) ? (
            <ul className={styles.questionOptions}>
              {question.options.map((opt, idx) => (
                <li
                  key={idx}
                  className={`${styles.questionOption} ${answer === opt ? styles.selected : ''}`}
                  onClick={() => !answerConfirmed && setAnswer(opt)}
                >
                  {opt}
                </li>
              ))}
            </ul>
          ) : question.type === 'text' ? (
            <textarea
              className={styles.answerTextarea}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={answerConfirmed}
              placeholder="Ditt svar..."
            />
          ) : question.type === 'image' && question.imageUrl ? (
            <div className={styles.imageQuestionWrapper}>
              <img
                src={question.imageUrl}
                alt="Quizbild"
                className={styles.quizImage}
              />
              <textarea
                className={styles.answerTextarea}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={answerConfirmed}
                placeholder="Ditt svar..."
              />
            </div>
          ) : null}

          {question.subQuestions?.length > 0 && (
            <div>
              {question.subQuestions.map((subQ, idx) => (
                <div key={idx} className={styles.questionItem}>
                  <label className={styles.questionInput}>{subQ.questionText}</label>
                  <textarea
                    className={styles.answerTextarea}
                    value={subAnswers[idx]}
                    onChange={(e) => handleSubAnswerChange(idx, e.target.value)}
                    disabled={answerConfirmed}
                    placeholder="Ditt svar..."
                  />
                </div>
              ))}
            </div>
          )}

          {!answerConfirmed ? (
            <div className={styles.buttonGroup}>
              <button
                className={styles.primaryButton}
                onClick={submitAnswer}
                disabled={
                  question.subQuestions?.length > 0
                    ? subAnswers.some(a => a.trim() === '')
                    : answer.trim() === ''
                }
              >
                Skicka svar
              </button>
            </div>
          ) : (
            <p className={styles.message}>
              {questionMeta.currentIndex === questionMeta.total
                ? 'Bra spelat!'
                : 'Väntar på nästa fråga'}
            </p>
          )}
        </div>
      ) : (
        waitingText && (
          <div className={styles.warningBox}>
            {waitingText}
          </div>
        )
      )}
    </div>
  );
};

export default LiveQuizPlayer;
