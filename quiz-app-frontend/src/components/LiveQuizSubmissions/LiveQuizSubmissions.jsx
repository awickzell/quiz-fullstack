import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function LiveQuizSubmissions() {
  const { quizId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [error, setError] = useState("");
  const [expandedSubmissionIndex, setExpandedSubmissionIndex] = useState(null);
  const navigate = useNavigate();
  const storedToken = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const submissionRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/quizzes/${quizId}/submissions`,
          {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          }
        );
        const subs = Array.isArray(submissionRes.data)
          ? submissionRes.data
          : submissionRes.data.submissions;
        setSubmissions(subs);

        const quizRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/quizzes/${quizId}`,
          {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          }
        );
        setQuizQuestions(quizRes.data.quiz.questions);
      } catch (err) {
        console.error("Fel vid hämtning:", err);
        setError("Fel vid hämtning.");
      }
    };

    fetchData();
  }, [quizId, storedToken]);

  const getQuestionTextById = (id) => {
    const found = quizQuestions.find((q) => q._id === id);
    return found?.questionText || "Okänd fråga";
  };

  const toggleExpand = (index) => {
    setExpandedSubmissionIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className={styles.submissionsContainer}>
      <h2 className={styles.submissionsTitle}>Inskickade Svar</h2>

      {error && <p className={styles.error}>{error}</p>}

      {submissions.length === 0 ? (
        <p className={styles.noSubmissions}>Inga svar har skickats in ännu.</p>
      ) : (
        <div className={styles.submissionList}>
          {submissions.map((submission, index) => {
            const isExpanded = expandedSubmissionIndex === index;

            return (
              <div
                key={index}
                className={`${styles.submissionCard} ${isExpanded ? styles.expanded : ""}`}
                onClick={() => toggleExpand(index)}
                style={{ cursor: "pointer" }}
              >
                <h3 className={styles.submissionPlayer}>
                  Spelare: {submission.playerName}
                </h3>

                {isExpanded && (
                  <ul className={styles.submissionAnswers}>
                    {submission.answers.map((answer, i) => (
                      <li key={i} className={styles.submissionAnswerItem}>
                        <strong>Fråga:</strong>{" "}
                        {answer.questionText || getQuestionTextById(answer.questionId)} <br />
                        <strong>Svar:</strong> {answer.answer || "–"}{" "}
                        {answer.correct !== undefined && (
                          <span style={{ color: answer.correct ? "green" : "red" }}>
                            ({answer.correct ? "Rätt" : "Fel"})
                          </span>
                        )}

                        {Array.isArray(answer.subAnswers) &&
                          answer.subAnswers.length > 0 && (
                            <ul className={styles.subAnswers}>
                              {answer.subAnswers.map((sub, j) => (
                                <li key={j}>
                                  <strong>Fråga:</strong> {sub.subQuestionText || "Okänd följdfråga"}{" "}
                                  <br />
                                  <strong>Svar:</strong> {sub.subAnswer || "–"}{" "}
                                  {sub.correct !== undefined && (
                                    <span
                                      style={{ color: sub.correct ? "green" : "red" }}
                                    >
                                      ({sub.correct ? "Rätt" : "Fel"})
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button className={styles.backButton} onClick={() => navigate("/dashboard")}>
        Tillbaka
      </button>
    </div>
  );
}

export default LiveQuizSubmissions;
