import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
    <div className="delete-quiz-container">
      <h2>Radera Quiz</h2>
      {message && <p>{message}</p>}
      {quizzes.length === 0 ? (
        <p>Inga quiz tillgängliga.</p>
      ) : (
        <ul>
          {quizzes.map((quiz) => (
            <li key={quiz._id}>
              {quiz.title}
              <button onClick={() => handleDelete(quiz._id)}>Radera</button>
            </li>
          ))}
        </ul>
      )}
      <button onClick={() => navigate("/dashboard")}>Tillbaka</button>
    </div>
  );
};

export default DeleteQuiz;
