import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';
import styles from './HostLobby.module.css';

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
    <div className={styles.lobbyContainer}>
      <h2 className={styles.heading}>Lobby</h2>
      <h3 className={styles.subheading}>Spelare som har gått med:</h3>
      <ul className={styles.playerList}>
        {players.map((name, i) => <li key={i} className={styles.playerItem}>{name}</li>)}
      </ul>
      <button 
        className={styles.startButton} 
        onClick={startQuiz} 
        disabled={players.length === 0 || !quiz}
      >
        Starta Quiz
      </button>
      <button className={styles.backButton} onClick={() => navigate("/dashboard")}>
        Tillbaka
      </button>
    </div>
  );
};

export default HostLobby;
