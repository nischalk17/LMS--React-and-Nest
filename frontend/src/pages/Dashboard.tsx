import { useEffect, useState } from 'react';
import ErrorMessage from '../components/ErrorMessage';
import { getErrorMessage } from '../utils/errors';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { enrollmentService, Enrollment } from '../services/enrollmentService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const Dashboard = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const data = await enrollmentService.getMyEnrollments();
        setEnrollments(data);
      } catch (error) {
        setLoadError(getErrorMessage(error, 'Could not load your courses'));
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'student') {
      fetchEnrollments();
    } else {
      setLoading(false);
    }
  }, [user]);

  const calculateProgress = (enrollment: Enrollment) => {
    if (!enrollment.progress || enrollment.progress.length === 0) return 0;
    const total = enrollment.course.modules?.length || 0;
    const completed = enrollment.progress.filter((p) => p.isCompleted).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-foreground shadow-sm">
        Loading dashboard...
      </div>
    );
  }

  if (user?.role === 'instructor') {
    return (
      <div className="space-y-4">
        <Card className="">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome, {user.firstName}!</CardTitle>
            <CardDescription>
              You are logged in as an instructor. Manage your catalog below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/instructor/courses">Manage Courses</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loadError && <ErrorMessage message={loadError} />}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Welcome, {user?.firstName}!</h1>
          <p className="text-sm text-muted-foreground">Your active enrollments and progress.</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/courses">Browse Courses</Link>
        </Button>
      </div>

      {enrollments.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-start gap-3 p-6">
            <CardTitle className="text-lg">No enrollments yet</CardTitle>
            <CardDescription>
              Enroll in a course to start learning and track your progress here.
            </CardDescription>
            <Button asChild>
              <Link to="/courses">Explore courses</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {enrollments.map((enrollment) => {
            const progress = calculateProgress(enrollment);
            return (
              <Card key={enrollment.id} className="shadow-sm">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-xl">{enrollment.course.title}</CardTitle>
                  <CardDescription>{enrollment.course.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Progress: <span className="font-semibold text-foreground">{progress}%</span>
                    </span>
                    <Badge variant={progress === 100 ? 'success' : 'secondary'}>
                      {progress === 100 ? 'Completed' : 'In progress'}
                    </Badge>
                  </div>
                  <Button variant="outline" asChild>
                    <Link to={`/courses/${enrollment.course.id}`}>Continue Learning</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;

