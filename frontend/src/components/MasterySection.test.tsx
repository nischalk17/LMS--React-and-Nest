import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import MasterySection from './MasterySection';
import { masteryService, MasteryReport } from '../services/masteryService';

vi.mock('../services/masteryService', () => ({
  masteryService: { mine: vi.fn() },
}));

const report = (over: Partial<MasteryReport> = {}): MasteryReport => ({
  courseId: 'c1',
  method: 'estimate',
  model: null,
  totalAnswers: 9,
  skills: [
    { skill: 'Generics', attempts: 2, correct: 0, mastery: 0.25, method: 'estimate', confidence: 'low' },
    { skill: 'Interfaces', attempts: 6, correct: 5, mastery: 0.75, method: 'estimate', confidence: 'medium' },
  ],
  ...over,
});

describe('MasterySection', () => {
  it('shows each skill with a labelled bar and flags early estimates', async () => {
    vi.mocked(masteryService.mine).mockResolvedValue(report());
    render(<MasterySection courseId="c1" />);

    expect(await screen.findByText('Generics')).toBeInTheDocument();
    expect(screen.getByText(/25% · Needs practice/)).toBeInTheDocument();
    expect(screen.getByText(/75% · Strong/)).toBeInTheDocument();
    expect(screen.getAllByText('Early estimate')).toHaveLength(1); // only the 2-answer skill
    expect(screen.getByRole('progressbar', { name: 'Generics mastery' })).toHaveAttribute(
      'aria-valuenow',
      '25'
    );
    expect(screen.getByText(/from your quiz accuracy/)).toBeInTheDocument();
  });

  it('is honest about what produced the number when a trained model is used', async () => {
    vi.mocked(masteryService.mine).mockResolvedValue(
      report({ method: 'model', model: { dataset: 'assistments', heldOutAuc: 0.74 } })
    );
    render(<MasterySection courseId="c1" />);
    expect(await screen.findByText(/trained on assistments \(held-out AUC 0\.74\)/)).toBeInTheDocument();
  });

  it('renders nothing before the student has answered any question', async () => {
    vi.mocked(masteryService.mine).mockResolvedValue(report({ skills: [], totalAnswers: 0 }));
    const { container } = render(<MasterySection courseId="c1" />);
    await vi.waitFor(() => expect(masteryService.mine).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('shows an error instead of failing silently', async () => {
    vi.mocked(masteryService.mine).mockRejectedValue(new Error('boom'));
    render(<MasterySection courseId="c1" />);
    expect(await screen.findByRole('alert')).toHaveTextContent('boom');
  });
});
