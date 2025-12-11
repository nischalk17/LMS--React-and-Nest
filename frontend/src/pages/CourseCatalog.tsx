import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { courseService, Course } from '../services/courseService';
import './CourseCatalog.css';

const CourseCatalog = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await courseService.getAll(true);
        setCourses(data);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="catalog">
      <h1>Course Catalog</h1>
      {courses.length === 0 ? (
        <div className="empty-state">
          <p>No courses available at the moment.</p>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map((course) => (
            <div key={course.id} className="course-card">
              {course.thumbnail && (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="course-thumbnail"
                />
              )}
              <h3>{course.title}</h3>
              <p className="course-description">{course.description}</p>
              <p className="course-instructor">
                Instructor: {course.instructor.firstName}{' '}
                {course.instructor.lastName}
              </p>
              <p className="course-modules">
                {course.modules?.length || 0} modules
              </p>
              <Link to={`/courses/${course.id}`} className="btn-primary">
                View Course
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseCatalog;

