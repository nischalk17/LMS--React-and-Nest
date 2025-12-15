import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../contexts/AuthContext';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

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

const questionSchema = z.object({
  question: z.string().min(5, 'Ask a descriptive question.'),
});

const answerSchema = z.object({
  answer: z.string().min(3, 'Answer cannot be empty.'),
});

const QuestionsSection = ({ courseId }: QuestionsSectionProps) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answerText, setAnswerText] = useState<Record<string, string>>({});

  const form = useForm<z.infer<typeof questionSchema>>({
    resolver: zodResolver(questionSchema),
    defaultValues: { question: '' },
  });

  useEffect(() => {
    const stored = localStorage.getItem(`questions_${courseId}`);
    if (stored) {
      setQuestions(JSON.parse(stored));
    }
  }, [courseId]);

  const handleSubmitQuestion = (values: z.infer<typeof questionSchema>) => {
    if (!user) return;

    const question: Question = {
      id: Date.now().toString(),
      courseId,
      studentId: user.id,
      studentName: `${user.firstName} ${user.lastName}`,
      question: values.question,
      createdAt: new Date(),
    };

    const updated = [question, ...questions];
    setQuestions(updated);
    localStorage.setItem(`questions_${courseId}`, JSON.stringify(updated));
    form.reset();
  };

  const handleSubmitAnswer = (questionId: string) => {
    if (!user) return;

    const parsed = answerSchema.safeParse({ answer: answerText[questionId] });
    if (!parsed.success) return;

    const updated = questions.map((q) =>
      q.id === questionId
        ? {
            ...q,
            answer: parsed.data.answer,
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
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Questions & Answers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {user?.role === 'student' && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitQuestion)} className="space-y-3">
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your question</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Ask a question about this course..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Ask question</Button>
            </form>
          </Form>
        )}

        <div className="space-y-4">
          {questions.length === 0 ? (
            <p className="text-sm text-slate-600">
              No questions yet. Be the first to ask!
            </p>
          ) : (
            questions.map((question) => (
              <div
                key={question.id}
                className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">
                    {question.studentName}
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(question.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-800">{question.question}</p>

                {question.answer ? (
                  <div className="space-y-1 rounded-md bg-slate-50 p-3">
                    <div className="text-sm font-semibold text-slate-900">
                      Instructor: {question.answeredBy}
                    </div>
                    <p className="text-sm text-slate-700">{question.answer}</p>
                    {question.answeredAt && (
                      <span className="text-xs text-slate-500">
                        Answered on {new Date(question.answeredAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ) : user?.role === 'instructor' ? (
                  <div className="space-y-2">
                    <Textarea
                      rows={3}
                      placeholder="Write your answer..."
                      value={answerText[question.id] || ''}
                      onChange={(e) =>
                        setAnswerText({ ...answerText, [question.id]: e.target.value })
                      }
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSubmitAnswer(question.id)}
                    >
                      Submit Answer
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Waiting for instructor response...
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionsSection;

