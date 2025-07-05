import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function QuizActions({ quiz, isCreator, token, onDelete }) {
  const navigate = useNavigate();
  const isLive = quiz.isLiveQuiz;

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Är du säker på att du vill radera detta quiz?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/quizzes/${quiz._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onDelete(quiz._id);
    } catch (err) {
      console.error("Fel vid radering:", err);
      alert("Kunde inte radera quiz.");
    }
  };

  return (
    <div className="quiz-actions">
      {isLive ? (
        isCreator ? (
          <>
            <button
              onClick={() => navigate(`/host-lobby/${quiz._id}`)}
              className="btn-lobby"
            >
              Lobby
            </button>
            <button
              onClick={() => navigate(`/edit-quiz/${quiz._id}`)}
              className="btn-edit"
            >
              Redigera
            </button>
            <button
              onClick={() => navigate(`/livequiz/${quiz._id}/submissions`)}
              className="btn-correct"
            >
              Rätta
            </button>
            <button onClick={handleDelete} className="btn-delete">
              Radera
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate(`/player-lobby/${quiz._id}`)}
            className="btn-play"
          >
            Spela!
          </button>
        )
      ) : (
        <>
          <button
            onClick={() => navigate(`/quizzes/${quiz._id}`)}
            className="btn-play"
          >
            Spela!
          </button>
          {isCreator && (
            <>
              <button
                onClick={() => navigate(`/edit-quiz/${quiz._id}`)}
                className="btn-edit"
              >
                Redigera
              </button>
              <button
                onClick={() => navigate(`/quizzes/${quiz._id}/submissions`)}
                className="btn-correct"
              >
                Rätta
              </button>
              <button onClick={handleDelete} className="btn-delete">
                Radera
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default QuizActions;
