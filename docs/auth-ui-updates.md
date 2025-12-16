# Auth UI & Theme Enhancements

## What we built
- Added light/dark mode toggle that preserves the existing color palette while introducing dark-friendly surfaces.
- Improved login and registration UX with interactive cards, animated backgrounds, and clearer error handling.
- Strengthened password rules (min 8 chars, 1 uppercase, 1 number, 1 special symbol) plus real-time strength meter.
- Reworked register form layout (first/last name row, then email, password, role).

## Tech + concepts used
- **React + TypeScript** for UI logic and form control.
- **react-hook-form + zod** for schema-based validation and instant feedback.
- **Tailwind CSS** with CSS variables and `dark` class for theming; glassmorphism accents via utility classes.
- **Redux Toolkit** auth slice to surface server errors on login/register.
- **LocalStorage + matchMedia** to persist theme choice and respect OS preference.

## Code map
- Theme provider & toggle: `frontend/src/contexts/ThemeContext.tsx`, `frontend/src/components/ThemeToggle.tsx`, wiring in `frontend/src/main.tsx`.
- Global tokens & glass effect: `frontend/src/index.css`.
- Shared password strength helpers: `frontend/src/utils/passwordStrength.ts`.
- Login UI (strength meter, animated background, bottom error): `frontend/src/pages/Login.tsx`.
- Register UI (layout changes, validation rules, strength meter): `frontend/src/pages/Register.tsx`.
- Dark-ready UI primitives: `frontend/src/components/ui/{button,input,select,card}.tsx`.
- App-wide toggle placement: `frontend/src/components/Layout.tsx`.

## Workflow (how it works)
1. **Theme flow**: `ThemeProvider` reads saved theme or OS preference → sets `document.documentElement` class (`light`/`dark`) → Tailwind + CSS variables swap palettes. `ThemeToggle` flips the state and persists to `localStorage`.
2. **Password strength**: `evaluatePasswordStrength` scores length + uppercase + number + special char → returns label/color → Login/Register pages display meter + label live via `form.watch('password')`.
3. **Validation**: `zod` schema in `Register.tsx` enforces the 8-char/uppercase/number/special rules. Errors surface inline via `FormMessage`.
4. **Error messaging**: Auth failures populate `error` in the Redux slice; Login and Register render a bottom-aligned alert while keeping other functionality intact.
5. **Layout tweaks**: Register form rows follow the requested order; cards use glass styling and subtle lift on hover for interactivity; navigation includes theme toggle for authenticated views.

## Demo tips
- Toggle light/dark from the top-right on login/register or from the app navbar.
- Type into the password field to show Weak/Strong/Very Strong meter live.
- Submit invalid credentials on Login to see the bottom error banner.
- Point to the code paths above when asked about implementation details.


