import { useCallback, useEffect, useState } from 'react';
import {
  quizService,
  Quiz,
  AttemptResult,
  AttemptSummary,
} from '../services/quizService';
import { getErrorMessage } from '../utils/errors';
import ErrorMessage from './ErrorMessage';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

/** Student view: take the course quiz and see past scores. */
const QuizSection = ({ courseId }: { courseId: string }) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [q, past] = await Promise.all([
        quizService.get(courseId),
        quizService.myAttempts(courseId),
      ]);
      setQuiz(q);
      setAttempts(past);
      setAnswers(q ? q.questions.map(() => -1) : []);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load the quiz'));
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return null;
  if (!quiz && !error) return null; // the instructor has not added a quiz

  const allAnswered = answers.length > 0 && answers.every((a) => a >= 0);
  const best = attempts.length ? Math.max(...attempts.map((a) => a.score)) : null;

  const submit = async () => {
    setSubmitting(true);
    try {
      setResult(await quizService.submit(courseId, answers));
      setAttempts(await quizService.myAttempts(courseId));
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not submit the quiz'));
    } finally {
      setSubmitting(false);
    }
  };

  const retake = () => {
    setResult(null);
    setAnswers(quiz ? quiz.questions.map(() => -1) : []);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Quiz{quiz ? `: ${quiz.title}` : ''}</CardTitle>
          {best !== null && <Badge variant="secondary">Best score: {best}%</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && <ErrorMessage message={error} />}

        {quiz && result && (
          <div
            role="status"
            className={`rounded-md border p-4 text-sm ${
              result.passed
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            <p className="font-semibold">
              {result.passed ? 'Passed' : 'Not passed yet'}: {result.score}% (
              {result.correct}/{result.total} correct, {result.passingScore}% needed)
            </p>
            <ul className="mt-2 list-disc pl-5">
              {quiz.questions.map((q, i) => (
                <li key={q.id ?? i}>
                  {q.text}: {result.results[i] ? 'correct' : 'incorrect'}
                </li>
              ))}
            </ul>
            <Button size="sm" className="mt-3" onClick={retake}>
              Try again
            </Button>
          </div>
        )}

        {quiz && !result && (
          <>
            {quiz.questions.map((q, qi) => (
              <fieldset key={q.id ?? qi} className="space-y-2">
                <legend className="font-medium text-slate-900 dark:text-slate-100">
                  {qi + 1}. {q.text}
                  {q.skill && (
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      ({q.skill})
                    </span>
                  )}
                </legend>
                {q.options.map((option, oi) => (
                  <label key={oi} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={`q-${qi}`}
                      checked={answers[qi] === oi}
                      onChange={() =>
                        setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))
                      }
                    />
                    {option}
                  </label>
                ))}
              </fieldset>
            ))}
            <Button onClick={() => void submit()} disabled={!allAnswered || submitting}>
              {submitting ? 'Submitting...' : 'Submit answers'}
            </Button>
            {!allAnswered && (
              <p className="text-xs text-slate-500">Answer every question to submit.</p>
            )}
          </>
        )}

        {attempts.length > 0 && (
          <div className="text-sm text-slate-600 dark:text-slate-400">
            <p className="font-medium">Previous attempts</p>
            <ul className="list-disc pl-5">
              {attempts.slice(0, 5).map((a) => (
                <li key={a.id}>
                  {new Date(a.createdAt).toLocaleString()}: {a.score}%{' '}
                  {a.passed ? '(passed)' : '(not passed)'}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuizSection;
