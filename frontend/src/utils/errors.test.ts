import { AxiosError, AxiosHeaders } from 'axios';
import { getErrorMessage } from './errors';

const apiError = (status: number, data: unknown) =>
  new AxiosError('failed', 'ERR', undefined, undefined, {
    status,
    statusText: '',
    data,
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

describe('getErrorMessage', () => {
  it('uses the API message', () => {
    expect(getErrorMessage(apiError(401, { message: 'Invalid credentials' }), 'x')).toBe(
      'Invalid credentials'
    );
  });

  it('joins validation message arrays', () => {
    expect(
      getErrorMessage(apiError(400, { message: ['email must be an email', 'password too short'] }), 'x')
    ).toBe('email must be an email, password too short');
  });

  it('passes plain strings through (Redux thunks reject with strings)', () => {
    expect(getErrorMessage('Invalid credentials', 'Login failed')).toBe('Invalid credentials');
  });

  it('explains network failures instead of a generic message', () => {
    const noResponse = new AxiosError('Network Error', 'ERR_NETWORK');
    expect(getErrorMessage(noResponse, 'Login failed')).toMatch(/Cannot reach the server/);
  });

  it('falls back for unknown values', () => {
    expect(getErrorMessage(undefined, 'Something failed')).toBe('Something failed');
    expect(getErrorMessage(apiError(500, {}), 'Something failed')).toBe('Something failed');
  });
});
