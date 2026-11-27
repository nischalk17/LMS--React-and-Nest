import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { store } from '../store';
import { ThemeProvider } from '../contexts/ThemeContext';
import Login from './Login';
import { authService } from '../services/authService';

vi.mock('../services/authService', () => ({
  authService: { login: vi.fn(), register: vi.fn(), getProfile: vi.fn() },
}));

const renderLogin = () =>
  render(
    <Provider store={store}>
      <ThemeProvider>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  );

describe('Login page', () => {
  it('shows the server message when credentials are wrong', async () => {
    vi.mocked(authService.login).mockRejectedValue(
      Object.assign(new Error('401'), {
        isAxiosError: true,
        response: { status: 401, data: { message: 'Invalid credentials' } },
      })
    );
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), 'sam@lms.dev');
    await user.type(screen.getByLabelText(/^password/i), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /sign in|log in|login/i }));

    expect((await screen.findAllByText(/invalid credentials/i)).length).toBeGreaterThan(0);
  });
});
