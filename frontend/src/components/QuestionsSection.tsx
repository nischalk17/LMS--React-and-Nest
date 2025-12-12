import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './QuestionsSection.css';

export interface Question {
  id: string;
  courseId: string;
  studentId: string;
  studentName: string;
  question: string;
  answer?: string;
  answeredBy?: string;
  createdAt: Date;
  answeredAt?: Date;
}

interface QuestionsSectionProps {
  courseId: string;
}

const QuestionsSection = ({ courseId }: QuestionsSectionProps) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [answerText, setAnswerText] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  // In a real app, this would fetch from an API
  useEffect(() => {
    // Load questions from localStorage for demo
    const stored = localStorage.getItem(`questions_${courseId}`);
    if (stored) {
      setQuestions(JSON.parse(stored));
    }
  }, [courseId]);

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !user) return;

    const question: Question = {
      id: Date.now().toString(),
      courseId,
      studentId: user.id,
      studentName: `${user.firstName} ${user.lastName}`,
      question: newQuestion,
      createdAt: new Date(),
    };

    const updated = [question, ...questions];
    setQuestions(updated);
    localStorage.setItem(`questions_${courseId}`, JSON.stringify(updated));
    setNewQuestion('');
  };

  const handleSubmitAnswer = (questionId: string) => {
    if (!answerText[questionId]?.trim() || !user) return;

    const updated = questions.map((q) =>
      q.id === questionId
        ? {
            ...q,
            answer: answerText[questionId],
            answeredBy: `${user.firstName} ${user.lastName}`,
            answeredAt: new Date(),
          }
        : q
    );

    setQuestions(updated);
    localStorage.setItem(`questions_${courseId}`, JSON.stringify(updated));
    setAnswerText({ ...answerText, [questionId]: '' });
  };

  if (user?.role !== 'student' && user?.role !== 'instructor') {
    return null;
  }

  return (
    <div className="questions-section">
      <h2>Questions & Answers</h2>

      {user?.role === 'student' && (
        <form onSubmit={handleSubmitQuestion} className="question-form">
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Ask a question about this course..."
            rows={3}
            required
            className="question-input"
          />
          <button type="submit" className="btn-primary">
            Ask Question
          </button>
        </form>
      )}

      <div className="questions-list">
        {questions.length === 0 ? (
          <p className="no-questions">No questions yet. Be the first to ask!</p>
        ) : (
          questions.map((question) => (
            <div key={question.id} className="question-item">
              <div className="question-header">
                <div>
                  <strong>{question.studentName}</strong>
                  <span className="question-date">
                    {new Date(question.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <p className="question-text">{question.question}</p>

              {question.answer ? (
                <div className="answer-section">
                  <div className="answer-header">
                    <strong>Instructor: {question.answeredBy}</strong>
                    <span className="answer-date">
                      {question.answeredAt &&
                        new Date(question.answeredAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="answer-text">{question.answer}</p>
                </div>
              ) : user?.role === 'instructor' ? (
                <div className="answer-form">
                  <textarea
                    value={answerText[question.id] || ''}
                    onChange={(e) =>
                      setAnswerText({
                        ...answerText,
                        [question.id]: e.target.value,
                      })
                    }
                    placeholder="Write your answer..."
                    rows={3}
                    className="answer-input"
                  />
                  <button
                    onClick={() => handleSubmitAnswer(question.id)}
                    className="btn-primary btn-small"
                  >
                    Submit Answer
                  </button>
                </div>
              ) : (
                <p className="pending-answer">Waiting for instructor response...</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QuestionsSection;

