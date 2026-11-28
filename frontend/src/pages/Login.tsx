import { useState, useEffect } from 'react';
import { getErrorMessage } from '../utils/errors';
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
import Logo from '../components/Logo';
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
    } catch (err) {
      const message = getErrorMessage(err, 'Login failed');
      setLoginError(message);
      form.setError('email', { message });
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
      <div className="absolute right-6 top-6 z-10">
        <ThemeToggle />
      </div>
      <Logo to="/login" className="text-brand" />
      <p className="-mt-3 text-sm text-muted-foreground">Find where it went wrong.</p>
      <Card className="relative z-10 w-full max-w-md transition">
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
                    <div className="relative">
                        <FormControl>
                          <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className="pr-10"
                          {...field}
                        />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    <div className="space-y-2">
                      <div className="h-2 w-full rounded-full bg-muted">
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
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                  {loginError}
                </p>
              )}
            </form>
          </Form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link className="font-semibold text-brand hover:underline" to="/register">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

