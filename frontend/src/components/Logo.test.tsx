import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Logo from './Logo';

describe('Logo', () => {
  it('names the product and links home', () => {
    render(
      <MemoryRouter>
        <Logo />
      </MemoryRouter>
    );
    const link = screen.getByRole('link', { name: 'Traceback LMS home' });
    expect(link).toHaveAttribute('href', '/dashboard');
    expect(link).toHaveTextContent('Traceback');
    expect(link).toHaveTextContent('LMS');
  });

  it('can point somewhere else (the sign-in page uses /login)', () => {
    render(
      <MemoryRouter>
        <Logo to="/login" />
      </MemoryRouter>
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', '/login');
  });
});
