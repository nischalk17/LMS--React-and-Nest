import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { courseService, Course } from '../services/courseService';
import './CourseCatalog.css';

const CourseCatalog = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 9;

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

  const instructors = useMemo(() => {
    const unique = new Set<string>();
    courses.forEach(course => {
      const name = `${course.instructor.firstName} ${course.instructor.lastName}`;
      unique.add(name);
    });
    return Array.from(unique).sort();
  }, [courses]);

  const filteredCourses = useMemo(() => {
    let filtered = courses;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        `${course.instructor.firstName} ${course.instructor.lastName}`.toLowerCase().includes(query)
      );
    }

    // Filter by instructor
    if (selectedInstructor !== 'all') {
      filtered = filtered.filter(course =>
        `${course.instructor.firstName} ${course.instructor.lastName}` === selectedInstructor
      );
    }

    return filtered;
  }, [courses, searchQuery, selectedInstructor]);

  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * coursesPerPage;
    return filteredCourses.slice(startIndex, startIndex + coursesPerPage);
  }, [filteredCourses, currentPage]);

  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedInstructor]);

  if (loading) {
    return <div className="catalog-loading">Loading...</div>;
  }

  return (
    <div className="catalog">
      <h1>Course Catalog</h1>
      
      <div className="catalog-filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="instructor-filter">
          <label>Filter by Instructor:</label>
          <select
            value={selectedInstructor}
            onChange={(e) => setSelectedInstructor(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Instructors</option>
            {instructors.map((instructor) => (
              <option key={instructor} value={instructor}>
                {instructor}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="empty-state">
          <p>{searchQuery || selectedInstructor !== 'all' 
            ? 'No courses found matching your criteria.' 
            : 'No courses available at the moment.'}</p>
        </div>
      ) : (
        <>
          <div className="courses-grid">
            {paginatedCourses.map((course) => (
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

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CourseCatalog;

