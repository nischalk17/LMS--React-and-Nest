import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { courseService, Course } from '../services/courseService';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const CourseCatalog = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 6;

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
    courses.forEach((course) => {
      const name = `${course.instructor.firstName} ${course.instructor.lastName}`;
      unique.add(name);
    });
    return Array.from(unique).sort();
  }, [courses]);

  const filteredCourses = useMemo(() => {
    let filtered = courses;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(query) ||
          course.description.toLowerCase().includes(query) ||
          `${course.instructor.firstName} ${course.instructor.lastName}`
            .toLowerCase()
            .includes(query)
      );
    }

    if (selectedInstructor !== 'all') {
      filtered = filtered.filter(
        (course) =>
          `${course.instructor.firstName} ${course.instructor.lastName}` ===
          selectedInstructor
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Course Catalog</h1>
          <p className="text-sm text-slate-600">
            Browse published courses. Pagination now shows 6 courses per page.
          </p>
        </div>
      </div>

      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-slate-700">Search</label>
          <Input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Instructor</label>
          <Select
            value={selectedInstructor}
            onChange={(e) => setSelectedInstructor(e.target.value)}
            className="mt-2"
          >
            <option value="all">All Instructors</option>
            {instructors.map((instructor) => (
              <option key={instructor} value={instructor}>
                {instructor}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
          Loading courses...
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-600">
            {searchQuery || selectedInstructor !== 'all'
              ? 'No courses match your filters.'
              : 'No courses available at the moment.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {paginatedCourses.map((course) => (
              <Card key={course.id} className="flex flex-col overflow-hidden shadow-sm">
                {course.thumbnail && (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="h-44 w-full object-cover"
                  />
                )}
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-xl">{course.title}</CardTitle>
                    <Badge variant="secondary">
                      {course.modules?.length || 0} modules
                    </Badge>
                  </div>
                  <CardDescription className="text-sm text-slate-600">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                  <div className="text-sm text-slate-700">
                    Instructor:{' '}
                    <span className="font-semibold text-slate-900">
                      {course.instructor.firstName} {course.instructor.lastName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide text-slate-500">
                      Updated {new Date(course.updatedAt).toLocaleDateString()}
                    </span>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/courses/${course.id}`}>View Course</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline"
              >
                Previous
              </Button>
              <span className="text-sm text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CourseCatalog;

