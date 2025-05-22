import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function QuizSubmissions() {
  const { quizId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const storedToken = localStorage.getItem("token");

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/quizzes/${quizId}/submissions`,
          {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          }
        );

        const data = Array.isArray(response.data)
          ? response.data
          : response.data.submissions;

        setSubmissions(data);
      } catch (err) {
        console.error("Fel vid hämtning av submissions:", err);
        setError("Fel vid hämtning.");
      }
    };

    fetchSubmissions();
  }, [quizId, storedToken]);

  return (
    <div className="submissions-container">
      <h2 className="submissions-title">Inskickade Svar</h2>

      {error && <p className="error">{error}</p>}

      {submissions.length === 0 ? (
        <p className="no-submissions">Inga svar har skickats in ännu.</p>
      ) : (
        <div className="submission-list">
          {submissions.map((submission, index) => (
            <div key={index} className="submission-card">
              <h3 className="submission-player">
                Spelare: {submission.playerName}
              </h3>
              <ul className="submission-answers">
                {submission.answers.map((answer, i) => {
                  return (
                    <li key={i} className="submission-answer-item">
                      <strong>Fråga:</strong> {answer.questionText} <br />
                      <strong>Svar:</strong> {answer.answer}

                      {answer.subAnswers && answer.subAnswers.length > 0 && (
                        <ul className="sub-answers">
                          {answer.subAnswers.map((subAnswer, j) => (
                            <li key={j}>
                              <strong>Följdfråga:</strong> {subAnswer.questionText} <br />
                              <strong>Svar:</strong> {subAnswer.subAnswer}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => navigate("/dashboard")}>Tillbaka</button>
    </div>
  );
}

export default QuizSubmissions;
