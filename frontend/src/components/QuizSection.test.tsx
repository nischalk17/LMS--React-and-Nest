import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import QuizSection from './QuizSection';
import { quizService } from '../services/quizService';

vi.mock('../services/quizService', () => ({
  quizService: {
    get: vi.fn(),
    myAttempts: vi.fn(),
    submit: vi.fn(),
  },
}));

const quiz = {
  id: 'q1',
  courseId: 'c1',
  title: 'Basics',
  passingScore: 50,
  questions: [
    { id: 'a', text: 'What is 2 + 2?', options: ['3', '4'] },
    { id: 'b', text: 'Capital of France?', options: ['Paris', 'Rome'] },
  ],
};

describe('QuizSection', () => {
  beforeEach(() => {
    vi.mocked(quizService.get).mockResolvedValue(quiz);
    vi.mocked(quizService.myAttempts).mockResolvedValue([]);
  });

  it('renders nothing when the course has no quiz', async () => {
    vi.mocked(quizService.get).mockResolvedValue(null);
    const { container } = render(<QuizSection courseId="c1" />);
    await vi.waitFor(() => expect(quizService.get).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('only allows submitting once every question is answered, then shows the result', async () => {
    vi.mocked(quizService.submit).mockResolvedValue({
      id: 'r1',
      score: 50,
      passed: true,
      correct: 1,
      total: 2,
      passingScore: 50,
      results: [true, false],
    });
    const user = userEvent.setup();
    render(<QuizSection courseId="c1" />);

    const submit = await screen.findByRole('button', { name: /submit answers/i });
    expect(submit).toBeDisabled();

    await user.click(screen.getByLabelText('4'));
    expect(submit).toBeDisabled();
    await user.click(screen.getByLabelText('Rome'));
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(quizService.submit).toHaveBeenCalledWith('c1', [1, 1]);
    expect(await screen.findByText(/Passed: 50%/)).toBeInTheDocument();
    expect(screen.getByText(/Capital of France\?: incorrect/)).toBeInTheDocument();
  });

  it('shows a readable error when submitting fails', async () => {
    vi.mocked(quizService.submit).mockRejectedValue(new Error('Answer all 2 questions'));
    const user = userEvent.setup();
    render(<QuizSection courseId="c1" />);
    await user.click(await screen.findByLabelText('3'));
    await user.click(screen.getByLabelText('Paris'));
    await user.click(screen.getByRole('button', { name: /submit answers/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Answer all 2 questions');
  });
});
