import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';

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
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <nav className="sticky top-0 z-30 bg-nav text-nav-foreground">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-6">
            {navLinks.map((item) => {
              const isActive = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={isActive ? 'page' : undefined}
                  className={`border-b-2 py-1 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-primary text-nav-foreground'
                      : 'border-transparent text-nav-foreground/75 hover:text-nav-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <ThemeToggle onDark />
            <div className="flex items-center gap-3 rounded-full bg-nav-foreground/10 px-3 py-1 text-sm">
              <span className="font-medium text-nav-foreground">
                {user?.firstName} {user?.lastName}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="border-nav-foreground/40 text-nav-foreground hover:bg-nav-foreground/10"
                onClick={handleLogout}
              >
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

