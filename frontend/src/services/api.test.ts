import { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import api from './api';

const respondWith = (status: number, data: unknown = {}) => {
  api.defaults.adapter = (config: InternalAxiosRequestConfig) =>
    status >= 200 && status < 300
      ? Promise.resolve({ data, status, statusText: '', headers: {}, config })
      : Promise.reject(
          Object.assign(new Error('fail'), {
            isAxiosError: true,
            config,
            response: { status, data, headers: {}, config, statusText: '' },
          })
        );
};

describe('api client', () => {
  beforeEach(() => localStorage.clear());
  const originalLocation = window.location;
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { href: '/current' },
    });
  });
  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('attaches the stored token', async () => {
    localStorage.setItem('token', 'abc');
    let auth: unknown;
    api.defaults.adapter = (config: InternalAxiosRequestConfig) => {
      auth = (config.headers as AxiosHeaders).Authorization;
      return Promise.resolve({ data: {}, status: 200, statusText: '', headers: {}, config });
    };
    await api.get('/courses');
    expect(auth).toBe('Bearer abc');
  });

  it('does NOT reload the page when login fails with 401', async () => {
    respondWith(401, { message: 'Invalid credentials' });
    await expect(api.post('/auth/login', {})).rejects.toBeDefined();
    expect(window.location.href).toBe('/current');
  });

  it('logs out and redirects when an expired session gets a 401', async () => {
    localStorage.setItem('token', 'old');
    respondWith(401);
    await expect(api.get('/courses')).rejects.toBeDefined();
    expect(window.location.href).toBe('/login');
    expect(localStorage.getItem('token')).toBeNull();
  });
});
