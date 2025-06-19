import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "./Register.module.css";

const Register = () => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/users/register`, {
        name,
        password,
      });
      setMessage(res.data.message);
      setIsLoading(true);

      setTimeout(() => {
        navigate("/dashboard");
      }, 2500);
    } catch (err) {
      setMessage("Registrering misslyckades.");
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.registerContainer}>
      <h2>Registrera</h2>

      {message && <p className={styles.message}>{message}</p>}

      {isLoading ? (
        <div className={styles.spinnerContainer}>
          <div className={styles.spinner}></div>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Användarnamn"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
          />
          <input
            type="password"
            placeholder="Lösenord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />
          <button type="submit" className={styles.submitButton}>
            Registrera
          </button>
        </form>
      )}

      <button className={styles.backButton} onClick={() => navigate("/")}>
        Tillbaka
      </button>
    </div>
  );
};

export default Register;
