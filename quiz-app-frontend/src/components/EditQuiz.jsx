import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

function EditQuiz({ token }) {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/quizzes/${quizId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setQuiz(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Fel vid hämtning av quiz:", error);
        setErrorMessage("Kunde inte hämta quizet.");
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, token]);

  const handleQuestionChange = (index, updatedQuestion) => {
    const updatedQuiz = { ...quiz };
    updatedQuiz.questions[index] = updatedQuestion;
    setQuiz(updatedQuiz);
  };

  const handleTitleChange = (e) => {
    setQuiz({ ...quiz, title: e.target.value });
  };

  const handleSave = async () => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/quizzes/${quizId}`,
        { ...quiz },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      navigate("/dashboard");
    } catch (error) {
      console.error("Fel vid uppdatering av quiz:", error);
      setErrorMessage("Kunde inte uppdatera quizet.");
    }
  };

  if (loading) {
    return <div>Laddar...</div>;
  }

  if (errorMessage) {
    return <div>{errorMessage}</div>;
  }

  if (!Array.isArray(quiz.questions)) {
    return <div>Inga frågor tillgängliga.</div>;
  }

  return (
    <div className="edit-quiz-container">
      <h2>Redigera Quiz</h2>
      <form>
        <div className="question-field">
          <label htmlFor="quiz-title" className="question-input">
            Titel:
          </label>
          <input
            type="text"
            id="quiz-title"
            className="question-input"
            value={quiz.title}
            onChange={handleTitleChange}
          />
        </div>

        {quiz.questions.map((question, index) => (
          <div key={index} className="question-field">
            <label htmlFor={`question-${index}`} className="question-input">
              Fråga {index + 1}:
            </label>
            <input
              type="text"
              id={`question-${index}`}
              className="question-input"
              value={question.questionText}
              onChange={(e) =>
                handleQuestionChange(index, {
                  ...question,
                  questionText: e.target.value,
                })
              }
            />
            <div>
              {question.answers &&
                Array.isArray(question.answers) &&
                question.answers.map((answer, answerIndex) => (
                  <div key={answerIndex} className="sub-question-input">
                    <input
                      type="text"
                      value={answer.text}
                      onChange={(e) =>
                        handleQuestionChange(index, {
                          ...question,
                          answers: question.answers.map((ans, idx) =>
                            idx === answerIndex
                              ? { ...ans, text: e.target.value }
                              : ans
                          ),
                        })
                      }
                      className="sub-question-input"
                    />
                  </div>
                ))}
            </div>
          </div>
        ))}
      </form>
      <div className="question-buttons">
        <button type="button" onClick={handleSave} className="primary-button">
          Spara ändringar
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="secondary-button"
        >
          Tillbaka
        </button>
      </div>
    </div>
  );
}

export default EditQuiz;
