import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  questions: {
    type: [
      {
        questionText: { type: String, required: true },
        type: { type: String, enum: ['text', 'multipleChoice', 'image'], default: 'text' },
        options: [String],
        imageUrl: String,
        subQuestions: [
          {
            questionText: String,
          },
        ],
      }
    ],
    validate: [arr => arr.length > 0, 'Minst en fråga krävs.']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  submissions: [
    {
      playerName: String,
      answers: [
        {
          questionText: String,
          answer: String,
          subAnswers: [
            {
              subQuestionText: String,
              subAnswer: String,
            }
          ],
        },
      ],
      submittedAt: { type: Date, default: Date.now },
    },
  ],
  isLiveQuiz: { type: Boolean, default: false }, 
}, { timestamps: true });

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;
