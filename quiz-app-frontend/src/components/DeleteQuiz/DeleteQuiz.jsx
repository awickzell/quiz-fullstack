import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "./DeleteQuiz.module.css";

const DeleteQuiz = ({ token }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [selectedQuizTitle, setSelectedQuizTitle] = useState("");
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

  const handleDeleteClick = (quizId, quizTitle) => {
    setSelectedQuizId(quizId);
    setSelectedQuizTitle(quizTitle);
    setShowModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/quizzes/${selectedQuizId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setQuizzes(quizzes.filter((quiz) => quiz._id !== selectedQuizId));
      setMessage("Quiz raderat.");
    } catch (err) {
      console.error("Fel vid radering:", err);
      setMessage("Kunde inte radera quiz.");
    } finally {
      setShowModal(false);
      setSelectedQuizId(null);
      setSelectedQuizTitle("");
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
                onClick={() => handleDeleteClick(quiz._id, quiz.title)}
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

      {showModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h3>Bekräfta radering</h3>
            <p>Vill du verkligen radera quizet <strong>"{selectedQuizTitle}"</strong>? Detta går inte att ångra.</p>
            <div className={styles.modalButtons}>
              <button className={styles.confirmButton} onClick={handleConfirmDelete}>Radera</button>
              <button className={styles.cancelButton} onClick={() => setShowModal(false)}>Avbryt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteQuiz;