import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { courseService } from '../services/courseService';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const courseSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(10, 'Description is required'),
  thumbnail: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  isPublished: z.boolean().optional(),
});

type CourseForm = z.infer<typeof courseSchema>;

const CreateCourse = () => {
  const navigate = useNavigate();
  const form = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      thumbnail: '',
      isPublished: false,
    },
  });

  const onSubmit = async (values: CourseForm) => {
    try {
      const course = await courseService.create(values);
      navigate(`/instructor/courses/${course.id}/edit`);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to create course';
      form.setError('title', { message });
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <Card className="shadow-brand">
        <CardHeader>
          <CardTitle className="text-2xl">Create New Course</CardTitle>
          <CardDescription>
            Build a new course using Tailwind + shadcn UI, Redux-authenticated flow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Modern React Patterns" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={5} placeholder="Describe your course..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="thumbnail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thumbnail URL</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://example.com/cover.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                        Publish immediately
                      </label>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/instructor/courses')}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Create Course
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateCourse;

