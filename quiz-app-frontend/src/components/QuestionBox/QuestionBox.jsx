import React from 'react';
import styles from './QuestionBox.module.css';

const QuestionBox = ({ question, index }) => {
  return (
    <div className={styles.questionBox}>
      <h2 className={styles.questionTitle}>
        Fråga {index + 1}: {question.questionText}
      </h2>

      {question.type === 'multipleChoice' && Array.isArray(question.options) && (
        <ul className={styles.questionOptions}>
          {question.options.map((option, i) => (
            <li key={i} className={styles.questionOption}>{option}</li>
          ))}
        </ul>
      )}

      {question.type === 'text' && (
        <p>Skriv ditt svar här...</p>
      )}

      {question.subQuestions?.length > 0 && (
        <div className={styles.subQuestions}>
          <ul>
            {question.subQuestions.map((subQ, i) => (
              <li key={i} className={styles.subQuestionItem}>{subQ.questionText}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default QuestionBox;
