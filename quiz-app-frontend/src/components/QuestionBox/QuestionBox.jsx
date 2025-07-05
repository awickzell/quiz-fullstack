import React from 'react';
import styles from './QuestionBox.module.css';

const QuestionBox = ({ question, index, isHost = false }) => {
  return (
  <div className={styles.questionBox}>
      
      <div className={styles.combinedQuestions}>
        <ul>
          {[question, ...(question.subQuestions || [])].map((q, i) => (
            <li key={i} className={styles.subQuestionItem}>
              <strong>{String.fromCharCode(65 + i)}.</strong> {q.questionText}
              </li>
            ))}
            </ul>
            </div>
            
            {question.type === 'multipleChoice' && Array.isArray(question.options) && (
              <ul className={styles.questionOptions}>
                {question.options.map((option, i) => (
                  <li key={i} className={styles.questionOption}>{option}</li>
                  ))}
                  </ul>
                )}
                
                {question.type === 'text' && !isHost && (
                  <p>Skriv ditt svar här...</p>
                  )}
                  </div>
                  );
};

export default QuestionBox;
