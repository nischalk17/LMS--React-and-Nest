import { useEffect, useState } from 'react';
import { quizService, QuizDraft } from '../services/quizService';
import { getErrorMessage } from '../utils/errors';
import ErrorMessage from './ErrorMessage';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const emptyQuestion = () => ({
  text: '',
  skill: '',
  options: ['', ''],
  correctIndex: 0,
});

const emptyDraft = (): QuizDraft => ({
  title: 'Course quiz',
  passingScore: 70,
  questions: [emptyQuestion()],
});

/** Instructor view: create, edit or delete the course quiz. */
const QuizEditor = ({ courseId }: { courseId: string }) => {
  const [draft, setDraft] = useState<QuizDraft>(emptyDraft());
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const quiz = await quizService.get(courseId);
        if (quiz) {
          setExists(true);
          setDraft({
            title: quiz.title,
            passingScore: quiz.passingScore,
            questions: quiz.questions.map((q) => ({
              id: q.id,
              text: q.text,
              skill: q.skill ?? '',
              options: q.options,
              correctIndex: q.correctIndex ?? 0,
            })),
          });
        }
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load the quiz'));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [courseId]);

  const updateQuestion = (qi: number, patch: Partial<QuizDraft['questions'][number]>) =>
    setDraft((d) => ({
      ...d,
      questions: d.questions.map((q, i) => (i === qi ? { ...q, ...patch } : q)),
    }));

  const updateOption = (qi: number, oi: number, value: string) =>
    updateQuestion(qi, {
      options: draft.questions[qi].options.map((o, i) => (i === oi ? value : o)),
    });

  const addOption = (qi: number) => {
    if (draft.questions[qi].options.length >= 6) return;
    updateQuestion(qi, { options: [...draft.questions[qi].options, ''] });
  };

  const removeOption = (qi: number, oi: number) => {
    const q = draft.questions[qi];
    if (q.options.length <= 2) return;
    const correctIndex =
      q.correctIndex === oi ? 0 : q.correctIndex > oi ? q.correctIndex - 1 : q.correctIndex;
    updateQuestion(qi, { options: q.options.filter((_, i) => i !== oi), correctIndex });
  };

  const save = async () => {
    setError('');
    setMessage('');
    try {
      await quizService.save(courseId, draft);
      setExists(true);
      setMessage('Quiz saved.');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save the quiz'));
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this quiz? Student attempts are deleted too.')) return;
    try {
      await quizService.remove(courseId);
      setExists(false);
      setDraft(emptyDraft());
      setMessage('Quiz deleted.');
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete the quiz'));
    }
  };

  if (loading) return null;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Quiz</CardTitle>
        <CardDescription>
          Multiple choice, graded automatically. Enrolled students can take it from the course page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && <ErrorMessage message={error} />}
        {message && (
          <p role="status" className="text-sm text-emerald-700">
            {message}
          </p>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm md:col-span-2">
            Title
            <Input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="mt-1"
            />
          </label>
          <label className="text-sm">
            Passing score (%)
            <Input
              type="number"
              min={0}
              max={100}
              value={draft.passingScore}
              onChange={(e) =>
                setDraft({ ...draft, passingScore: Number(e.target.value) })
              }
              className="mt-1"
            />
          </label>
        </div>

        {draft.questions.map((q, qi) => (
          <div key={qi} className="space-y-2 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Input
                placeholder={`Question ${qi + 1}`}
                value={q.text}
                onChange={(e) => updateQuestion(qi, { text: e.target.value })}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={draft.questions.length <= 1}
                onClick={() =>
                  setDraft({
                    ...draft,
                    questions: draft.questions.filter((_, i) => i !== qi),
                  })
                }
              >
                Remove
              </Button>
            </div>
            <Input
              placeholder="Skill / topic tested (optional, defaults to the course title)"
              aria-label={`Skill tested by question ${qi + 1}`}
              maxLength={80}
              value={q.skill ?? ''}
              onChange={(e) => updateQuestion(qi, { skill: e.target.value })}
            />
            {q.options.map((option, oi) => (
              <div key={oi} className="flex items-center gap-2 pl-2">
                <input
                  type="radio"
                  name={`correct-${qi}`}
                  aria-label={`Mark option ${oi + 1} of question ${qi + 1} as correct`}
                  checked={q.correctIndex === oi}
                  onChange={() => updateQuestion(qi, { correctIndex: oi })}
                />
                <Input
                  placeholder={`Option ${oi + 1}`}
                  value={option}
                  onChange={(e) => updateOption(qi, oi, e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={q.options.length <= 2}
                  onClick={() => removeOption(qi, oi)}
                >
                  x
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={q.options.length >= 6}
              onClick={() => addOption(qi)}
            >
              Add option
            </Button>
            <p className="text-xs text-slate-500">The selected radio button is the correct answer.</p>
          </div>
        ))}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={draft.questions.length >= 50}
            onClick={() =>
              setDraft({ ...draft, questions: [...draft.questions, emptyQuestion()] })
            }
          >
            Add question
          </Button>
          <Button type="button" onClick={() => void save()}>
            {exists ? 'Update quiz' : 'Create quiz'}
          </Button>
          {exists && (
            <Button type="button" variant="destructive" onClick={() => void remove()}>
              Delete quiz
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizEditor;
