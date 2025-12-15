import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { courseService, Course, Module } from '../services/courseService';
import { enrollmentService, Enrollment } from '../services/enrollmentService';
import { convertToEmbedUrl } from '../utils/videoUtils';
import QuestionsSection from '../components/QuestionsSection';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [showModuleViewer, setShowModuleViewer] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        if (id) {
          const data = await courseService.getById(id);
          setCourse(data);

          if (user?.role === 'student') {
            const enrollments = await enrollmentService.getMyEnrollments();
            const userEnrollment = enrollments.find((e) => e.courseId === id);
            if (userEnrollment) {
              setIsEnrolled(true);
              setEnrollment(userEnrollment);
            }
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
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
        Loading course...
      </div>
    );
  }

  if (!course) {
    return <div>Course not found</div>;
  }

  const handleModuleClick = async (module: Module) => {
    if (isEnrolled || user?.role === 'instructor') {
      setSelectedModule(module);
      setShowModuleViewer(true);

      if (isEnrolled && enrollment && user?.role === 'student') {
        try {
          await enrollmentService.updateProgress(enrollment.id, module.id, 100);
          const enrollments = await enrollmentService.getMyEnrollments();
          const updatedEnrollment = enrollments.find((e) => e.courseId === id);
          if (updatedEnrollment) {
            setEnrollment(updatedEnrollment);
          }
        } catch (error) {
          console.error('Failed to update progress:', error);
        }
      }
    }
  };

  const closeModuleViewer = () => {
    setShowModuleViewer(false);
    setSelectedModule(null);
  };

  const sortedModules = course.modules?.sort((a, b) => a.order - b.order) || [];

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden shadow-brand">
        <div className="grid gap-6 md:grid-cols-[1.5fr,1fr]">
          <div className="relative h-full min-h-[240px] bg-slate-100">
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                No thumbnail provided
              </div>
            )}
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{course.modules?.length || 0} modules</Badge>
              <Badge variant="outline">
                Instructor: {course.instructor.firstName} {course.instructor.lastName}
              </Badge>
            </div>
            <CardTitle className="text-2xl">{course.title}</CardTitle>
            <CardDescription className="text-base text-slate-700">
              {course.description}
            </CardDescription>
            <div className="flex flex-wrap gap-3">
              {user?.role === 'student' && !isEnrolled && (
                <Button onClick={handleEnroll} disabled={enrolling}>
                  {enrolling ? 'Enrolling...' : 'Enroll in Course'}
                </Button>
              )}
              {isEnrolled && (
                <Button variant="outline" asChild>
                  <Link to="/dashboard">Go to My Courses</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Course Modules</CardTitle>
          <CardDescription>Select a module to view its content.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedModules.length === 0 ? (
            <p className="text-slate-600">No modules available yet.</p>
          ) : (
            <div className="space-y-3">
              {sortedModules.map((module, index) => {
                const isCompleted = enrollment?.progress?.some(
                  (p) => p.moduleId === module.id && p.isCompleted
                );

                return (
                  <button
                    key={module.id}
                    onClick={() => handleModuleClick(module)}
                    className={`w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-primary hover:shadow-md ${isCompleted ? 'bg-emerald-50 border-emerald-200' : ''} ${isEnrolled || user?.role === 'instructor' ? '' : 'cursor-not-allowed opacity-70'}`}
                    disabled={!(isEnrolled || user?.role === 'instructor')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                          {isCompleted ? '✓' : index + 1}
                        </span>
                        <div>
                          <p className="text-base font-semibold text-slate-900">
                            {module.title}{' '}
                            {isCompleted && (
                              <Badge variant="success" className="ml-2">
                                Completed
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            {module.type.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      {(isEnrolled || user?.role === 'instructor') && (
                        <span className="text-sm text-primary">
                          {module.type === 'video' && '▶ Watch'}
                          {module.type === 'pdf' && '📄 Open'}
                          {module.type === 'text' && '📖 Read'}
                        </span>
                      )}
                    </div>
                    {module.content && module.type === 'text' && (
                      <p className="mt-2 max-h-14 overflow-hidden text-sm text-slate-600">
                        {module.content}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {showModuleViewer && selectedModule && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4" onClick={closeModuleViewer}>
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-200"
              onClick={closeModuleViewer}
            >
              ✕
            </button>
            <div className="space-y-4 p-6">
              <h2 className="text-xl font-semibold text-slate-900">{selectedModule.title}</h2>

              {selectedModule.type === 'video' && selectedModule.videoUrl && (
                <div className="space-y-3">
                  <div className="aspect-video w-full overflow-hidden rounded-lg border border-slate-200 shadow-sm min-h-[360px] md:min-h-[480px]">
                    <iframe
                      src={convertToEmbedUrl(selectedModule.videoUrl)}
                      title={selectedModule.title}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <Button variant="outline" asChild>
                    <a
                      href={selectedModule.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open Video in New Tab
                    </a>
                  </Button>
                </div>
              )}

              {selectedModule.type === 'pdf' && selectedModule.pdfUrl && (
                <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm text-amber-800">
                    PDF files now open in a new tab for a consistent viewer experience.
                  </p>
                  <Button onClick={() => window.open(selectedModule.pdfUrl, '_blank')}>
                    Open PDF in New Tab
                  </Button>
                </div>
              )}

              {selectedModule.type === 'text' && selectedModule.content && (
                <div className="space-y-3 text-slate-800">
                  {selectedModule.content.split('\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {(isEnrolled || user?.role === 'instructor') && (
        <QuestionsSection courseId={id || ''} />
      )}
    </div>
  );
};

export default CourseDetail;

