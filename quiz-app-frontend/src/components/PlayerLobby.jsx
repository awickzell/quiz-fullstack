import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import axios from "axios";

const PlayerLobby = () => {
  const [waitingText, setWaitingText] = useState("Quizet startar snart");
  const baseText = "Quizet startar snart";
  const dots = ["", ".", "..", "..."];
  const navigate = useNavigate();
  const { quizId } = useParams();
  const socket = useSocket();

  // 💬 Animerad text
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setWaitingText(`${baseText}${dots[index % dots.length]}`);
      index++;
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // 🔑 Hämta användarnamn & gå med i quiz
  useEffect(() => {
    const fetchUserNameAndJoin = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const { name, _id } = res.data;

        // ✅ Spara i localStorage så spelaren kan identifieras i quizet
        localStorage.setItem("playerName", name);
        localStorage.setItem("playerId", _id);

        // 🟢 Anslut till quizrummet
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

  // 🟢 Lyssna på start-signal från värden
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
    <div>
      <h2>{waitingText}</h2>
      <button onClick={() => navigate("/dashboard")}>Tillbaka</button>
    </div>
  );
};

export default PlayerLobby;
