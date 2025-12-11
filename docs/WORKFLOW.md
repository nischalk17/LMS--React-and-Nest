# Overall Project Workflow

## System Architecture

```
┌─────────────┐         HTTP/REST API         ┌─────────────┐
│   React     │ ◄──────────────────────────► │   NestJS    │
│  Frontend   │         (Axios + JWT)         │   Backend   │
│   (Vite)    │                                │             │
└─────────────┘                                └──────┬──────┘
                                                     │
                                                     │ TypeORM
                                                     │
                                              ┌──────▼──────┐
                                              │  PostgreSQL │
                                              │  Database   │
                                              └─────────────┘
```

## User Flows

### 1. Authentication Flow

```
User Registration/Login
    │
    ├─► Frontend: Submit credentials
    │
    ├─► Backend: Validate & hash password
    │
    ├─► Backend: Generate JWT token
    │
    ├─► Frontend: Store token in localStorage
    │
    └─► Frontend: Redirect to dashboard
```

### 2. Student Course Enrollment Flow

```
Student browses catalog
    │
    ├─► Frontend: GET /courses?published=true
    │
    ├─► Backend: Query published courses
    │
    ├─► Frontend: Display course cards
    │
    ├─► Student clicks "Enroll"
    │
    ├─► Frontend: POST /enrollments/courses/:id
    │
    ├─► Backend: Create enrollment record
    │
    ├─► Backend: Initialize progress for all modules
    │
    └─► Frontend: Redirect to dashboard
```

### 3. Instructor Course Creation Flow

```
Instructor creates course
    │
    ├─► Frontend: POST /courses (with JWT)
    │
    ├─► Backend: JwtAuthGuard validates token
    │
    ├─► Backend: RolesGuard checks instructor role
    │
    ├─► Backend: Create course with instructorId
    │
    ├─► Frontend: Redirect to edit page
    │
    ├─► Instructor adds modules
    │
    ├─► Frontend: POST /courses/:id/modules
    │
    ├─► Backend: Create module linked to course
    │
    └─► Instructor publishes course
```

### 4. Progress Tracking Flow

```
Student views course
    │
    ├─► Frontend: GET /courses/:id
    │
    ├─► Frontend: GET /enrollments/my-courses
    │
    ├─► Frontend: Display modules with progress
    │
    ├─► Student completes module
    │
    ├─► Frontend: PATCH /progress/:enrollmentId/modules/:moduleId
    │
    ├─► Backend: Update progress record
    │
    └─► Frontend: Update UI with new progress
```

## Data Flow

### Request Flow

1. **User Action** → React component
2. **Service Call** → API service function
3. **Axios Interceptor** → Adds JWT token
4. **HTTP Request** → NestJS backend
5. **Guard Check** → JwtAuthGuard validates token
6. **Role Check** → RolesGuard (if needed)
7. **Service Layer** → Business logic
8. **Repository** → TypeORM database query
9. **Response** → JSON data back to frontend
10. **State Update** → React component updates

### Database Operations

```
TypeORM Entity
    │
    ├─► Repository Pattern
    │
    ├─► SQL Query Generation
    │
    ├─► PostgreSQL Execution
    │
    └─► Entity Mapping
```

## Security Flow

### JWT Authentication

```
1. User logs in
   │
   ├─► Backend validates credentials
   │
   ├─► Backend generates JWT (payload: userId, email, role)
   │
   └─► Frontend stores token

2. Protected API Request
   │
   ├─► Frontend includes token in Authorization header
   │
   ├─► JwtAuthGuard extracts token
   │
   ├─► JwtStrategy validates token
   │
   ├─► User object attached to request
   │
   └─► Route handler executes
```

### Role-Based Access Control

```
Route with @Roles('instructor')
    │
    ├─► JwtAuthGuard validates token
    │
    ├─► RolesGuard checks user.role
    │
    ├─► If role matches → Allow access
    │
    └─► If role doesn't match → 403 Forbidden
```

## Key Workflows

### 1. Course Publishing Workflow

```
Instructor creates course (isPublished: false)
    │
    ├─► Course visible only to instructor
    │
    ├─► Instructor adds modules
    │
    ├─► Instructor sets isPublished: true
    │
    └─► Course appears in public catalog
```

### 2. Enrollment Initialization

```
Student enrolls in course
    │
    ├─► Create Enrollment record
    │
    ├─► Fetch all course modules
    │
    ├─► Create Progress record for each module
    │
    └─► Initialize completionPercentage: 0
```

### 3. Progress Calculation

```
Module completion
    │
    ├─► Update Progress.completionPercentage
    │
    ├─► If percentage >= 100 → isCompleted: true
    │
    ├─► Calculate overall progress:
    │   completedModules / totalModules * 100
    │
    └─► Display on dashboard
```

## Error Handling Flow

```
API Error
    │
    ├─► Backend: Throw NestJS exception
    │
    ├─► Frontend: Axios catches error
    │
    ├─► If 401: Clear token, redirect to login
    │
    ├─► If 403: Show permission error
    │
    ├─► If 404: Show not found message
    │
    └─► Display error to user
```

## Real-time Updates

### Dashboard Refresh

```
User enrolls in course
    │
    ├─► Enrollment API call succeeds
    │
    ├─► Navigate to dashboard
    │
    ├─► Dashboard component mounts
    │
    ├─► useEffect fetches enrollments
    │
    └─► UI updates with new course
```

## Database Relationships in Action

### Course with Modules

```
GET /courses/:id
    │
    ├─► TypeORM loads Course
    │
    ├─► Eager load modules (relations: ['modules'])
    │
    ├─► SQL JOIN on modules.courseId = courses.id
    │
    └─► Return course with nested modules array
```

### Enrollment with Progress

```
GET /enrollments/my-courses
    │
    ├─► TypeORM loads Enrollments for user
    │
    ├─► Eager load course, modules, progress
    │
    ├─► Multiple JOINs:
    │   - enrollments.courseId → courses.id
    │   - enrollments.id → progress.enrollmentId
    │   - progress.moduleId → modules.id
    │
    └─► Return nested structure
```

## Development Workflow

### Adding a New Feature

1. **Backend:**
   - Create entity (if needed)
   - Create DTO
   - Create service
   - Create controller
   - Add routes to module

2. **Frontend:**
   - Create service function
   - Create page/component
   - Add route
   - Update navigation (if needed)

3. **Testing:**
   - Test API endpoint
   - Test UI integration
   - Test error cases

## Deployment Workflow

### Backend Deployment

```
1. Set NODE_ENV=production
2. Configure database connection
3. Run migrations (disable synchronize)
4. Set strong JWT_SECRET
5. Configure CORS
6. Build: npm run build
7. Start: npm run start:prod
```

### Frontend Deployment

```
1. Set VITE_API_URL to production API
2. Build: npm run build
3. Deploy dist/ folder to static host
4. Configure reverse proxy (if needed)
```

## Best Practices

1. **Separation of Concerns**
   - Frontend: UI and user interaction
   - Backend: Business logic and data validation
   - Database: Data persistence

2. **Security**
   - Never expose sensitive data in frontend
   - Validate all inputs on backend
   - Use HTTPS in production
   - Implement rate limiting

3. **Error Handling**
   - Consistent error responses
   - User-friendly error messages
   - Log errors for debugging

4. **Performance**
   - Lazy load routes
   - Optimize database queries
   - Use pagination for large lists
   - Cache frequently accessed data

