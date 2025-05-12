import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Login = ({ setToken }) => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/users/login`, {
        name,
        password,
      });

      const { accessToken } = res.data;

      setToken(accessToken);
      localStorage.setItem("token", accessToken);

      navigate("/dashboard");
    } catch (err) {
      console.error("Fel vid inloggning:", err);
      setError("Fel användarnamn eller lösenord.");
    }
  };

  return (
    <div className="login-container">
      <h2>Quized</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Användarnamn"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="password"
          placeholder="Lösenord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Logga in</button>
      </form>
      <p>
        Har du inget konto? <Link to="/register">Skapa ett här</Link>
      </p>
    </div>
  );
};

export default Login;
