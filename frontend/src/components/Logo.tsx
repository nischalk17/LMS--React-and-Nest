import { Link } from 'react-router-dom';

/** Wordmark: an "L" bracket with a coral dot, matching public/favicon.svg. */
const Logo = ({ to = '/dashboard', className = '' }: { to?: string; className?: string }) => (
  <Link
    to={to}
    className={`inline-flex items-center gap-2 font-heading text-lg font-bold tracking-tight ${className}`}
    aria-label="LMS home"
  >
    <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="currentColor" opacity="0.18" />
      <path
        d="M9 9v14h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22.5" cy="21.5" r="3" fill="rgb(var(--primary))" />
    </svg>
    LMS
  </Link>
);

export default Logo;
