import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import styles from './QuizPage.module.css';

const QuizPage = () => {
  const { quizId, sessionId } = useParams();
  const isLive = !!sessionId;
  const socket = useSocket();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [quiz, setQuiz] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [subAnswers, setSubAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isLive) {
      if (socket) {
        socket.emit("joinSession", { sessionId });

        socket.on("newQuestion", (question) => {
          setQuiz({
            title: "Live Quiz",
            questions: [question],
          });
          setCurrentIndex(0);
          setCurrentAnswer('');
          setSubAnswers([]);
        });

        socket.on("sessionEnded", () => {
          setSubmitted(true);
        });

        return () => {
          socket.off("newQuestion");
          socket.off("sessionEnded");
        };
      }
    } else {
      const fetchQuiz = async () => {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/quizzes/${quizId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setQuiz(response.data.quiz);
        } catch (err) {
          console.error("Fel vid hämtning av quiz:", err);
        }
      };
      fetchQuiz();
    }
  }, [isLive, quizId, sessionId, socket, token]);

  useEffect(() => {
    if (!quiz) return;
    const prevAnswer = answers[currentIndex];
    setCurrentAnswer(prevAnswer?.answer || '');
    setSubAnswers(
      quiz.questions[currentIndex]?.subQuestions?.map((_, i) =>
        prevAnswer?.subAnswers?.[i]?.subAnswer || ''
      ) || []
    );
  }, [currentIndex, quiz]);

  const handleAnswerSubmit = () => {
    const currentQuestion = quiz.questions[currentIndex];
    const hasSub = currentQuestion.subQuestions?.length > 0;
    const hasAnyAnswer = currentAnswer.trim() || subAnswers.some(ans => ans.trim());

    if (!hasAnyAnswer) return;

    const answerPayload = {
      questionText: currentQuestion.questionText,
      answer: currentAnswer.trim(),
      subAnswers: hasSub
        ? currentQuestion.subQuestions.map((sq, i) => ({
            questionText: sq.questionText,
            subAnswer: subAnswers[i]?.trim() || ''
          }))
        : []
    };

    if (isLive && socket) {
      socket.emit("submitAnswer", { sessionId, answer: answerPayload });
      setCurrentAnswer('');
      setSubAnswers([]);
    } else {
      const updatedAnswers = [...answers];
      updatedAnswers[currentIndex] = answerPayload;
      setAnswers(updatedAnswers);
      setCurrentAnswer('');
      setSubAnswers([]);

      if (currentIndex + 1 < quiz.questions.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        submitAllAnswers(updatedAnswers);
      }
    }
  };

  const handleBack = () => {
    if (currentIndex === 0) {
      navigate('/dashboard');
    } else {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const submitAllAnswers = async (finalAnswers) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/quizzes/${quizId}/submit`,
        { answers: finalAnswers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubmitted(true);
    } catch (err) {
      console.error('Fel vid inskickning av svar:', err);
    }
  };

  if (!quiz) return <p>{isLive ? 'Väntar på att frågan ska skickas...' : 'Laddar quiz...'}</p>;

  if (submitted) {
    return (
      <div className={styles.quizSubmittedContainer}>
        <h2 className={styles.submittedTitle}>Tack för dina svar!</h2>
        <button className={styles.submittedButton} onClick={() => navigate('/dashboard')}>
          Tillbaka till startsidan
        </button>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIndex];
  const hasSubQuestions = currentQuestion.subQuestions?.length > 0;

  return (
    <div className={styles.quizPageContainer}>
      <h1 className={styles.quizTitle}>{quiz.title}{isLive ? ' (Live)' : ''}</h1>
      {!isLive && <h2 className={styles.quizSubtitle}>Fråga {currentIndex + 1} av {quiz.questions.length}</h2>}

      <div className={styles.questionBlock}>
        <h4 className={styles.questionText}>{currentQuestion.questionText}</h4>

        {currentQuestion.type === 'multipleChoice' ? (
          <div className={styles.options}>
           <ul className={styles.questionOptions}>
            {currentQuestion.options?.map((option, idx) => (
              <li
              key={idx}
              className={`${styles.questionOption} ${currentAnswer === option ? styles.selected : ''}`}
              onClick={() => setCurrentAnswer(option)}
              >
                {option}
                </li>
              ))}
              </ul>
          </div>
        ) : currentQuestion.type === 'image' && currentQuestion.imageUrl ? (
          <>
            <img src={currentQuestion.imageUrl} alt="Quiz-bild" width="300" />
            <textarea
              className={styles.answerTextarea}
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Ditt svar..."
            />
          </>
        ) : hasSubQuestions ? (
          [currentQuestion, ...currentQuestion.subQuestions].map((q, i) => (
            <div key={i} className={styles.questionItem}>
              <h4>{String.fromCharCode(65 + i)}. {q.questionText}</h4>
              <textarea
                className={styles.answerTextarea}
                value={i === 0 ? currentAnswer : subAnswers[i - 1] || ''}
                onChange={(e) => {
                  if (i === 0) {
                    setCurrentAnswer(e.target.value);
                  } else {
                    const updated = [...subAnswers];
                    updated[i - 1] = e.target.value;
                    setSubAnswers(updated);
                  }
                }}
                placeholder="Ditt svar..."
              />
            </div>
          ))
        ) : (
          <textarea
            className={styles.answerTextarea}
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Ditt svar..."
          />
        )}
      </div>

      <div className={styles.buttonGroup}>
        {!isLive && <button className={styles.navButton} onClick={handleBack}>Tillbaka</button>}
        <button className={styles.submitButton} onClick={handleAnswerSubmit}>Svara!</button>
      </div>
    </div>
  );
};

export default QuizPage;
