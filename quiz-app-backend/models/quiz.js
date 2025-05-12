import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  questions: [
    {
      questionText: { type: String, required: true },
      subQuestions: [
        {
          questionText: { type: String },
        },
      ],
    },
  ],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  submissions: [ 
    {
      playerName: String,
      answers: [
        {
          question: String,
          answer: String,
        },
      ],
      submittedAt: { type: Date, default: Date.now }
    }
  ]
});

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;
