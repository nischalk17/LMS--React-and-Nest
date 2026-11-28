import { MoonStar, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = ({ onDark = false }: { onDark?: boolean }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={
        onDark
          ? 'rounded-full border border-nav-foreground/30 text-nav-foreground hover:bg-nav-foreground/10'
          : 'rounded-full border border-border bg-card hover:bg-muted'
      }
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? <Sun className="h-5 w-5" aria-hidden="true" /> : <MoonStar className="h-5 w-5" aria-hidden="true" />}
    </Button>
  );
};

export default ThemeToggle;


