import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService, Course, CreateModuleDto } from '../services/courseService';
import './CourseForm.css';

const EditCourse = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail: '',
    isPublished: false,
  });
  const [moduleForm, setModuleForm] = useState<CreateModuleDto>({
    title: '',
    content: '',
    type: 'text' as const,
    videoUrl: '',
    pdfUrl: '',
    order: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        if (id) {
          const data = await courseService.getById(id);
          setCourse(data);
          setFormData({
            title: data.title,
            description: data.description,
            thumbnail: data.thumbnail || '',
            isPublished: data.isPublished,
          });
        }
      } catch (error) {
        console.error('Failed to fetch course:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (id) {
        await courseService.update(id, formData);
        alert('Course updated successfully!');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      const maxOrder = Math.max(
        ...(course?.modules?.map((m) => m.order) || [0]),
        -1
      );
      const newModule = await courseService.addModule(id, {
        ...moduleForm,
        order: maxOrder + 1,
      });
      if (course) {
        setCourse({
          ...course,
          modules: [...(course.modules || []), newModule],
        });
      }
      setModuleForm({
        title: '',
        content: '',
        type: 'text',
        videoUrl: '',
        pdfUrl: '',
        order: 0,
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add module');
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!window.confirm('Are you sure you want to delete this module?')) {
      return;
    }

    try {
      await courseService.deleteModule(moduleId);
      if (course) {
        setCourse({
          ...course,
          modules: course.modules?.filter((m) => m.id !== moduleId) || [],
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete module');
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
    <div className="course-form-container">
      <div className="course-form">
        <h1>Edit Course</h1>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Course Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
              rows={5}
            />
          </div>
          <div className="form-group">
            <label>Thumbnail URL</label>
            <input
              type="url"
              value={formData.thumbnail}
              onChange={(e) =>
                setFormData({ ...formData, thumbnail: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) =>
                  setFormData({ ...formData, isPublished: e.target.checked })
                }
              />
              Published
            </label>
          </div>
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/instructor/courses')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        <div className="modules-section">
          <h2>Course Modules</h2>
          <form onSubmit={handleAddModule} className="module-form">
            <div className="form-row">
              <div className="form-group">
                <label>Module Title *</label>
                <input
                  type="text"
                  value={moduleForm.title}
                  onChange={(e) =>
                    setModuleForm({ ...moduleForm, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Type *</label>
                <select
                  value={moduleForm.type}
                  onChange={(e) =>
                    setModuleForm({
                      ...moduleForm,
                      type: e.target.value as 'text' | 'video' | 'pdf',
                    })
                  }
                  required
                >
                  <option value="text">Text</option>
                  <option value="video">Video</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
            </div>
            {moduleForm.type === 'text' && (
              <div className="form-group">
                <label>Content</label>
                <textarea
                  value={moduleForm.content}
                  onChange={(e) =>
                    setModuleForm({ ...moduleForm, content: e.target.value })
                  }
                  rows={4}
                />
              </div>
            )}
            {moduleForm.type === 'video' && (
              <div className="form-group">
                <label>Video URL or Upload File</label>
                <input
                  type="url"
                  value={moduleForm.videoUrl}
                  onChange={(e) =>
                    setModuleForm({ ...moduleForm, videoUrl: e.target.value })
                  }
                  placeholder="Enter YouTube URL or video URL"
                />
                <div className="file-upload-section">
                  <input
                    type="file"
                    id="video-upload"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // For now, we'll use a data URL or you can integrate with a file upload service
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          // In production, upload to server and get URL
                          // For now, using object URL
                          const objectUrl = URL.createObjectURL(file);
                          setModuleForm({ ...moduleForm, videoUrl: objectUrl });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="video-upload" className="file-upload-btn">
                    📹 Upload Video File
                  </label>
                </div>
              </div>
            )}
            {moduleForm.type === 'pdf' && (
              <div className="form-group">
                <label>PDF URL or Upload File</label>
                <input
                  type="url"
                  value={moduleForm.pdfUrl}
                  onChange={(e) =>
                    setModuleForm({ ...moduleForm, pdfUrl: e.target.value })
                  }
                  placeholder="Enter PDF URL"
                />
                <div className="file-upload-section">
                  <input
                    type="file"
                    id="pdf-upload"
                    accept="application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const objectUrl = URL.createObjectURL(file);
                        setModuleForm({ ...moduleForm, pdfUrl: objectUrl });
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="pdf-upload" className="file-upload-btn">
                    📄 Upload PDF File
                  </label>
                </div>
              </div>
            )}
            <button type="submit" className="btn-primary">
              Add Module
            </button>
          </form>

          <div className="modules-list">
            {sortedModules.length === 0 ? (
              <p>No modules yet. Add your first module above.</p>
            ) : (
              sortedModules.map((module, index) => (
                <div key={module.id} className="module-item">
                  <div className="module-header">
                    <span className="module-number">{index + 1}</span>
                    <h4>{module.title}</h4>
                    <span className="module-type">{module.type}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteModule(module.id)}
                    className="btn-danger btn-small"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCourse;

