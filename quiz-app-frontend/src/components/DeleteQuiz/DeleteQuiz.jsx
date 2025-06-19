import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "./DeleteQuiz.module.css";

const DeleteQuiz = ({ token }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/quizzes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setQuizzes(res.data);
      } catch (err) {
        console.error("Kunde inte hämta quiz:", err);
      }
    };

    fetchQuizzes();
  }, [token]);

  const handleDelete = async (quizId) => {
    const confirmDelete = window.confirm("Är du säker på att du vill radera detta quiz?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/quizzes/${quizId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setQuizzes(quizzes.filter((quiz) => quiz._id !== quizId));
      setMessage("Quiz raderat.");
    } catch (err) {
      console.error("Fel vid radering:", err);
      setMessage("Kunde inte radera quiz.");
    }
  };

  return (
    <div className={styles.deleteQuizContainer}>
      <h2 className={styles.heading}>Radera Quiz</h2>
      {message && <p className={styles.message}>{message}</p>}
      {quizzes.length === 0 ? (
        <p className={styles.noQuizzes}>Inga quiz tillgängliga.</p>
      ) : (
        <ul className={styles.quizList}>
          {quizzes.map((quiz) => (
            <li key={quiz._id} className={styles.quizItem}>
              <span>{quiz.title}</span>
              <button
                className={styles.deleteButton}
                onClick={() => handleDelete(quiz._id)}
              >
                Radera
              </button>
            </li>
          ))}
        </ul>
      )}
      <button className={styles.backButton} onClick={() => navigate("/dashboard")}>
        Tillbaka
      </button>
    </div>
  );
};

export default DeleteQuiz;
