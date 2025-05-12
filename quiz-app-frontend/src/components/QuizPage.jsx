import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const QuizPage = () => {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [subAnswers, setSubAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Hämta quizdata när komponenten laddas
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/quizzes/${quizId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        // Uppdatera quizdata med rätt objekt (response.data.quiz)
        setQuiz(response.data.quiz);
      } catch (err) {
        console.error("Fel vid hämtning av quiz:", err);
      }
    };

    fetchQuiz();
  }, [quizId, token]);

  // Hantera svar när index ändras
  useEffect(() => {
    if (!quiz) return;

    const prevAnswer = answers[currentIndex];
    setCurrentAnswer(prevAnswer?.answer || '');
    setSubAnswers(
      quiz.questions[currentIndex]?.subQuestions?.map((_, i) =>
        prevAnswer?.subAnswers?.[i]?.answer || ''
      ) || []
    );
  }, [currentIndex, quiz]);

  // Hantera inskick av svar
  const handleAnswerSubmit = () => {
    const currentQuestion = quiz.questions[currentIndex];
    const hasSub = currentQuestion.subQuestions?.length > 0;

    const hasAnyAnswer = currentAnswer.trim() || subAnswers.some(ans => ans.trim());

    if (!hasAnyAnswer) return;

    const updatedAnswers = [...answers];
    updatedAnswers[currentIndex] = {
      question: currentQuestion.questionText,
      answer: currentAnswer.trim(),
      subAnswers: hasSub
        ? currentQuestion.subQuestions.map((sq, i) => ({
            question: sq.questionText,
            answer: subAnswers[i]?.trim() || ''
          }))
        : []
    };

    setAnswers(updatedAnswers);
    setCurrentAnswer('');
    setSubAnswers([]);

    if (currentIndex + 1 < quiz.questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      submitAllAnswers(updatedAnswers);
    }
  };

  // Hantera navigering till föregående fråga eller dashboard
  const handleBack = () => {
    if (currentIndex === 0) {
      navigate('/dashboard');
    } else {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Skicka in alla svar till backend
  const submitAllAnswers = async (finalAnswers) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/quizzes/${quizId}/submit`,
        { answers: finalAnswers },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSubmitted(true);
    } catch (err) {
      console.error('Fel vid inskickning av svar:', err);
    }
  };

  // Om quizet inte har laddats än
  if (!quiz) return <p>Laddar quiz...</p>;

  // Om användaren har skickat in sina svar
  if (submitted) {
    return (
      <div className="quiz-submitted-container">
        <h2 className="submitted-title">Tack för dina svar!</h2>
        <button className="submitted-button" onClick={() => navigate('/dashboard')}>
          Tillbaka till startsidan
        </button>
      </div>
    );
  }

  // Hämta aktuell fråga och subfrågor
  const currentQuestion = quiz.questions[currentIndex];
  const hasSubQuestions = currentQuestion.subQuestions?.length > 0;

  return (
    <div className="quiz-page-container">
      <h1 className="quiz-title">{quiz.title}</h1>
      <h2>Fråga {currentIndex + 1} av {quiz.questions.length}</h2>

      {hasSubQuestions ? (
        <div className="question-block">
          {[currentQuestion, ...currentQuestion.subQuestions].map((q, i) => (
            <div key={i} className="question-item">
              <h4>{String.fromCharCode(65 + i)}. {q.questionText}</h4>
              <textarea
                className="answer-textarea"
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
          ))}
        </div>
      ) : (
        <div className="question-block">
          <h4>{currentQuestion.questionText}</h4>
          <textarea
            className="answer-textarea"
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Ditt svar..."
          />
        </div>
      )}

      <div className="button-group">
        <button onClick={handleAnswerSubmit}>Svara!</button>
        <button onClick={handleBack}>Tillbaka</button>
      </div>
    </div>
  );
};

export default QuizPage;
