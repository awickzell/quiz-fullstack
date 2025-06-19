import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import styles from "./EditQuiz.module.css";

function EditQuiz({ token }) {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/quizzes/${quizId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setQuiz(response.data.quiz);
        setLoading(false);
      } catch (error) {
        console.error("Fel vid hämtning av quiz:", error);
        setErrorMessage("Kunde inte hämta quizet.");
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, token]);
  
  const handleTitleChange = (e) => {
    setQuiz({ ...quiz, title: e.target.value });
  };

  const handleQuestionChange = (index, updatedQuestion) => {
    const updatedQuiz = { ...quiz };
    updatedQuiz.questions[index] = updatedQuestion;
    setQuiz(updatedQuiz);
  };

  const handleQuestionFieldChange = (index, field, value) => {
    const updatedQuestion = { ...quiz.questions[index], [field]: value };
    handleQuestionChange(index, updatedQuestion);
  };

  const handleSubQuestionChange = (qIndex, subIndex, value) => {
    const updatedQuestion = { ...quiz.questions[qIndex] };
    const updatedSubQuestions = [...updatedQuestion.subQuestions];
    updatedSubQuestions[subIndex] = {
      ...updatedSubQuestions[subIndex],
      questionText: value,
    };
    updatedQuestion.subQuestions = updatedSubQuestions;
    handleQuestionChange(qIndex, updatedQuestion);
  };

  const addSubQuestion = (index) => {
    const updatedQuestion = { ...quiz.questions[index] };
    updatedQuestion.subQuestions = [...(updatedQuestion.subQuestions || []), { questionText: "" }];
    handleQuestionChange(index, updatedQuestion);
  };

  const removeSubQuestion = (qIndex, subIndex) => {
    const updatedQuestion = { ...quiz.questions[qIndex] };
    updatedQuestion.subQuestions = updatedQuestion.subQuestions.filter((_, i) => i !== subIndex);
    handleQuestionChange(qIndex, updatedQuestion);
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updatedQuestion = { ...quiz.questions[qIndex] };
    const updatedOptions = [...(updatedQuestion.options || [])];
    updatedOptions[optIndex] = value;
    updatedQuestion.options = updatedOptions;
    handleQuestionChange(qIndex, updatedQuestion);
  };

  const addOption = (qIndex) => {
    const updatedQuestion = { ...quiz.questions[qIndex] };
    updatedQuestion.options = [...(updatedQuestion.options || []), ""];
    handleQuestionChange(qIndex, updatedQuestion);
  };

  const removeOption = (qIndex, optIndex) => {
    const updatedQuestion = { ...quiz.questions[qIndex] };
    updatedQuestion.options = updatedQuestion.options.filter((_, i) => i !== optIndex);
    handleQuestionChange(qIndex, updatedQuestion);
  };

  const handleImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const imageUrl = response.data.imageUrl;
      handleQuestionFieldChange(index, "imageUrl", imageUrl);
    } catch (error) {
      console.error("Fel vid bilduppladdning:", error);
      setErrorMessage("Kunde inte ladda upp bild.");
    }
  };

  const handleRemoveImage = (index) => {
    handleQuestionFieldChange(index, "imageUrl", "");
  };

  const addQuestion = () => {
    const newQuestion = {
      questionText: "",
      type: "text",
      subQuestions: [],
      options: [],
      imageUrl: "",
    };
    setQuiz((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  const removeQuestion = (index) => {
    const updatedQuestions = quiz.questions.filter((_, i) => i !== index);
    setQuiz({ ...quiz, questions: updatedQuestions });
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

  if (loading) return <div>Laddar...</div>;
  if (errorMessage) return <div>{errorMessage}</div>;
  if (!Array.isArray(quiz?.questions)) return <div>Inga frågor tillgängliga.</div>;

  return (
    <div className={styles.editQuizContainer}>
      <h2>Redigera Quiz</h2>
      <form>
        <div className={styles.questionField}>
          <label htmlFor="quiz-title">Titel:</label>
          <input
            type="text"
            id="quiz-title"
            value={quiz.title}
            onChange={handleTitleChange}
            className={styles.quizTitleInput}
          />
        </div>

        {quiz.questions.map((question, index) => (
          <div key={index} className={styles.editQuestionBlock}>
            <h4 className={styles.questionHeader}>Fråga {index + 1}</h4>

            <select
              value={question.type}
              onChange={(e) => handleQuestionFieldChange(index, "type", e.target.value)}
              className={styles.questionTypeSelect}
            >
              <option value="text">Textfråga</option>
              <option value="multipleChoice">Flervalsfråga</option>
              <option value="image">Bildfråga</option>
            </select>

            <input
              type="text"
              value={question.questionText}
              onChange={(e) => handleQuestionFieldChange(index, "questionText", e.target.value)}
              placeholder="Frågetext"
              className={styles.questionTextInput}
            />

            {question.type === "multipleChoice" && (
              <div className={styles.optionsSection}>
                <p>Svar:</p>
                {question.options?.map((opt, optIndex) => (
                  <div key={optIndex} className={styles.optionItem}>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(index, optIndex, e.target.value)}
                      className={styles.optionInput}
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index, optIndex)}
                      className={styles.removeOptionButton}
                    >
                      ❌
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => addOption(index)} className={styles.addOptionButton}>
                  ➕ Lägg till svarsalternativ
                </button>
              </div>
            )}

            {question.type === "image" && (
              <div className={styles.imageUploadSection}>
                <label>Bild:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, index)}
                  key={question.imageUrl || `image-upload-${index}`}
                  className={styles.imageUploadInput}
                />
                {question.imageUrl && (
                  <div className={styles.imagePreviewContainer}>
                    <img
                      src={`${import.meta.env.VITE_API_URL}/${question.imageUrl}`}
                      alt="Uppladdad"
                      className={styles.imagePreview}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className={styles.removeImageButton}
                    >
                      Ta bort bild
                    </button>
                  </div>
                )}
              </div>
            )}

            {question.subQuestions?.map((subQ, subIndex) => (
              <div key={subIndex} className={styles.subQuestionBlock}>
                <input
                  type="text"
                  value={subQ.questionText}
                  onChange={(e) => handleSubQuestionChange(index, subIndex, e.target.value)}
                  placeholder="Följdfråga"
                  className={styles.subQuestionInput}
                />
                <button
                  type="button"
                  onClick={() => removeSubQuestion(index, subIndex)}
                  className={styles.removeSubQuestionButton}
                >
                  Ta bort följdfråga
                </button>
              </div>
            ))}
            <button type="button" onClick={() => addSubQuestion(index)} className={styles.addSubQuestionButton}>
              Lägg till följdfråga
            </button>
            <button type="button" onClick={() => removeQuestion(index)} className={styles.removeQuestionButton}>
              Ta bort fråga
            </button>
          </div>
        ))}

        <button type="button" onClick={addQuestion} className={styles.addQuestionButton}>
          ➕ Lägg till ny fråga
        </button>
      </form>

      <div className={styles.questionButtons}>
        <button type="button" onClick={handleSave} className={styles.primaryButton}>
          Spara ändringar
        </button>
        <button type="button" onClick={() => navigate(-1)} className={styles.secondaryButton}>
          Tillbaka
        </button>
      </div>
    </div>
  );
}

export default EditQuiz;
