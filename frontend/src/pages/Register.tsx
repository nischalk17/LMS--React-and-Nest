import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(6, 'At least 6 characters')
    .regex(/[a-z]/, 'Include a lowercase letter')
    .regex(/[A-Z]/, 'Include an uppercase letter')
    .regex(/[0-9]/, 'Include a number')
    .regex(/_/, 'Include an underscore'),
  role: z.enum(['student', 'instructor']),
});

type RegisterForm = z.infer<typeof registerSchema>;

const Register = () => {
  const { register: registerUser, status, error } = useAuth();
  const navigate = useNavigate();

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50 to-blue-50 px-4">
      <Card className="w-full max-w-2xl shadow-brand">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>Start teaching or learning right away.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-1 space-y-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane" {...field} />
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
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="md:col-span-1 space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Strong password" {...field} />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-slate-500">
                        Include lowercase, uppercase, number, and underscore.
                      </p>
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
                {error && (
                  <p className="text-sm font-medium text-red-600">{error}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Registering...' : 'Register'}
                </Button>
                <p className="mt-4 text-center text-sm text-slate-600">
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

