import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import React from "react";

const Register = () => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/users/register`, {
        name,
        password,
      });
      setMessage(res.data.message);
    } catch (err) {
      setMessage("Registrering misslyckades.");
    }
  };

  return (
    <div className="register-container">
      <h2>Registrera</h2>
      {message && <p className="message">{message}</p>}
      <form onSubmit={handleRegister}>
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
        <button type="submit">Registrera</button>
      </form>

      <button className="back-button" onClick={() => navigate("/")}>
        Tillbaka
      </button>
    </div>
  );
};

export default Register;
