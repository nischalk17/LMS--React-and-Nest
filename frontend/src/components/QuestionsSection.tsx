import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../contexts/AuthContext';
import { questionService, Question } from '../services/questionService';
import { getErrorMessage } from '../utils/errors';
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

interface QuestionsSectionProps {
  courseId: string;
  /** True when the signed-in user is this course's instructor. */
  isInstructor: boolean;
}

const questionSchema = z.object({
  body: z.string().trim().min(5, 'Ask a descriptive question.').max(2000),
});

const fullName = (p: { firstName: string; lastName: string }) =>
  `${p.firstName} ${p.lastName}`;

const QuestionsSection = ({ courseId, isInstructor }: QuestionsSectionProps) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answerText, setAnswerText] = useState<Record<string, string>>({});

  const form = useForm<z.infer<typeof questionSchema>>({
    resolver: zodResolver(questionSchema),
    defaultValues: { body: '' },
  });

  const load = useCallback(async () => {
    try {
      setQuestions(await questionService.list(courseId));
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load questions'));
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAsk = async (values: z.infer<typeof questionSchema>) => {
    try {
      const created = await questionService.ask(courseId, values.body);
      setQuestions((prev) => [created, ...prev]);
      form.reset();
    } catch (err) {
      form.setError('body', {
        message: getErrorMessage(err, 'Could not post your question'),
      });
    }
  };

  const handleAnswer = async (questionId: string) => {
    const answer = (answerText[questionId] ?? '').trim();
    if (answer.length < 2) return;
    try {
      const updated = await questionService.answer(questionId, answer);
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? updated : q))
      );
      setAnswerText((prev) => ({ ...prev, [questionId]: '' }));
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save the answer'));
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Questions &amp; Answers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {user?.role === 'student' && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleAsk)}
              className="space-y-3"
            >
              <FormField
                control={form.control}
                name="body"
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
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Ask question
              </Button>
            </form>
          </Form>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="space-y-4">
          {loading ? (
            <p className="text-sm text-slate-600">Loading questions...</p>
          ) : questions.length === 0 ? (
            <p className="text-sm text-slate-600">
              No questions yet.{' '}
              {user?.role === 'student' ? 'Be the first to ask!' : ''}
            </p>
          ) : (
            questions.map((q) => (
              <div
                key={q.id}
                className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">
                    {fullName(q.author)}
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-slate-800">{q.body}</p>

                {q.answer ? (
                  <div className="space-y-1 rounded-md bg-slate-50 p-3">
                    <div className="text-sm font-semibold text-slate-900">
                      Instructor{q.answeredBy ? `: ${fullName(q.answeredBy)}` : ''}
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-slate-700">
                      {q.answer}
                    </p>
                    {q.answeredAt && (
                      <span className="text-xs text-slate-500">
                        Answered on{' '}
                        {new Date(q.answeredAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ) : isInstructor ? (
                  <div className="space-y-2">
                    <Textarea
                      rows={3}
                      placeholder="Write your answer..."
                      value={answerText[q.id] ?? ''}
                      onChange={(e) =>
                        setAnswerText((prev) => ({
                          ...prev,
                          [q.id]: e.target.value,
                        }))
                      }
                    />
                    <Button size="sm" onClick={() => void handleAnswer(q.id)}>
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
