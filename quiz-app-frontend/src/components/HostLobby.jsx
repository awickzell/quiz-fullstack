// HostLobby.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';

const HostLobby = () => {
  const { quizId } = useParams();
  const socket = useSocket();
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/quizzes/${quizId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuiz(res.data.quiz);
      } catch (err) {
        console.error('Kunde inte hämta quiz:', err);
      }
    };

    if (quizId && token) {
      fetchQuiz();
    }
  }, [quizId, token]);

  useEffect(() => {
    if (!socket || !quiz) return;

    socket.emit('host-quiz', { quizId, quizData: quiz });

    socket.on('lobby-update', ({ players }) => {
      setPlayers(players);
    });

    return () => {
      socket.off('lobby-update');
    };
  }, [socket, quizId, quiz]);

  const startQuiz = () => {
    navigate(`/livequiz/host/${quizId}`);
  };

  return (
    <div className="lobby-container">
      <h2>Lobby - Värdvy</h2>
      <h3>Spelare som har gått med:</h3>
      <ul>
        {players.map((name, i) => <li key={i}>{name}</li>)}
      </ul>
      <button onClick={startQuiz} disabled={players.length === 0 || !quiz}>Starta Quiz</button>
      <button onClick={() => navigate("/dashboard")}>Tillbaka</button>
    </div>
  );
};

export default HostLobby;
