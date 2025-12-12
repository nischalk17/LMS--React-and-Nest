import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { courseService, Course, Module } from '../services/courseService';
import { enrollmentService, Enrollment } from '../services/enrollmentService';
import { convertToEmbedUrl } from '../utils/videoUtils';
import QuestionsSection from '../components/QuestionsSection';
import './CourseDetail.css';

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
          
          // Check if user is enrolled and get enrollment details
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
    return <div>Loading...</div>;
  }

  if (!course) {
    return <div>Course not found</div>;
  }

  const handleModuleClick = async (module: Module) => {
    if (isEnrolled || user?.role === 'instructor') {
      setSelectedModule(module);
      setShowModuleViewer(true);
      
      // Update progress when student views a module
      if (isEnrolled && enrollment && user?.role === 'student') {
        try {
          await enrollmentService.updateProgress(
            enrollment.id,
            module.id,
            100 // Mark as 100% complete when viewed
          );
          // Refresh enrollment to get updated progress
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
            {sortedModules.map((module, index) => {
              const isCompleted = enrollment?.progress?.some(
                (p) => p.moduleId === module.id && p.isCompleted
              );
              
              return (
                <div 
                  key={module.id} 
                  className={`module-item ${(isEnrolled || user?.role === 'instructor') ? 'clickable' : ''} ${isCompleted ? 'completed' : ''}`}
                  onClick={() => handleModuleClick(module)}
                >
                  <div className={`module-number ${isCompleted ? 'completed' : ''}`}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <div className="module-content">
                    <h3>
                      {module.title}
                      {isCompleted && <span className="completed-badge">Completed</span>}
                    </h3>
                    <p className="module-type">
                      <span className={`module-type-badge module-type-${module.type}`}>
                        {module.type.toUpperCase()}
                      </span>
                    </p>
                    {module.content && module.type === 'text' && (
                      <p className="module-preview">{module.content.substring(0, 150)}...</p>
                    )}
                    {(isEnrolled || user?.role === 'instructor') && (
                      <button className="module-view-btn">
                        {module.type === 'video' && '▶ Watch Video'}
                        {module.type === 'pdf' && '📄 View PDF'}
                        {module.type === 'text' && '📖 Read Content'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModuleViewer && selectedModule && (
        <div className="module-viewer-overlay" onClick={closeModuleViewer}>
          <div className="module-viewer-content" onClick={(e) => e.stopPropagation()}>
            <button className="module-viewer-close" onClick={closeModuleViewer}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <h2 className="module-viewer-title">{selectedModule.title}</h2>
            
            {selectedModule.type === 'video' && selectedModule.videoUrl && (
              <div className="module-viewer-video">
                <iframe
                  src={convertToEmbedUrl(selectedModule.videoUrl)}
                  title={selectedModule.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
                <a 
                  href={selectedModule.videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="module-viewer-download"
                >
                  Open Video in New Tab
                </a>
              </div>
            )}

            {selectedModule.type === 'pdf' && selectedModule.pdfUrl && (
              <div className="module-viewer-pdf">
                <iframe
                  src={`${selectedModule.pdfUrl}#toolbar=0`}
                  title={selectedModule.title}
                  style={{ width: '100%', height: '600px', border: 'none' }}
                ></iframe>
                <div className="module-viewer-pdf-actions">
                  <button
                    onClick={() => window.open(selectedModule.pdfUrl, '_blank')}
                    className="module-viewer-download"
                  >
                    Open PDF in New Tab
                  </button>
                </div>
              </div>
            )}

            {selectedModule.type === 'text' && selectedModule.content && (
              <div className="module-viewer-text">
                <div className="module-text-content">
                  {selectedModule.content.split('\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </div>
            )}
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

