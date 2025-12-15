import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { courseService, Course, CreateModuleDto } from '../services/courseService';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../components/ui/form';
import { Badge } from '../components/ui/badge';

const courseSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(10, 'Description is required'),
  thumbnail: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  isPublished: z.boolean(),
});

type CourseForm = z.infer<typeof courseSchema>;

const EditCourse = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [moduleForm, setModuleForm] = useState<CreateModuleDto>({
    title: '',
    content: '',
    type: 'text' as const,
    videoUrl: '',
    pdfUrl: '',
    order: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      thumbnail: '',
      isPublished: false,
    },
  });

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        if (id) {
          const data = await courseService.getById(id);
          setCourse(data);
          form.reset({
            title: data.title,
            description: data.description,
            thumbnail: data.thumbnail || '',
            isPublished: data.isPublished,
          });
        }
      } catch (error) {
        console.error('Failed to fetch course:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, form]);

  const handleSubmit = async (values: CourseForm) => {
    setError('');
    setSaving(true);

    try {
      if (id) {
        await courseService.update(id, values);
        alert('Course updated successfully!');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      const maxOrder = Math.max(
        ...(course?.modules?.map((m) => m.order) || [0]),
        -1
      );
      const newModule = await courseService.addModule(id, {
        ...moduleForm,
        order: maxOrder + 1,
      });
      if (course) {
        setCourse({
          ...course,
          modules: [...(course.modules || []), newModule],
        });
      }
      setModuleForm({
        title: '',
        content: '',
        type: 'text',
        videoUrl: '',
        pdfUrl: '',
        order: 0,
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add module');
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!window.confirm('Are you sure you want to delete this module?')) {
      return;
    }

    try {
      await courseService.deleteModule(moduleId);
      if (course) {
        setCourse({
          ...course,
          modules: course.modules?.filter((m) => m.id !== moduleId) || [],
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete module');
    }
  };

  if (loading) {
    return <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">Loading...</div>;
  }

  if (!course) {
    return <div>Course not found</div>;
  }

  const sortedModules = course.modules?.sort((a, b) => a.order - b.order) || [];

  return (
    <div className="space-y-6">
      <Card className="shadow-brand">
        <CardHeader>
          <CardTitle className="text-2xl">Edit Course</CardTitle>
          <CardDescription>Update details and manage modules using Tailwind UI.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Textarea rows={4} {...field} />
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
                      <Input type="url" {...field} />
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
                        Published
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
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Course Modules</CardTitle>
          <CardDescription>Add, upload, or remove modules.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={handleAddModule} className="space-y-4 rounded-lg border border-slate-200 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Module Title</label>
                <Input
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  required
                  placeholder="Intro to course"
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Type</label>
                <select
                  value={moduleForm.type}
                  onChange={(e) =>
                    setModuleForm({
                      ...moduleForm,
                      type: e.target.value as 'text' | 'video' | 'pdf',
                    })
                  }
                  required
                  className="mt-2 flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                >
                  <option value="text">Text</option>
                  <option value="video">Video</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
            </div>

            {moduleForm.type === 'text' && (
              <div>
                <label className="text-sm font-medium text-slate-700">Content</label>
                <Textarea
                  className="mt-2"
                  rows={4}
                  value={moduleForm.content}
                  onChange={(e) => setModuleForm({ ...moduleForm, content: e.target.value })}
                />
              </div>
            )}

            {moduleForm.type === 'video' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Video URL or Upload File</label>
                <Input
                  type="url"
                  value={moduleForm.videoUrl}
                  onChange={(e) =>
                    setModuleForm({ ...moduleForm, videoUrl: e.target.value })
                  }
                  placeholder="Enter YouTube URL or video URL"
                />
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="video-upload"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const objectUrl = URL.createObjectURL(file);
                        setModuleForm({ ...moduleForm, videoUrl: objectUrl });
                      }
                    }}
                  />
                  <label
                    htmlFor="video-upload"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    📹 Upload Video File
                  </label>
                </div>
              </div>
            )}

            {moduleForm.type === 'pdf' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">PDF URL or Upload File</label>
                <Input
                  type="url"
                  value={moduleForm.pdfUrl}
                  onChange={(e) =>
                    setModuleForm({ ...moduleForm, pdfUrl: e.target.value })
                  }
                  placeholder="Enter PDF URL"
                />
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="pdf-upload"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const objectUrl = URL.createObjectURL(file);
                        setModuleForm({ ...moduleForm, pdfUrl: objectUrl });
                      }
                    }}
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    📄 Upload PDF File
                  </label>
                </div>
              </div>
            )}

            <Button type="submit">Add Module</Button>
          </form>

          <div className="space-y-3">
            {sortedModules.length === 0 ? (
              <p className="text-sm text-slate-600">No modules yet. Add your first module above.</p>
            ) : (
              sortedModules.map((module, index) => (
                <div
                  key={module.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{module.title}</p>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        {module.type}
                      </p>
                    </div>
                    <Badge variant="secondary">Order {module.order}</Badge>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteModule(module.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditCourse;

