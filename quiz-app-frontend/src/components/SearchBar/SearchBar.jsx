import React, { useState, useEffect, useRef } from "react";
import QuizActions from "../QuizActions/QuizActions";
import ActionButton from "../ActionButton/ActionButton";
import styles from "./SearchBar.module.css";

function SearchBar({ quizzes, userId, token }) {
  const [showInput, setShowInput] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [expandedQuizId, setExpandedQuizId] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (searchTerm.length >= 3) {
      const lowerTerm = searchTerm.toLowerCase();
      const filtered = quizzes.filter((quiz) => {
        const titleMatch = quiz.title.toLowerCase().includes(lowerTerm);
        const creatorMatch = quiz.createdBy?.name?.toLowerCase().includes(lowerTerm);
        return titleMatch || creatorMatch;
      });
      setResults(filtered);
      setExpandedQuizId(null);
    } else {
      setResults([]);
      setExpandedQuizId(null);
    }
  }, [searchTerm, quizzes]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowInput(false);
        setSearchTerm("");
        setResults([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleExpand = (quizId) => {
    setExpandedQuizId((prev) => (prev === quizId ? null : quizId));
  };

  const handleDelete = (id) => {
    setResults((prev) => prev.filter((q) => q._id !== id));
  };

  return (
    <div className={styles.searchBarContainer} ref={searchRef}>
      <ActionButton
        label="Sök"
        onClick={() => setShowInput((prev) => !prev)}
        styleClass="dashboard-button"
      />

      {showInput && (
        <div className={styles.searchInputArea}>
          <input
            type="text"
            placeholder="Sök quiz..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
            autoFocus
          />
          {searchTerm.length >= 3 && (
            <ul className={styles.searchResults}>
              {results.length > 0 ? (
                results.map((quiz) => {
                  const isCreator = quiz.createdBy?._id === userId;
                  const isExpanded = expandedQuizId === quiz._id;
                  return (
                    <li
                      key={quiz._id}
                      className={styles.searchResultItem}
                      onClick={() => toggleExpand(quiz._id)}
                    >
                      <strong>{quiz.title}</strong>
                      {quiz.isLiveQuiz && (
                        <span className={styles.liveQuizIndicator}> LIVEQUIZ! </span>
                      )}
                      {isExpanded && (
                        <div className={styles.expandedActions}>
                          <QuizActions
                            quiz={quiz}
                            isCreator={isCreator}
                            token={token}
                            onDelete={handleDelete}
                          />
                        </div>
                      )}
                    </li>
                  );
                })
              ) : (
                <li className={styles.noResultsMessage}>
                  Inga quiz matchar din sökning.
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
