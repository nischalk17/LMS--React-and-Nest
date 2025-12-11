import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { enrollmentService, Enrollment } from '../services/enrollmentService';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const data = await enrollmentService.getMyEnrollments();
        setEnrollments(data);
      } catch (error) {
        console.error('Failed to fetch enrollments:', error);
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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user?.role === 'instructor') {
    return (
      <div className="dashboard">
        <h1>Welcome, {user.firstName}!</h1>
        <p>You are logged in as an instructor.</p>
        <Link to="/instructor/courses" className="btn-primary">
          Manage Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1>Welcome, {user?.firstName}!</h1>
      <h2>My Courses</h2>
      {enrollments.length === 0 ? (
        <div className="empty-state">
          <p>You haven't enrolled in any courses yet.</p>
          <Link to="/courses" className="btn-primary">
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="courses-grid">
          {enrollments.map((enrollment) => {
            const progress = calculateProgress(enrollment);
            return (
              <div key={enrollment.id} className="course-card">
                <h3>{enrollment.course.title}</h3>
                <p>{enrollment.course.description}</p>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="progress-text">Progress: {progress}%</p>
                <Link
                  to={`/courses/${enrollment.course.id}`}
                  className="btn-secondary"
                >
                  Continue Learning
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;

