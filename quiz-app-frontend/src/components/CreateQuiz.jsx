import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CreateQuiz = ({ token }) => {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([{ questionText: "", subQuestions: [] }]);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const addQuestion = () => {
    setQuestions([...questions, { questionText: "", subQuestions: [] }]);
  };

  const removeQuestion = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const handleQuestionChange = (index, event) => {
    const newQuestions = [...questions];
    newQuestions[index].questionText = event.target.value;
    setQuestions(newQuestions);
  };

  const addSubQuestion = (questionIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].subQuestions.push({ questionText: "" });
    setQuestions(newQuestions);
  };

  const removeSubQuestion = (questionIndex, subQuestionIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].subQuestions = newQuestions[questionIndex].subQuestions.filter((_, i) => i !== subQuestionIndex);
    setQuestions(newQuestions);
  };

  const handleSubQuestionChange = (questionIndex, subQuestionIndex, event) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].subQuestions[subQuestionIndex].questionText = event.target.value;
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const questionsArray = questions
      .map((q) => ({
        questionText: q.questionText.trim(),
        subQuestions: q.subQuestions
          .map((sq) => ({
            questionText: sq.questionText.trim(),
          }))
          .filter((sq) => sq.questionText.length > 0),
      }))
      .filter((q) => q.questionText.length > 0);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/quizzes`,
        {
          title,
          questions: questionsArray,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage("Quiz skapades!");
      navigate("/dashboard");
    } catch (err) {
      setMessage("Fel vid skapande av quiz.");
      console.error("Error:", err);
    }
  };

  return (
    <div className="create-quiz-container">
      <h2>Skapa Quiz</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Titel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <h3>Frågor:</h3>
        {questions.map((question, index) => (
          <div key={index} className="question-input">
            <input
              type="text"
              placeholder={`Fråga ${index + 1}`}
              value={question.questionText}
              onChange={(e) => handleQuestionChange(index, e)}
              className="question-field"
            />

            {question.subQuestions.map((subQuestion, subIndex) => (
              <div key={subIndex} className="sub-question-input">
                <input
                  type="text"
                  placeholder="Följdfråga"
                  value={subQuestion.questionText}
                  onChange={(e) => handleSubQuestionChange(index, subIndex, e)}
                  className="sub-question-field"
                />
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => removeSubQuestion(index, subIndex)}
                >
                  Ta bort följdfråga
                </button>
              </div>
            ))}

            <div className="question-buttons">
              <button
                type="button"
                className="secondary-button"
                onClick={() => removeQuestion(index)}
              >
                Ta bort fråga
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => addSubQuestion(index)}
              >
                Lägg till följdfråga
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={addQuestion}
              >
                Lägg till fråga
              </button>
            </div>
          </div>
        ))}

        <button type="submit" className="primary-button">
          Skapa Quiz
        </button>
      </form>

      <button className="tertiary-button" onClick={() => navigate("/dashboard")}>
        Tillbaka
      </button>

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default CreateQuiz;
