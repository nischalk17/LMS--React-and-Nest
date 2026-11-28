import { Link } from 'react-router-dom';

/**
 * Wordmark. The mark is a stack trace: frames that get shorter and end at the
 * point where it went wrong (the coral dot). Matches public/favicon.svg.
 */
const Logo = ({ to = '/dashboard', className = '' }: { to?: string; className?: string }) => (
  <Link
    to={to}
    className={`inline-flex items-center gap-2 font-heading text-lg font-bold tracking-tight ${className}`}
    aria-label="Traceback LMS home"
  >
    <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="currentColor" opacity="0.18" />
      <path d="M8 9h16M8 16h11M8 23h6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="23" cy="23" r="3" fill="rgb(var(--primary))" />
    </svg>
    <span>
      Traceback <span className="text-[0.7em] font-semibold uppercase tracking-widest opacity-70">LMS</span>
    </span>
  </Link>
);

export default Logo;
