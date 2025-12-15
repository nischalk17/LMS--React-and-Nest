import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CourseCatalog from './pages/CourseCatalog';
import CourseDetail from './pages/CourseDetail';
import InstructorCourses from './pages/InstructorCourses';
import CreateCourse from './pages/CreateCourse';
import EditCourse from './pages/EditCourse';
import Layout from './components/Layout';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function InstructorRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (user.role !== 'instructor') {
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="courses" element={<CourseCatalog />} />
          <Route path="courses/:id" element={<CourseDetail />} />
          <Route
            path="instructor/courses"
            element={
              <InstructorRoute>
                <InstructorCourses />
              </InstructorRoute>
            }
          />
          <Route
            path="instructor/courses/create"
            element={
              <InstructorRoute>
                <CreateCourse />
              </InstructorRoute>
            }
          />
          <Route
            path="instructor/courses/:id/edit"
            element={
              <InstructorRoute>
                <EditCourse />
              </InstructorRoute>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

