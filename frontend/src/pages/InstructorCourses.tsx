import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { courseService, Course } from '../services/courseService';
import './InstructorCourses.css';

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
    return <div>Loading...</div>;
  }

  return (
    <div className="instructor-courses">
      <div className="page-header">
        <h1>My Courses</h1>
        <Link to="/instructor/courses/create" className="btn-primary">
          Create New Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state">
          <p>You haven't created any courses yet.</p>
          <Link to="/instructor/courses/create" className="btn-primary">
            Create Your First Course
          </Link>
        </div>
      ) : (
        <div className="courses-list">
          {courses.map((course) => (
            <div key={course.id} className="course-item">
              <div className="course-details">
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <div className="course-meta">
                  <span className={`status ${course.isPublished ? 'published' : 'draft'}`}>
                    {course.isPublished ? 'Published' : 'Draft'}
                  </span>
                  <span>{course.modules?.length || 0} modules</span>
                </div>
              </div>
              <div className="course-actions">
                <Link
                  to={`/instructor/courses/${course.id}/edit`}
                  className="btn-secondary"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(course.id)}
                  className="btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstructorCourses;

