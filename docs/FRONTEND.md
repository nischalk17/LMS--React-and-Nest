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
- Eye icon toggle for password visibility
- Redirects to dashboard on success
- Error handling

#### Register Page
- User registration form
- Role selection (student/instructor)
- **Advanced Password Validation**:
  - Requires uppercase letter
  - Requires lowercase letter
  - Requires number
  - Requires underscore
  - Real-time validation feedback with visual indicators
- Eye icon toggle for password visibility

#### Dashboard
- **Student View**: 
  - Shows enrolled courses with progress bars
  - Progress percentage display
  - "Continue Learning" buttons
  - Visual progress indicators
- **Instructor View**: Quick access to course management

#### Course Catalog
- Lists all published courses with pagination (9 per page)
- **Search Bar**: Real-time search across titles, descriptions, and instructors
- **Instructor Filter**: Dropdown to filter courses by instructor
- Course cards with thumbnails
- Link to course details
- "No courses found" message when search/filter returns no results

#### Course Detail
- Full course information
- Module list with completion indicators
- **Module Viewer**: 
  - Large video player (500px+ height) with YouTube URL conversion
  - Embedded PDF viewer with same-tab viewing
  - Text content viewer with formatted display
  - "Open in New Tab" options for videos and PDFs
- **Progress Tracking**: Automatically marks modules as completed when viewed
- **Question & Answer Section**: 
  - Students can ask questions
  - Instructors can answer questions
  - Displays all Q&A with timestamps
- Enrollment button (students only)
- Visual completion badges for completed modules

#### Instructor Courses
- Lists all courses (published and draft)
- Create/edit/delete actions
- Status indicators

#### Create/Edit Course
- Course form (title, description, thumbnail)
- **Module Management**:
  - Add modules with types: Text, Video, PDF
  - **File Upload Support**: Upload video and PDF files directly
  - URL input for external resources (YouTube, PDF links)
  - Module ordering and deletion
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
- **Learning Theme Colors**:
  - Primary Blue: `#4a90e2` (knowledge, trust)
  - Secondary Green: `#5a9` (growth, learning)
  - Clean backgrounds: `#f0f4f8`
- Performance-optimized with minimal animations
- Smooth transitions (0.2s) for better performance

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

## New Features Implemented

### Video & Content Viewing
- **YouTube Integration**: Automatic URL conversion to embed format
- **Large Video Player**: Minimum 500px height for better viewing experience
- **PDF Viewer**: Embedded viewer with same-tab and new-tab options
- **File Upload**: Support for uploading videos and PDFs

### Course Discovery
- **Search**: Real-time search functionality
- **Filtering**: Filter by instructor
- **Pagination**: 9 courses per page with navigation

### Progress Tracking
- **Automatic Tracking**: Progress updated when students view modules
- **Visual Indicators**: Completion badges and checkmarks
- **Progress Bars**: Visual progress representation on dashboard

### Question & Answer
- **Student Questions**: Students can ask questions on course pages
- **Instructor Answers**: Instructors can respond to questions
- **Q&A Display**: All questions and answers shown with timestamps

### Security & UX
- **Password Validation**: Strong password requirements with real-time feedback
- **Password Visibility**: Eye icon toggle for password fields
- **Performance**: Reduced animations for faster page loads

## Future Enhancements

- Add React Query for better data fetching
- Implement optimistic updates
- Add toast notifications
- Implement file upload backend integration
- Add rich text editor for course descriptions
- Add video playback progress tracking
- Implement course ratings and reviews

