import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const LiveQuizPlayer = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();

  const [playerId, setPlayerId] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [question, setQuestion] = useState(null);
  const [questionMeta, setQuestionMeta] = useState({ currentIndex: 0, total: 0 });
  const [answer, setAnswer] = useState('');
  const [subAnswers, setSubAnswers] = useState([]);
  const [waitingText, setWaitingText] = useState('Väntar på nästa fråga...');
  const [answerConfirmed, setAnswerConfirmed] = useState(false);

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

      // Om det är en fråga med subQuestions, initiera subAnswers-arrayen
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
      alert('Quizet har avslutats. Du kommer nu att återvända till Dashboard.');
      navigate('/dashboard');
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
      alert('Fyll i alla svar innan du skickar.');
      return;
    }

    socket.emit('submit-answer', {
      quizId,
      playerId,
      answerData: {
        answer,
        subAnswers: question?.subQuestions?.map((subQ, i) => ({
          subQuestionText: subQ.questionText,
          subAnswer: subAnswers[i],
        })) || [],
      },
    });
  };

  if (!playerId || !playerName) return <div>Laddar spelarinformation...</div>;

  return (
    <div className="livequiz-player">
      <h2>Quiz</h2>
      <p>
        Fråga {questionMeta.currentIndex} av {questionMeta.total}
      </p>

      {question ? (
        <div>
          <h3>{question.questionText}</h3>

          {question.type === 'multipleChoice' && Array.isArray(question.options) ? (
            <ul>
              {question.options.map((opt, idx) => (
                <li key={idx}>
                  <label>
                    <input
                      type="radio"
                      name="answer"
                      value={opt}
                      checked={answer === opt}
                      onChange={() => setAnswer(opt)}
                      disabled={answerConfirmed}
                    />
                    {opt}
                  </label>
                </li>
              ))}
            </ul>
          ) : question.type === 'text' ? (
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={answerConfirmed}
              rows={4}
              cols={50}
              placeholder="Skriv ditt svar här..."
            />
          ) : null}

          {question.subQuestions?.length > 0 && (
            <div>
              <h4>Följdfrågor</h4>
              {question.subQuestions.map((subQ, idx) => (
                <div key={idx}>
                  <label>{subQ.questionText}</label>
                  <textarea
                    value={subAnswers[idx]}
                    onChange={(e) => handleSubAnswerChange(idx, e.target.value)}
                    disabled={answerConfirmed}
                    rows={2}
                    cols={50}
                    placeholder="Skriv ditt svar här..."
                  />
                </div>
              ))}
            </div>
          )}

          {!answerConfirmed ? (
            <button onClick={submitAnswer} disabled={question.subQuestions?.length > 0 ? subAnswers.some(a => a.trim() === '') : answer.trim() === ''}>
              Skicka svar
            </button>
          ) : (
            <p>Tack för ditt svar!</p>
          )}
        </div>
      ) : (
        <p>{waitingText}</p>
      )}
    </div>
  );
};

export default LiveQuizPlayer;
