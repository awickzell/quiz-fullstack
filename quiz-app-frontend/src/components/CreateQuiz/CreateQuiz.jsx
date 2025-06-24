import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from './CreateQuiz.module.css';

const CreateQuiz = ({ token }) => {
  const [title, setTitle] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [questions, setQuestions] = useState([
    {
      questionText: "",
      type: "text",
      subQuestions: [],
      options: [""],
      image: null,
      imageUrl: "",
    },
  ]);
  const [message, setMessage] = useState("");
  const [expandedQuestionIndex, setExpandedQuestionIndex] = useState(0);
  const navigate = useNavigate();

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: "",
        type: "text",
        subQuestions: [],
        options: [""],
        image: null,
        imageUrl: "",
      },
    ]);
    setExpandedQuestionIndex(questions.length);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
    if (expandedQuestionIndex >= index && expandedQuestionIndex > 0) {
      setExpandedQuestionIndex(expandedQuestionIndex - 1);
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const addSubQuestion = (questionIndex) => {
    const updated = [...questions];
    updated[questionIndex].subQuestions.push({ questionText: "" });
    setQuestions(updated);
  };

  const removeSubQuestion = (questionIndex, subIndex) => {
    const updated = [...questions];
    updated[questionIndex].subQuestions.splice(subIndex, 1);
    setQuestions(updated);
  };

  const handleSubQuestionChange = (questionIndex, subIndex, value) => {
    const updated = [...questions];
    updated[questionIndex].subQuestions[subIndex].questionText = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  const addOption = (qIndex) => {
    const updated = [...questions];
    updated[qIndex].options.push("");
    setQuestions(updated);
  };

  const removeOption = (qIndex, optIndex) => {
    const updated = [...questions];
    updated[qIndex].options.splice(optIndex, 1);
    setQuestions(updated);
  };

  const handleImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/quizzes/upload-image`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });


      const updated = [...questions];
      updated[index].imageUrl = res.data.imageUrl;
      setQuestions(updated);
    } catch (err) {
      console.error("Fel vid bilduppladdning:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const questionsArray = questions.map((q) => ({
      questionText: q.questionText.trim(),
      type: q.type,
      subQuestions: q.subQuestions
        .map((sq) => ({
          questionText: sq.questionText.trim(),
        }))
        .filter((sq) => sq.questionText.length > 0),
      options: q.type === "multipleChoice" ? q.options.filter((opt) => opt.trim().length > 0) : [],
      imageUrl: q.type === "image" ? q.imageUrl : "",
    }));

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/quizzes`,
        { title, questions: questionsArray, isLiveQuiz: isLive },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("Quiz skapades!");
      navigate("/dashboard");
    } catch (err) {
      setMessage("Fel vid skapande av quiz.");
      console.error("Error:", err);
    }
  };

  return (
    <div className={styles.createQuizContainer}>
      <h2 className={styles.quizTitle}>Skapa Quiz</h2>
      <form onSubmit={handleSubmit} className={styles.quizForm}>
        <input
          type="text"
          placeholder="Titel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className={styles.inputTitle}
        />

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={isLive}
            onChange={(e) => setIsLive(e.target.checked)}
          />
          <span className={styles.customCheckbox}></span>
          <div>LIVEQUIZ</div>
        </label>

        <h3>Frågor:</h3>
        {questions.map((q, index) => (
          <div key={index} className={styles.questionBlock}>
            <div
              className={styles.questionHeader}
              onClick={() => setExpandedQuestionIndex(index)}
              style={{ cursor: "pointer", fontWeight: "bold", marginBottom: "0.5rem" }}
            >
              Fråga {index + 1} {expandedQuestionIndex === index ? "▼" : "▶"}
            </div>

            {expandedQuestionIndex === index && (
              <div className={styles.questionContent}>
                <select
                  value={q.type}
                  onChange={(e) => handleQuestionChange(index, "type", e.target.value)}
                  className={styles.questionTypeSelect}
                >
                  <option value="text">Textfråga</option>
                  <option value="multipleChoice">Flervalsfråga</option>
                  <option value="image">Bildfråga</option>
                </select>

                <input
                  type="text"
                  placeholder={`Fråga ${index + 1}`}
                  value={q.questionText}
                  onChange={(e) => handleQuestionChange(index, "questionText", e.target.value)}
                  required
                  className={styles.questionTextInput}
                />

                {q.type === "multipleChoice" && (
                  <div className={styles.optionsSection}>
                    <h4>Svarsalternativ:</h4>
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className={styles.optionItem}>
                        <input
                          type="text"
                          placeholder={`Svar ${optIndex + 1}`}
                          value={opt}
                          onChange={(e) => handleOptionChange(index, optIndex, e.target.value)}
                          required
                        />
                        <button type="button" onClick={() => removeOption(index, optIndex)}>❌</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addOption(index)}>➕ Lägg till svar</button>
                  </div>
                )}

                {q.type === "image" && (
                  <div className={styles.imageUploadSection}>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, index)} />
                    {q.imageUrl && (
                      <img
                        src={`${import.meta.env.VITE_API_URL}/${q.imageUrl}`}
                        alt="Uppladdad"
                        className={styles.uploadedImage}
                      />
                    )}
                  </div>
                )}

                {q.subQuestions.map((sq, subIndex) => (
                  <div key={subIndex} className={styles.subQuestionBlock}>
                    <input
                      type="text"
                      placeholder="Följdfråga"
                      value={sq.questionText}
                      onChange={(e) => handleSubQuestionChange(index, subIndex, e.target.value)}
                      required
                    />
                    <button type="button" onClick={() => removeSubQuestion(index, subIndex)}>Ta bort följdfråga</button>
                  </div>
                ))}

                <div className={styles.questionControls}>
                  <button type="button" onClick={() => removeQuestion(index)}>Ta bort fråga</button>
                  <button type="button" onClick={() => addSubQuestion(index)}>Lägg till följdfråga</button>
                </div>
              </div>
            )}
          </div>
        ))}

        <button type="button" onClick={addQuestion}>➕ Lägg till fråga</button>
        <button type="submit" className={styles.submitButton}>Skapa Quiz</button>
      </form>

      <button className={styles.backButton} onClick={() => navigate("/dashboard")}>Tillbaka</button>
      {message && <p className={styles.feedbackMessage}>{message}</p>}
    </div>
  );
};

export default CreateQuiz;
