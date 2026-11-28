import { useState } from 'react';
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
import { Select } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import ThemeToggle from '../components/ThemeToggle';
import Logo from '../components/Logo';
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
    } catch (err) {
      const message = getErrorMessage(err, 'Registration failed');
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
      <Card className="relative z-10 w-full max-w-3xl transition">
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
                    <div className="relative">
                        <FormControl>
                          <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Strong password"
                          autoComplete="new-password"
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
                    <div className="space-y-3">
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${strength.barClass}`}
                          style={{ width: `${(Math.max(strength.score, 1) / 4) * 100}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {PASSWORD_REQUIREMENTS.map((req) => (
                          <span
                            key={req}
                            className="rounded-full border border-border px-2 py-1"
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
                  <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link className="font-semibold text-brand hover:underline" to="/login">
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

