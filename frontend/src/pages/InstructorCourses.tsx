import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { courseService, Course } from '../services/courseService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const InstructorCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await courseService.getAll(false);
        setCourses(data);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this course?')) {
      return;
    }

    try {
      await courseService.delete(id);
      setCourses(courses.filter((c) => c.id !== id));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete course');
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
        Loading courses...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My Courses</h1>
          <p className="text-sm text-slate-600">Manage drafts and published courses.</p>
        </div>
        <Button asChild>
          <Link to="/instructor/courses/create">Create New Course</Link>
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col gap-3 p-6">
            <CardTitle className="text-lg">You haven&apos;t created any courses yet.</CardTitle>
            <CardDescription>
              Start building your first course with the new Tailwind + shadcn UI.
            </CardDescription>
            <Button asChild>
              <Link to="/instructor/courses/create">Create your first course</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <Card key={course.id} className="shadow-sm">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{course.title}</CardTitle>
                  <Badge variant={course.isPublished ? 'success' : 'secondary'}>
                    {course.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                </div>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  {course.modules?.length || 0} modules
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/instructor/courses/${course.id}/edit`}>Edit</Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(course.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstructorCourses;

