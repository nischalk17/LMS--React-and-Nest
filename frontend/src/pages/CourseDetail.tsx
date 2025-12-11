import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { courseService, Course } from '../services/courseService';
import { enrollmentService } from '../services/enrollmentService';
import './CourseDetail.css';

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        if (id) {
          const data = await courseService.getById(id);
          setCourse(data);
          
          // Check if user is enrolled
          if (user?.role === 'student') {
            const enrollments = await enrollmentService.getMyEnrollments();
            setIsEnrolled(enrollments.some((e) => e.courseId === id));
          }
        }
      } catch (error) {
        console.error('Failed to fetch course:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, user]);

  const handleEnroll = async () => {
    if (!id) return;
    setEnrolling(true);
    try {
      await enrollmentService.enroll(id);
      setIsEnrolled(true);
      navigate('/dashboard');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!course) {
    return <div>Course not found</div>;
  }

  const sortedModules = course.modules?.sort((a, b) => a.order - b.order) || [];

  return (
    <div className="course-detail">
      <div className="course-header">
        {course.thumbnail && (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="course-hero-image"
          />
        )}
        <div className="course-info">
          <h1>{course.title}</h1>
          <p className="course-instructor">
            Instructor: {course.instructor.firstName}{' '}
            {course.instructor.lastName}
          </p>
          <p className="course-description">{course.description}</p>
          {user?.role === 'student' && !isEnrolled && (
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="btn-primary"
            >
              {enrolling ? 'Enrolling...' : 'Enroll in Course'}
            </button>
          )}
          {isEnrolled && (
            <Link to="/dashboard" className="btn-secondary">
              Go to My Courses
            </Link>
          )}
        </div>
      </div>

      <div className="course-modules">
        <h2>Course Modules</h2>
        {sortedModules.length === 0 ? (
          <p>No modules available yet.</p>
        ) : (
          <div className="modules-list">
            {sortedModules.map((module, index) => (
              <div key={module.id} className="module-item">
                <div className="module-number">{index + 1}</div>
                <div className="module-content">
                  <h3>{module.title}</h3>
                  <p className="module-type">Type: {module.type}</p>
                  {module.content && (
                    <p className="module-preview">{module.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetail;

