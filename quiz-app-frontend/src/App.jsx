import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./components/Login/Login";
import Register from "./components/Register/Register";
import Dashboard from "./components/Dashboard/Dashboard";
import CreateQuiz from "./components/CreateQuiz/CreateQuiz";
import EditQuiz from "./components/EditQuiz/EditQuiz";
import QuizPage from "./components/QuizPage/QuizPage";
import QuizSubmissions from "./components/QuizSubmissions/QuizSubmissions";
import LiveQuizSubmissions from "./components/LiveQuizSubmissions/LiveQuizSubmissions";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Background from "./components/Background/Background";
import LiveQuizHost from "./components/LiveQuizHost/LiveQuizHost";
import LiveQuizPlayer from "./components/LiveQuizPlayer/LiveQuizPlayer";
import HostLobby from "./components/HostLobby/HostLobby";
import PlayerLobby from "./components/PlayerLobby/PlayerLobby";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.clear();
    setToken("");
    window.location.href = "/";
  };

  return (
    <Router>
      <Background />
      <Routes>
        <Route path="/" element={<Login setToken={setToken} />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute token={token}>
              <Dashboard token={token} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-quiz"
          element={
            <ProtectedRoute token={token}>
              <CreateQuiz token={token} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-quiz/:quizId"
          element={
            <ProtectedRoute token={token}>
              <EditQuiz token={token} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes/:quizId/submissions"
          element={
            <ProtectedRoute token={token}>
              <QuizSubmissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/livequiz/:quizId/submissions"
          element={
            <ProtectedRoute token={token}>
              <LiveQuizSubmissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes/:quizId"
          element={
            <ProtectedRoute token={token}>
              <QuizPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes/:quizId/live/:sessionId"
          element={
            <ProtectedRoute token={token}>
              <QuizPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/livequiz/host/:quizId"
          element={
            <ProtectedRoute token={token}>
              <LiveQuizHost />
            </ProtectedRoute>
          }
        />
        <Route
          path="/livequiz/player/:quizId"
          element={
            <ProtectedRoute token={token}>
              <LiveQuizPlayer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/host-lobby/:quizId"
          element={
            <ProtectedRoute token={token}>
              <HostLobby />
            </ProtectedRoute>
          }
        />
        <Route
          path="/player-lobby/:quizId"
          element={
            <ProtectedRoute token={token}>
              <PlayerLobby />
            </ProtectedRoute>
          }
        />

        <Route path="/unauthorized" element={<p>Obehörig åtkomst</p>} />
      </Routes>
    </Router>
  );
}

export default App;