type PasswordStrength = {
  label: 'Weak' | 'Strong' | 'Very Strong';
  score: number;
  colorClass: string;
  barClass: string;
};

const checks = [
  (value: string) => value.length >= 8,
  (value: string) => /[A-Z]/.test(value),
  (value: string) => /[0-9]/.test(value),
  (value: string) => /[^A-Za-z0-9]/.test(value),
];

export const evaluatePasswordStrength = (value: string): PasswordStrength => {
  const score = checks.reduce((acc, test) => acc + (test(value) ? 1 : 0), 0);

  if (score >= 4) {
    return {
      label: 'Very Strong',
      score,
      colorClass: 'text-emerald-500',
      barClass: 'bg-emerald-500',
    };
  }

  if (score >= 2) {
    return {
      label: 'Strong',
      score,
      colorClass: 'text-amber-500',
      barClass: 'bg-amber-500',
    };
  }

  return {
    label: 'Weak',
    score,
    colorClass: 'text-rose-500',
    barClass: 'bg-rose-500',
  };
};

export const PASSWORD_REQUIREMENTS = [
  'At least 8 characters long',
  'At least one uppercase letter',
  'At least one number',
  'At least one special symbol',
];


