import { useState } from 'react';
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
import { Select } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import ThemeToggle from '../components/ThemeToggle';
import { PASSWORD_REQUIREMENTS, evaluatePasswordStrength } from '../utils/passwordStrength';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Include an uppercase letter')
    .regex(/[0-9]/, 'Include a number')
    .regex(/[^A-Za-z0-9]/, 'Include a special symbol'),
  role: z.enum(['student', 'instructor']),
});

type RegisterForm = z.infer<typeof registerSchema>;

const Register = () => {
  const { register: registerUser, status, error } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'student',
    },
  });

  const passwordValue = form.watch('password');
  const strength = evaluatePasswordStrength(passwordValue || '');

  const onSubmit = async (values: RegisterForm) => {
    try {
      await registerUser(values);
      navigate('/dashboard');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Registration failed';
      form.setError('email', { message });
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(34,197,94,0.12),transparent_30%),radial-gradient(circle_at_90%_15%,rgba(59,130,246,0.12),transparent_28%),radial-gradient(circle_at_50%_80%,rgba(99,102,241,0.14),transparent_32%)] dark:bg-[radial-gradient(circle_at_10%_20%,rgba(34,197,94,0.15),transparent_30%),radial-gradient(circle_at_90%_15%,rgba(59,130,246,0.18),transparent_28%),radial-gradient(circle_at_50%_80%,rgba(99,102,241,0.18),transparent_32%)]" />
      <div className="absolute right-6 top-6 z-10">
        <ThemeToggle />
      </div>
      <Card className="glass-panel relative z-10 w-full max-w-3xl shadow-brand transition hover:-translate-y-1 hover:shadow-2xl">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>Start teaching or learning right away.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane" autoComplete="given-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" autoComplete="family-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                          placeholder="Strong password"
                          autoComplete="new-password"
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
                    <div className="space-y-3">
                      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full ${strength.barClass}`}
                          style={{ width: `${(Math.max(strength.score, 1) / 4) * 100}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
                        {PASSWORD_REQUIREMENTS.map((req) => (
                          <span
                            key={req}
                            className="rounded-full border border-slate-200 px-2 py-1 dark:border-slate-700"
                          >
                            {req}
                          </span>
                        ))}
                      </div>
                      <p className={`text-xs font-semibold ${strength.colorClass}`}>
                        Strength: {strength.label}
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Select {...field}>
                        <option value="student">Student</option>
                        <option value="instructor">Instructor</option>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Registering...' : 'Register'}
                </Button>
                {error && (
                  <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                    {error}
                  </p>
                )}
                <p className="text-center text-sm text-slate-600 dark:text-slate-300">
                  Already have an account?{' '}
                  <Link className="font-semibold text-primary hover:underline" to="/login">
                    Login
                  </Link>
                </p>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;

