import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionText: String,
  answer: String,
  subAnswers: [
    {
      subQuestionText: String,
      subAnswer: String
    }
  ]
});

const quizResponseSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
  playerName: String,
  answers: [answerSchema],
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

const QuizResponse = mongoose.model('QuizResponse', quizResponseSchema);

export default QuizResponse;
