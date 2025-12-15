import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/courses', label: 'Courses' },
    ...(user?.role === 'instructor'
      ? [{ to: '/instructor/courses', label: 'My Courses' }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            LMS
          </Link>
          <div className="flex items-center gap-6">
            {navLinks.map((item) => {
              const isActive = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`text-sm font-medium transition-colors ${isActive ? 'text-primary' : 'text-slate-600 hover:text-primary'}`}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="flex items-center gap-3 rounded-full bg-slate-100 px-3 py-1 text-sm">
              <span className="font-medium text-slate-700">
                {user?.firstName} {user?.lastName}
              </span>
              <Button size="sm" variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="container py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

