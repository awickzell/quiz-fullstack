import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SearchBar from "./SearchBar";

function Dashboard({ token, onLogout }) {
  const [quizzes, setQuizzes] = useState([]);
  const [message, setMessage] = useState("");
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndQuizzes = async () => {
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

    fetchUserAndQuizzes();
  }, [token]);

  const handleDelete = async (quizId) => {
    const confirmDelete = window.confirm("Är du säker på att du vill radera detta quiz?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
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
      <h2 className="dashboard-welcome">Välkommen, {userName}</h2>
      <SearchBar quizzes={quizzes} />
      {message && <p className="dashboard-message">{message}</p>}
      <button className="btn-primary" onClick={() => navigate("/create-quiz")}>
        Skapa nytt quiz
      </button>
      <button className="btn-secondary" onClick={onLogout}>
        Logga ut
      </button>

      {quizzes.length === 0 ? (
        <p className="no-quizzes-message">Inga quiz tillgängliga.</p>
      ) : (
        <ul className="quiz-list">
          {quizzes.map((quiz) => {
            const isCreator = quiz.createdBy?._id === userId;
            const isLive = quiz.isLiveQuiz;

            return (
              <li key={quiz._id} className="quiz-item">
                <strong className="quiz-title">{quiz.title}</strong>
                <p className="quiz-creator">
                  {quiz.createdBy?.name
                    ? `Skapat av ${quiz.createdBy.name}`
                    : "Okänd skapare"}
                </p>

                {isLive && !isCreator && (
                  <p className="live-quiz-indicator">LIVEQUIZ!</p>
                )}

                <div className="quiz-actions">
                  {isLive ? (
                    isCreator ? (
                      <button
                        className="btn-lobby"
                        onClick={() => navigate(`/host-lobby/${quiz._id}`)}
                      >
                        Lobby
                      </button>
                    ) : (
                      <button
                        className="btn-play"
                        onClick={() => navigate(`/player-lobby/${quiz._id}`)}
                      >
                        Spela
                      </button>
                    )
                  ) : (
                    <button
                      className="btn-play"
                      onClick={() => navigate(`/quizzes/${quiz._id}`)}
                    >
                      Spela
                    </button>
                  )}

                  {isCreator && (
                    <>
                      <button
                        className="btn-edit"
                        onClick={() => navigate(`/edit-quiz/${quiz._id}`)}
                      >
                        Redigera
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(quiz._id)}
                      >
                        Radera
                      </button>
                      <button
                        className="btn-correct"
                        onClick={() => navigate(`/quizzes/${quiz._id}/submissions`)}
                      >
                        Rätta
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Dashboard;
