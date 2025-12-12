# Learning Management System (LMS)

A full-stack Learning Management System built with React + Vite (frontend), NestJS (backend), and PostgreSQL with TypeORM.

## Features

### Core Features
- **User Authentication**: JWT-based authentication with role-based access control (Student/Instructor)
- **Password Security**: 
  - Eye icon toggle for password visibility
  - Strong password validation (requires uppercase, lowercase, number, and underscore)
  - Real-time password requirement indicators
- **Course Management**: Instructors can create, edit, and manage courses with modules
- **Course Enrollment**: Students can browse and enroll in published courses
- **Progress Tracking**: Automatic progress tracking when students view modules with visual completion indicators
- **Dashboard**: Personalized dashboards for students and instructors

### Content Features
- **Video Support**: 
  - YouTube video embedding with automatic URL conversion
  - Large, responsive video player (minimum 500px height)
  - Support for YouTube watch URLs, short URLs, and embed URLs
  - Video file upload support
- **PDF Support**: 
  - Embedded PDF viewer in same tab
  - Option to open PDFs in new tab
  - PDF file upload support
- **Text Content**: Formatted text content viewer with proper styling

### Course Discovery
- **Search Functionality**: Real-time search across course titles, descriptions, and instructors
- **Filtering**: Filter courses by instructor
- **Pagination**: Browse courses with pagination (9 courses per page)
- **Smart Messaging**: "No courses found" message when search/filter returns no results

### Interactive Features
- **Question & Answer System**: 
  - Students can ask questions on course pages
  - Instructors can answer questions
  - Questions and answers displayed with timestamps
- **File Upload**: Support for uploading images, videos, and PDFs when creating course modules

### UI/UX
- **Modern Learning Theme**: Pleasant blue and green color scheme optimized for learning
- **Performance Optimized**: Reduced animations for faster page loads
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Visual Progress Indicators**: Completion badges and progress bars

## Tech Stack

### Frontend
- React 18
- Vite
- TypeScript
- React Router
- Axios

### Backend
- NestJS
- TypeORM
- PostgreSQL
- JWT Authentication
- Passport.js
- Class Validator

## Project Structure

```
LearningMgmtSystem/
├── backend/          # NestJS backend
│   ├── src/
│   │   ├── auth/     # Authentication module
│   │   ├── courses/  # Course management
│   │   ├── enrollments/ # Enrollment management
│   │   ├── progress/ # Progress tracking
│   │   ├── entities/ # TypeORM entities
│   │   └── config/   # Configuration files
│   └── package.json
├── frontend/         # React frontend
│   ├── src/
│   │   ├── pages/    # Page components
│   │   ├── components/ # Reusable components
│   │   ├── services/ # API services
│   │   └── contexts/ # React contexts
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=lms_db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

4. Create the PostgreSQL database:
```bash
createdb lms_db
```

5. Start the backend server:
```bash
npm run start:dev
```

The backend will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory (optional):
```env
VITE_API_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get current user profile

### Courses
- `GET /courses` - Get all courses (published only with `?published=true`)
- `GET /courses/:id` - Get course by ID
- `POST /courses` - Create course (Instructor only)
- `PATCH /courses/:id` - Update course (Instructor only)
- `DELETE /courses/:id` - Delete course (Instructor only)
- `POST /courses/:id/modules` - Add module to course (Instructor only)
- `PATCH /courses/modules/:moduleId` - Update module (Instructor only)
- `DELETE /courses/modules/:moduleId` - Delete module (Instructor only)

### Enrollments
- `POST /enrollments/courses/:courseId` - Enroll in a course
- `GET /enrollments/my-courses` - Get user's enrollments
- `GET /enrollments/:id/progress` - Get enrollment progress

### Progress
- `PATCH /progress/:enrollmentId/modules/:moduleId` - Update module progress
- `GET /progress/:enrollmentId/modules/:moduleId` - Get module progress

## User Roles

### Student
- Browse published courses
- Enroll in courses
- Track learning progress
- View dashboard with enrolled courses

### Instructor
- Create and manage courses
- Add modules to courses
- Publish/unpublish courses
- View all courses (published and unpublished)

## Database Schema

- **Users**: User accounts with roles
- **Courses**: Course information
- **Modules**: Course content modules (text, video, PDF)
- **Enrollments**: Student course enrollments
- **Progress**: Learning progress tracking

## Development

### Backend Development
- The backend uses TypeORM with automatic schema synchronization in development
- Guards and decorators handle authentication and authorization
- DTOs validate incoming requests

### Frontend Development
- React Router handles client-side routing
- Context API manages authentication state
- Axios interceptors handle token management

## Production Deployment

1. Set `NODE_ENV=production` in backend `.env`
2. Disable TypeORM `synchronize` in production (use migrations)
3. Set a strong `JWT_SECRET`
4. Configure CORS properly
5. Build frontend: `npm run build`
6. Serve frontend build with a web server (nginx, etc.)
