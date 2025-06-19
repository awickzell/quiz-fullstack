import React from "react";
import styles from './ActionButton.module.css';

const ActionButton = ({ label, onClick }) => {
  return (
    <button className={styles.button} onClick={onClick}>
      {label}
    </button>
  );
};

export default ActionButton;
