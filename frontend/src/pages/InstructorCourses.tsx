import { useEffect, useState } from 'react';
import ErrorMessage from '../components/ErrorMessage';
import { getErrorMessage } from '../utils/errors';
import { Link } from 'react-router-dom';
import {
  courseService,
  analyticsService,
  Course,
  CourseAnalytics,
} from '../services/courseService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const InstructorCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [stats, setStats] = useState<Record<string, CourseAnalytics>>({});

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const [data, analytics] = await Promise.all([
          courseService.getAll(false),
          analyticsService.getMine(),
        ]);
        setCourses(data);
        setStats(Object.fromEntries(analytics.map((a) => [a.courseId, a])));
      } catch (error) {
        setLoadError(getErrorMessage(error, 'Could not load your courses'));
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
    } catch (error) {
      alert(getErrorMessage(error, 'Failed to delete course'));
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
      {loadError && <ErrorMessage message={loadError} />}
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
                <div className="space-y-1 text-sm text-slate-600">
                  <div>{course.modules?.length || 0} modules</div>
                  <div>
                    {stats[course.id]?.students ?? 0} students ·{' '}
                    {stats[course.id]?.averageProgress ?? 0}% avg progress
                  </div>
                  {(stats[course.id]?.weakestSkills?.length ?? 0) > 0 && (
                    <div>
                      <span className="font-medium">Weakest skills:</span>{' '}
                      {stats[course.id].weakestSkills
                        .map((w) => `${w.skill} (${Math.round(w.accuracy * 100)}%)`)
                        .join(', ')}
                    </div>
                  )}
                  {(stats[course.id]?.unansweredQuestions ?? 0) > 0 && (
                    <div className="font-medium text-amber-600">
                      {stats[course.id].unansweredQuestions} unanswered question(s)
                    </div>
                  )}
                </div>
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

