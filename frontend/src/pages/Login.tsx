import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import ThemeToggle from '../components/ThemeToggle';
import { evaluatePasswordStrength } from '../utils/passwordStrength';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login = () => {
  const { login, status, error } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const passwordValue = form.watch('password');
  const emailValue = form.watch('email');
  const strength = evaluatePasswordStrength(passwordValue || '');

  // Update loginError when error from auth context changes
  useEffect(() => {
    if (error) {
      setLoginError(error);
    }
  }, [error]);

  // Clear error when user starts typing
  useEffect(() => {
    if (emailValue || passwordValue) {
      setLoginError(null);
    }
  }, [emailValue, passwordValue]);

  const onSubmit = async (values: LoginForm) => {
    try {
      setLoginError(null);
      await login(values.email, values.password);
      navigate('/dashboard');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Login failed';
      setLoginError(message);
      form.setError('email', { message });
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.12),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(99,102,241,0.12),transparent_30%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.15),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.15),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(99,102,241,0.18),transparent_32%)]" />
      <div className="absolute right-6 top-6 z-10">
        <ThemeToggle />
      </div>
      <Card className="glass-panel relative z-10 w-full max-w-md shadow-brand transition hover:-translate-y-1 hover:shadow-2xl">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to continue learning.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <div className="space-y-2">
                      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full ${strength.barClass}`}
                          style={{ width: `${(Math.max(strength.score, 1) / 4) * 100}%` }}
                        />
                      </div>
                      <p className={`text-xs font-semibold ${strength.colorClass}`}>
                        Strength: {strength.label}
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Logging in...' : 'Login'}
              </Button>

              {loginError && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                  {loginError}
                </p>
              )}
            </form>
          </Form>
          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
            Don&apos;t have an account?{' '}
            <Link className="font-semibold text-primary hover:underline" to="/register">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

