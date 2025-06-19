import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import axios from "axios";
import styles from "./PlayerLobby.module.css";

const PlayerLobby = () => {
  const baseText = "Quizet startar snart";
  const navigate = useNavigate();
  const { quizId } = useParams();
  const socket = useSocket();

  useEffect(() => {
    const fetchUserNameAndJoin = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const { name, _id } = res.data;
        localStorage.setItem("playerName", name);
        localStorage.setItem("playerId", _id);

        socket.emit("join-quiz", {
          quizId,
          playerName: name,
          playerId: _id,
        });
      } catch (error) {
        console.error("Kunde inte hämta användarnamn:", error);
      }
    };

    if (socket && quizId) {
      fetchUserNameAndJoin();
    }
  }, [socket, quizId]);

  useEffect(() => {
    if (!socket) return;

    const handleStartQuiz = () => {
      navigate(`/livequiz/player/${quizId}`);
    };

    socket.on("quiz-started", handleStartQuiz);

    return () => {
      socket.off("quiz-started", handleStartQuiz);
    };
  }, [socket, quizId, navigate]);

  return (
    <div className={styles.lobbyContainer}>
      <h2 className={styles.pulseText}>{baseText}</h2>
      <button
        onClick={() => navigate("/dashboard")}
        className={styles.backButton}
      >
        Tillbaka
      </button>
    </div>
  );
};

export default PlayerLobby;
