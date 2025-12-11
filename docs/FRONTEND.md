# Frontend Documentation

## Overview

The frontend is built with React 18 and Vite, providing a fast development experience and optimized production builds. It uses TypeScript for type safety and React Router for client-side routing.

## Architecture

### Project Structure

```
frontend/
├── src/
│   ├── pages/          # Page components
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── CourseCatalog.tsx
│   │   ├── CourseDetail.tsx
│   │   ├── InstructorCourses.tsx
│   │   ├── CreateCourse.tsx
│   │   └── EditCourse.tsx
│   ├── components/     # Reusable components
│   │   └── Layout.tsx
│   ├── services/       # API service layer
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── courseService.ts
│   │   └── enrollmentService.ts
│   ├── contexts/       # React contexts
│   │   └── AuthContext.tsx
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── index.html
└── package.json
```

## Core Concepts

### 1. Authentication Context

The `AuthContext` provides global authentication state:

```typescript
const { user, login, register, logout } = useAuth();
```

**Features:**
- Stores user information
- Manages JWT token in localStorage
- Provides login/register/logout functions
- Auto-loads user on app start

### 2. API Service Layer

Services abstract API calls:

- **api.ts**: Axios instance with interceptors
- **authService.ts**: Authentication endpoints
- **courseService.ts**: Course management
- **enrollmentService.ts**: Enrollment operations

**Axios Interceptors:**
- Request interceptor: Adds JWT token to headers
- Response interceptor: Handles 401 errors (auto-logout)

### 3. Routing

React Router handles navigation:

- **Public Routes**: `/login`, `/register`
- **Protected Routes**: All other routes require authentication
- **Role-Based Routes**: Instructor routes check user role

**Route Guards:**
- `PrivateRoute`: Requires authentication
- `InstructorRoute`: Requires instructor role

### 4. Pages

#### Login Page
- Email/password form
- Redirects to dashboard on success
- Error handling

#### Register Page
- User registration form
- Role selection (student/instructor)
- Password validation

#### Dashboard
- **Student View**: Shows enrolled courses with progress
- **Instructor View**: Quick access to course management

#### Course Catalog
- Lists all published courses
- Course cards with thumbnails
- Link to course details

#### Course Detail
- Full course information
- Module list
- Enrollment button (students only)
- Redirects enrolled students to dashboard

#### Instructor Courses
- Lists all courses (published and draft)
- Create/edit/delete actions
- Status indicators

#### Create/Edit Course
- Course form (title, description, thumbnail)
- Module management
- Publish/unpublish toggle

## State Management

### Local State
- Component-level state with `useState`
- Form data management
- Loading and error states

### Global State
- Authentication state via Context API
- No external state management library needed

## API Integration

### Making API Calls

```typescript
import { courseService } from '../services/courseService';

// Get all courses
const courses = await courseService.getAll(true);

// Create course
const newCourse = await courseService.create({
  title: 'New Course',
  description: 'Description',
});
```

### Error Handling

```typescript
try {
  await courseService.create(data);
} catch (error: any) {
  const message = error.response?.data?.message || 'Error occurred';
  // Handle error
}
```

## Styling

- CSS modules for component-specific styles
- Global styles in `index.css`
- Responsive design with CSS Grid and Flexbox
- Modern UI with gradients and shadows

## TypeScript

Type definitions for:
- API responses
- User objects
- Course and module structures
- Service function parameters

## Development

### Running the App

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Key Features

### 1. Token Management
- Stored in localStorage
- Automatically added to API requests
- Cleared on logout or 401 error

### 2. Protected Routes
- Redirects to login if not authenticated
- Role-based route protection

### 3. Real-time Updates
- Dashboard updates after enrollment
- Course list refreshes after changes

### 4. Responsive Design
- Mobile-friendly layouts
- Adaptive navigation

## Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:3000
```

## Best Practices

1. **Error Handling**: Always wrap API calls in try-catch
2. **Loading States**: Show loading indicators during async operations
3. **Form Validation**: Validate inputs before submission
4. **Type Safety**: Use TypeScript types for all data
5. **Component Reusability**: Extract common UI patterns

## Future Enhancements

- Add React Query for better data fetching
- Implement optimistic updates
- Add toast notifications
- Implement search and filtering
- Add pagination for course lists
- Implement file upload for thumbnails
- Add rich text editor for course descriptions

