import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SearchBar from "./SearchBar";

function Dashboard({ token, onLogout }) {
  const [quizzes, setQuizzes] = useState([]);
  const [message, setMessage] = useState("");
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");  // Lägg till användarens ID
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndQuizzes = async () => {
      try {
        const userRes = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserName(userRes.data.name);
        setUserId(userRes.data._id);

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
      <h2>Välkommen, {userName}</h2>
      <SearchBar quizzes={quizzes} />
      {message && <p className="message">{message}</p>}
      <button onClick={() => navigate("/create-quiz")}>Skapa nytt quiz</button>
      <button onClick={onLogout}>Logga ut</button>

      {quizzes.length === 0 ? (
        <p>Inga quiz tillgängliga.</p>
      ) : (
        <ul className="quiz-list">
          {quizzes.map((quiz) => {
            const isCreator = quiz.createdBy?._id === userId;  // Jämför mot användarens ID

            return (
              <li key={quiz._id} className="quiz-item">
                <strong>{quiz.title}</strong>

                <p>{quiz.createdBy?.name ? `skapat av ${quiz.createdBy.name}` : "Okänd skapare"}</p>

                <div className="quiz-actions">
                  <button onClick={() => navigate(`/quizzes/${quiz._id}`)}>
                    Spela
                  </button>

                  {isCreator && (
                    <>
                      <button onClick={() => navigate(`/edit-quiz/${quiz._id}`)}>
                        Redigera
                      </button>
                      <button onClick={() => handleDelete(quiz._id)}>
                        Radera
                      </button>
                      <button onClick={() => navigate(`/quizzes/${quiz._id}/submissions`)}>
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
