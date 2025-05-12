import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import CreateQuiz from "./components/CreateQuiz";
import EditQuiz from "./components/EditQuiz";
import QuizPage from "./components/QuizPage";
import QuizSubmissions from "./components/QuizSubmissions";
import ProtectedRoute from "./components/ProtectedRoute";
import Background from "./components/Background";
import { useState, useEffect } from "react";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [role, setRole] = useState(localStorage.getItem("role") || "");

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }

    if (role) {
      localStorage.setItem("role", role);
    } else {
      localStorage.removeItem("role");
    }
  }, [token, role]);

  const handleLogout = () => {
    localStorage.clear();
    setToken("");
    setRole("");
    window.location.href = "/";
  };

  return (
    <Router>
      <Background />
      <Routes>
        <Route path="/" element={<Login setToken={setToken} setRole={setRole} />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute token={token}>
              {role === "quizMaster" ? (
                <Dashboard token={token} onLogout={handleLogout} />
              ) : role === "player" ? (
                <PlayerDashboard onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )}
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-quiz"
          element={
            <ProtectedRoute token={token} requiredRole="quizMaster">
              <CreateQuiz token={token} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-quiz/:quizId"
          element={
            <ProtectedRoute token={token} requiredRole="quizMaster">
              <EditQuiz token={token} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes/:quizId/submissions"
          element={
            <ProtectedRoute token={token} requiredRole="quizMaster">
              <QuizSubmissions />
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

        <Route path="/unauthorized" element={<p>Obehörig åtkomst</p>} />
      </Routes>
    </Router>
  );
}

export default App;
