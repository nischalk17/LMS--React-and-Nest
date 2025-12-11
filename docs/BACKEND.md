# Backend Documentation

## Overview

The backend is built with NestJS, a progressive Node.js framework for building efficient and scalable server-side applications. It uses TypeORM for database management and PostgreSQL as the database.

## Architecture

### Module Structure

The backend follows NestJS modular architecture:

- **AuthModule**: Handles authentication and authorization
- **CoursesModule**: Manages course CRUD operations
- **EnrollmentsModule**: Handles student enrollments
- **ProgressModule**: Tracks learning progress

### Core Concepts

#### 1. Entities (Database Models)

Entities are TypeORM classes that represent database tables:

- **User Entity**: Stores user information with roles (student/instructor)
- **Course Entity**: Course data linked to instructors
- **Module Entity**: Course content (text, video, PDF)
- **Enrollment Entity**: Student-course relationships
- **Progress Entity**: Tracks module completion

#### 2. DTOs (Data Transfer Objects)

DTOs validate and structure incoming data:

- `RegisterDto`: User registration data
- `LoginDto`: Login credentials
- `CreateCourseDto`: Course creation data
- `CreateModuleDto`: Module creation data

#### 3. Guards

Guards control access to routes:

- **JwtAuthGuard**: Validates JWT tokens
- **RolesGuard**: Enforces role-based access control

#### 4. Decorators

Custom decorators add metadata:

- `@Public()`: Marks routes as public (no auth required)
- `@Roles()`: Specifies required roles for routes

#### 5. Services

Services contain business logic:

- **AuthService**: Authentication and user management
- **CoursesService**: Course operations
- **EnrollmentsService**: Enrollment management
- **ProgressService**: Progress tracking

## Authentication Flow

1. User registers/logs in via `/auth/register` or `/auth/login`
2. Backend validates credentials and returns JWT token
3. Frontend stores token and includes it in Authorization header
4. JwtAuthGuard validates token on protected routes
5. RolesGuard checks user role for role-specific routes

## Database Relationships

```
User (1) ──< (Many) Course
User (1) ──< (Many) Enrollment
Course (1) ──< (Many) Module
Course (1) ──< (Many) Enrollment
Enrollment (1) ──< (Many) Progress
Module (1) ──< (Many) Progress
```

## API Endpoints

### Authentication Endpoints

#### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student" // optional, defaults to "student"
}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student",
  "accessToken": "jwt-token"
}
```

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** Same as register

#### GET /auth/profile
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student"
}
```

### Course Endpoints

#### GET /courses
Get all courses. Use `?published=true` to get only published courses.

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Course Title",
    "description": "Course description",
    "thumbnail": "url",
    "isPublished": true,
    "instructor": { ... },
    "modules": [ ... ]
  }
]
```

#### GET /courses/:id
Get a specific course by ID.

#### POST /courses
Create a new course (Instructor only).

**Request Body:**
```json
{
  "title": "Course Title",
  "description": "Course description",
  "thumbnail": "url",
  "isPublished": false
}
```

#### PATCH /courses/:id
Update a course (Instructor only, must own the course).

#### DELETE /courses/:id
Delete a course (Instructor only, must own the course).

#### POST /courses/:id/modules
Add a module to a course (Instructor only).

**Request Body:**
```json
{
  "title": "Module Title",
  "content": "Text content",
  "type": "text", // "text" | "video" | "pdf"
  "videoUrl": "url", // for video type
  "pdfUrl": "url", // for pdf type
  "order": 0
}
```

### Enrollment Endpoints

#### POST /enrollments/courses/:courseId
Enroll in a course (Student only).

#### GET /enrollments/my-courses
Get all enrollments for the current user.

#### GET /enrollments/:id/progress
Get progress for a specific enrollment.

**Response:**
```json
{
  "enrollment": { ... },
  "overallProgress": 75,
  "completedModules": 3,
  "totalModules": 4
}
```

### Progress Endpoints

#### PATCH /progress/:enrollmentId/modules/:moduleId
Update progress for a module.

**Request Body:**
```json
{
  "completionPercentage": 100
}
```

## Security

1. **Password Hashing**: Passwords are hashed using bcrypt (10 rounds)
2. **JWT Tokens**: Tokens expire after 7 days
3. **Role-Based Access**: Routes protected by role guards
4. **Input Validation**: DTOs validate all incoming data
5. **CORS**: Configured to allow frontend origin

## Error Handling

The backend uses NestJS exception filters:

- `NotFoundException`: Resource not found
- `UnauthorizedException`: Authentication failed
- `ForbiddenException`: Insufficient permissions
- `ConflictException`: Duplicate resource (e.g., email already exists)

## Environment Variables

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=lms_db
JWT_SECRET=your-secret-key
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## TypeORM Configuration

TypeORM is configured to:
- Auto-synchronize schema in development
- Use PostgreSQL database
- Load entities from `src/**/*.entity.ts`
- Enable logging in development

## Testing

Run tests:
```bash
npm run test
npm run test:e2e
```

## Deployment Considerations

1. Set `NODE_ENV=production`
2. Disable `synchronize` in TypeORM config (use migrations)
3. Use strong `JWT_SECRET`
4. Configure proper CORS origins
5. Use environment variables for all sensitive data
6. Enable HTTPS in production

