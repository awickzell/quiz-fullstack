import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ActionButton from "./ActionButton";

function Dashboard({ token }) {
  const [quizzes, setQuizzes] = useState([]);
  const [message, setMessage] = useState("");
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndQuizzes = async () => {
      try {
        // Hämta användarnamn från token
        const userRes = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserName(userRes.data.name);

        // Hämta quiz
        const quizRes = await axios.get(`${import.meta.env.VITE_API_URL}/quizzes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setQuizzes(quizRes.data);
      } catch (error) {
        console.error("Fel vid hämtning:", error);
      }
    };

    fetchUserAndQuizzes();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
    window.location.reload();
  };

  const handleDelete = async (quizId) => {
    const confirm = window.confirm("Är du säker på att du vill radera detta quiz?");
    if (!confirm) return;

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
    <div className="dashboard-container">
      <h2>Quized</h2>
      {message && <p className="message">{message}</p>}
      <ul>
        {quizzes.map((quiz) => {
          const isCreator = quiz.createdBy?.name === userName;

          return (
            <li key={quiz._id}>
              <div className="quiz-info">
                <strong>{quiz.title}</strong>
                {" | "}
                <span className="quiz-creator">
                  {quiz.createdBy?.name ? `av ${quiz.createdBy.name}` : "Skapare ej tillgänglig"}
                </span>
              </div>
              <div className="quiz-actions">
                <ActionButton
                  label="Spela"
                  onClick={() => navigate(`/quizzes/${quiz._id}`)}
                  styleClass="play-btn"
                />
                {isCreator && (
                  <>
                    <ActionButton
                      label="Redigera"
                      onClick={() => navigate(`/edit-quiz/${quiz._id}`)}
                      styleClass="edit-btn"
                    />
                    <ActionButton
                      label="Rätta Quiz"
                      onClick={() => navigate(`/quizzes/${quiz._id}/submissions`)}
                      styleClass="grade-btn"
                    />
                    <ActionButton
                      label="Radera"
                      onClick={() => handleDelete(quiz._id)}
                      styleClass="delete-btn"
                    />
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <ActionButton
        label="Skapa nytt quiz"
        onClick={() => navigate("/create-quiz")}
        styleClass="create-btn"
      />
      <ActionButton label="Logga ut" onClick={handleLogout} styleClass="logout-btn" />
    </div>
  );
}

export default Dashboard;
