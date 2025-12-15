import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { authService, type User } from '../services/authService';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

interface AuthState {
  user: User | null;
  status: AuthStatus;
  initialized: boolean;
  error?: string | null;
}

const persistedUser = localStorage.getItem('user');
const initialState: AuthState = {
  user: persistedUser ? (JSON.parse(persistedUser) as User) : null,
  status: 'idle',
  initialized: false,
  error: null,
};

export const initializeAuth = createAsyncThunk<User | null>(
  'auth/initialize',
  async () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const profile = await authService.getProfile();
      return profile;
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
  }
);

export const loginUser = createAsyncThunk<
  User,
  { email: string; password: string },
  { rejectValue: string }
>('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const response = await authService.login(email, password);
    localStorage.setItem('token', response.accessToken);
    localStorage.setItem('user', JSON.stringify(response));
    return {
      id: response.id,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      role: response.role,
    };
  } catch (error: any) {
    const message = error?.response?.data?.message || 'Login failed';
    return rejectWithValue(message);
  }
});

export const registerUser = createAsyncThunk<
  User,
  {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'student' | 'instructor';
  },
  { rejectValue: string }
>('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const response = await authService.register(payload);
    localStorage.setItem('token', response.accessToken);
    localStorage.setItem('user', JSON.stringify(response));
    return {
      id: response.id,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      role: response.role,
    };
  } catch (error: any) {
    const message = error?.response?.data?.message || 'Registration failed';
    return rejectWithValue(message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.status = 'idle';
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = action.payload ? 'authenticated' : 'idle';
        state.initialized = true;
        state.error = null;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.status = 'error';
        state.initialized = true;
      })
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = 'authenticated';
        state.initialized = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload || 'Login failed';
      })
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = 'authenticated';
        state.initialized = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload || 'Registration failed';
      });
  },
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;

