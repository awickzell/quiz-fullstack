import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from './LiveQuizSubmissions.module.css';

function LiveQuizSubmissions() {

  const { quizId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [error, setError] = useState("");
  const [manualCorrections, setManualCorrections] = useState({});
  const navigate = useNavigate();
  const storedToken = localStorage.getItem("token");

  useEffect(() => {

    const fetchData = async () => {
      try {
        // ✅ Uppdaterad live-endpoint
        const submissionRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/quizzes/live/${quizId}/submissions`,
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

        // 🟩 Denna endpoint förblir oförändrad (hämtar quiz-data)
        const quizRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/quizzes/${quizId}`,
          {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          }
        );
        const questions = quizRes.data?.quiz?.questions ?? [];
        setQuizQuestions(questions);

        const initialCorrections = {};
        subs.forEach((submission, sIndex) => {
          initialCorrections[sIndex] = {};
          submission.answers?.forEach((_, aIndex) => {
            initialCorrections[sIndex][aIndex] = {
              isCorrect: null,
              subAnswers: {},
            };
          });
        });
        setManualCorrections(initialCorrections);
      } catch (err) {
        console.error("Fel vid hämtning:", err);
        setError("Fel vid hämtning.");
      }
    };

    fetchData();
  }, [quizId, storedToken])

  const handleMark = (submissionIndex, answerIndex, value, isSub = false, subIndex = null) => {
    setManualCorrections((prev) => {
      const updated = { ...prev };
      if (!updated[submissionIndex]) updated[submissionIndex] = {};

      if (isSub) {
        if (!updated[submissionIndex][answerIndex]) {
          updated[submissionIndex][answerIndex] = { subAnswers: {} };
        }
        updated[submissionIndex][answerIndex].subAnswers[subIndex] = value;
      } else {
        updated[submissionIndex][answerIndex] = {
          ...updated[submissionIndex][answerIndex],
          isCorrect: value,
        };
      }
      return updated;
    });
  };

  const countCorrectAnswers = (submissionIndex) => {
    const correction = manualCorrections[submissionIndex];
    if (!correction) return 0;

    let count = 0;
    for (const answer of Object.values(correction)) {
      if (answer?.isCorrect === true) count++;
      if (answer?.subAnswers) {
        for (const val of Object.values(answer.subAnswers)) {
          if (val === true) count++;
        }
      }
    }
    return count;
  };

  const getQuestionTextById = (id) => {
    const found = quizQuestions.find((q) => q._id === id);
    return found?.questionText || "Okänd fråga";
  };

  return (
    <div className={styles.submissionsContainer}>
      <h2 className={styles.submissionsTitle}>Inskickade Svar</h2>

      {error && <p className={styles.error}>{error}</p>}

      {submissions.length === 0 ? (
        <p className={styles.noSubmissions}>Inga svar har skickats in ännu.</p>
      ) : (
        <div className={styles.submissionList}>
          {submissions.map((submission, sIndex) => (
            <div key={sIndex} className={styles.submissionCard}>
              <h3 className={styles.submissionPlayer}>
                Spelare: {submission.playerName || "Okänd"}
              </h3>

              <ul className={styles.submissionAnswers}>
                {Array.isArray(submission.answers) &&
                  submission.answers.map((answer, aIndex) => {
                    const currentCorrection = manualCorrections[sIndex]?.[aIndex];
                    const questionText = answer?.questionText || getQuestionTextById(answer?.questionId);

                    return (
                      <li key={aIndex} className={styles.submissionAnswerItem}>
                        {typeof answer?.answerTime === "number" && (
                          <span
                          className={styles.answerTime}
                          data-time={(answer.answerTime / 1000).toFixed(1) + " sec"}
                          >
                            🕒
                            </span>
                          )}

                        <strong>Fråga:</strong> {questionText} <br />
                        <strong>Svar:</strong> {answer?.answer || "–"}{" "}
                        <div className={styles.mainAnswerButtons}>
                          <button
                            className={`${styles.correctBtn} ${currentCorrection?.isCorrect === true ? styles.correctBtnActive : ""}`}
                            onClick={() => handleMark(sIndex, aIndex, true)}
                          >
                            ✔️
                          </button>
                          <button
                            className={`${styles.incorrectBtn} ${currentCorrection?.isCorrect === false ? styles.incorrectBtnActive : ""}`}
                            onClick={() => handleMark(sIndex, aIndex, false)}
                          >
                            ❌
                          </button>
                        </div>

                        {Array.isArray(answer?.subAnswers) &&
                          answer.subAnswers.length > 0 && (
                            <ul className={styles.subAnswers}>
                              {answer.subAnswers.map((sub, subIndex) => {
                                const subMark = currentCorrection?.subAnswers?.[subIndex];
                                return (
                                  <li key={subIndex} className={styles.subAnswerItem}>
                                    <strong>Fråga:</strong> {sub?.subQuestionText || "Okänd följdfråga"} <br />
                                    <strong>Svar:</strong> {sub?.subAnswer || "–"}

                                    <div className={styles.buttonGroup}>
                                      <button
                                        className={`${styles.correctBtn} ${subMark === true ? styles.correctBtnActive : ""}`}
                                        onClick={() =>
                                          handleMark(sIndex, aIndex, true, true, subIndex)
                                        }
                                      >
                                        ✔️
                                      </button>
                                      <button
                                        className={`${styles.incorrectBtn} ${subMark === false ? styles.incorrectBtnActive : ""}`}
                                        onClick={() =>
                                          handleMark(sIndex, aIndex, false, true, subIndex)
                                        }
                                      >
                                        ❌
                                      </button>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                      </li>
                    );
                  })}
              </ul>

              <p className={styles.summary}>
                Antal rätta svar: {countCorrectAnswers(sIndex)}
              </p>
            </div>
          ))}
        </div>
      )}

      <button className={styles.backButton} onClick={() => navigate("/dashboard")}>
        Tillbaka
      </button>
    </div>
  );
}

export default LiveQuizSubmissions;
