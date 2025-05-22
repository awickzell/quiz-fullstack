import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function SearchBar({ quizzes }) {
  const [showInput, setShowInput] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchTerm.length >= 3) {
      const lowerTerm = searchTerm.toLowerCase();
      const filtered = quizzes.filter((quiz) => {
        const titleMatch = quiz.title.toLowerCase().includes(lowerTerm);
        const creatorMatch = quiz.createdBy?.name?.toLowerCase().includes(lowerTerm);
        return titleMatch || creatorMatch;
      });
      setResults(filtered);
    } else {
      setResults([]);
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

  return (
    <div className="search-bar" ref={searchRef}>
      <button onClick={() => setShowInput(true)}>Sök</button>

      {showInput && (
        <div>
          <input
            type="text"
            placeholder="Sök quiz"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            autoFocus
          />
          {results.length > 0 && (
            <ul className="search-results">
              {results.map((quiz) => (
                <li
                  key={quiz._id}
                  className="search-result-item"
                  onClick={() => navigate(`/quizzes/${quiz._id}`)}
                  style={{ cursor: "pointer", padding: "4px 0" }}
                >
                  <strong>{quiz.title}</strong> – {quiz.createdBy?.name || "Okänd"}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
