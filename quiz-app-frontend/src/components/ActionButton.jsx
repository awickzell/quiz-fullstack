import React from 'react';

const ActionButton = ({ label, onClick, styleClass }) => {
  return (
    <button className={`action-button ${styleClass}`} onClick={onClick}>
      {label}
    </button>
  );
};

export default ActionButton;
