import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import QuizActions from "../QuizActions/QuizActions";
import SearchBar from "../SearchBar/SearchBar";
import styles from "./Dashboard.module.css";

function Dashboard({ token, onLogout }) {
  const [quizzes, setQuizzes] = useState([]);
  const [message, setMessage] = useState("");
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [expandedQuizId, setExpandedQuizId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserName(userRes.data.name);
        setUserId(userRes.data._id);

        const quizRes = await axios.get(`${import.meta.env.VITE_API_URL}/quizzes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuizzes(quizRes.data);
      } catch (error) {
        console.error("Fel vid hämtning:", error);
      }
    };

    fetchData();
  }, [token]);

  const handleDelete = (quizId) => {
    setQuizzes((prev) => prev.filter((quiz) => quiz._id !== quizId));
    setMessage("Quiz raderat");

    setTimeout(() => {
      setMessage("");
    }, 10000);
  };

  const toggleExpand = (quizId) => {
    setExpandedQuizId((prev) => (prev === quizId ? null : quizId));
  };

  return (
    <div className={styles.dashboardContainer}>
      <h2 className={styles.dashboardWelcome}>Välkommen {userName}</h2>

      <div className={styles.buttonRow}>
        <div className={styles.searchBarContainer}>
          <SearchBar quizzes={quizzes} userId={userId} token={token} />
        </div>

        <button
          className={styles.dashboardButton}
          onClick={() => navigate("/create-quiz")}
        >
          Skapa nytt quiz
        </button>

        <button className={styles.dashboardButton} onClick={onLogout}>
          Logga ut
        </button>
      </div>

      {message && <div className={styles.deleteMessage}>{message}</div>}

      {quizzes.length === 0 ? (
        <p className={styles.noQuizzesMessage}>Inga quiz tillgängliga.</p>
      ) : (
        <ul className={styles.quizList}>
          {quizzes.map((quiz) => {
            const isCreator = quiz.createdBy?._id === userId;
            const isExpanded = expandedQuizId === quiz._id;

            return (
            <li key={quiz._id}
            className={`${styles.quizItem} ${isExpanded ? styles.expanded : ""}`}
            onClick={() => toggleExpand(quiz._id)}
            >

                <strong className={styles.quizTitle}>{quiz.title}</strong>
                <p className={styles.quizCreator}>
                  {quiz.createdBy?.name
                    ? `Skapat av ${quiz.createdBy.name}`
                    : "Okänd skapare"}
                </p>

                {quiz.isLiveQuiz && (
                  <p className={styles.liveQuizIndicator}>LIVEQUIZ!</p>
                )}

                {isExpanded && (
                  <QuizActions
                    quiz={quiz}
                    isCreator={isCreator}
                    token={token}
                    onDelete={handleDelete}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Dashboard;
