import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  initializeAuth,
  loginUser,
  logout as logoutAction,
  registerUser,
} from '../store/authSlice';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  return <>{children}</>;
};

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, status, initialized, error } = useAppSelector(
    (state) => state.auth
  );

  return {
    user,
    loading: status === 'loading' && !initialized,
    status,
    error,
    login: (email: string, password: string) =>
      dispatch(loginUser({ email, password })).unwrap(),
    register: (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role?: 'student' | 'instructor';
    }) => dispatch(registerUser(data)).unwrap(),
    logout: () => dispatch(logoutAction()),
  };
};

