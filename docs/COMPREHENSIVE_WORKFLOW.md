# Comprehensive Learning Management System Workflow Documentation

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Authentication Workflow](#authentication-workflow)
3. [Registration Workflow](#registration-workflow)
4. [Course Management Workflow](#course-management-workflow)
5. [Enrollment Workflow](#enrollment-workflow)
6. [Progress Tracking Workflow](#progress-tracking-workflow)
7. [Frontend Architecture](#frontend-architecture)
8. [Backend Architecture](#backend-architecture)
9. [State Management](#state-management)
10. [API Communication](#api-communication)
11. [Security Implementation](#security-implementation)
12. [File Structure and Functions](#file-structure-and-functions)

---

## System Architecture

### Technology Stack

**Frontend:**
- React 18.2.0 with TypeScript
- Vite 7.2.7 (Build tool)
- React Router DOM 6.20.0 (Routing)
- Redux Toolkit 2.11.2 (State management)
- React Hook Form 7.68.0 (Form handling)
- Zod 4.1.13 (Schema validation)
- Axios 1.6.2 (HTTP client)
- Tailwind CSS 3.4.14 (Styling)
- Lucide React 0.561.0 (Icons)

**Backend:**
- NestJS (Node.js framework)
- TypeORM (ORM)
- PostgreSQL (Database)
- JWT (Authentication)
- bcrypt (Password hashing)
- Passport (Authentication strategy)

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              React Frontend (Vite)                    │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │   │
│  │  │   Pages      │  │  Components  │  │  Contexts │  │   │
│  │  │  - Login     │  │  - Layout    │  │  - Auth   │  │   │
│  │  │  - Register  │  │  - Forms     │  │  - Theme  │  │   │
│  │  │  - Dashboard │  │  - UI        │  │           │  │   │
│  │  │  - Courses   │  │              │  │           │  │   │
│  │  └──────────────┘  └──────────────┘  └───────────┘  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │   │
│  │  │   Services   │  │    Store     │  │   Utils   │  │   │
│  │  │  - auth      │  │  - authSlice │  │  - pwd    │  │   │
│  │  │  - course    │  │  - hooks     │  │           │  │   │
│  │  │  - enrollment│  │              │  │           │  │   │
│  │  └──────────────┘  └──────────────┘  └───────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/REST API (Axios + JWT)
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    NestJS Backend                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Controllers  │  │   Services   │  │   Guards    │        │
│  │  - auth      │  │  - auth      │  │  - JWT      │        │
│  │  - courses   │  │  - courses   │  │  - Roles   │        │
│  │  - enroll    │  │  - enroll    │  │            │        │
│  │  - progress  │  │  - progress  │  │            │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Entities   │  │     DTOs     │  │  Strategies  │        │
│  │  - User      │  │  - Register  │  │  - JWT      │        │
│  │  - Course    │  │  - Login     │  │            │        │
│  │  - Module    │  │  - Create    │  │            │        │
│  │  - Enrollment│  │              │  │            │        │
│  │  - Progress  │  │              │  │            │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└───────────────────────────┬─────────────────────────────────┘
                            │ TypeORM
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    PostgreSQL Database                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │    users     │  │   courses    │  │  enrollments │        │
│  │   modules    │  │   progress   │  │              │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└──────────────────────────────────────────────────────────────┘
```

---

## Authentication Workflow

### Login Flow (Detailed)

**File: `frontend/src/pages/Login.tsx`**

#### Step-by-Step Process:

1. **User Visits Login Page**
   - Component: `Login` function component
   - Route: `/login` (defined in `frontend/src/App.tsx`)
   - Initial state:
     - `showPassword: false` (password visibility toggle)
     - `loginError: null` (local error state)
     - Form initialized with empty email and password

2. **Form Initialization**
   - **Function**: `useForm<LoginForm>` from `react-hook-form`
   - **Schema**: `loginSchema` (Zod validation)
     - Email: Must be valid email format
     - Password: Minimum 1 character required
   - **Resolver**: `zodResolver(loginSchema)` - validates on submit

3. **Password Visibility Toggle**
   - **State**: `const [showPassword, setShowPassword] = useState(false)`
   - **Icons**: 
     - `Eye` from `lucide-react` (when password hidden)
     - `EyeOff` from `lucide-react` (when password visible)
   - **Implementation**:
     ```tsx
     <button
       type="button"
       onClick={() => setShowPassword(!showPassword)}
       className="absolute right-3 top-1/2 -translate-y-1/2"
     >
       {showPassword ? <EyeOff /> : <Eye />}
     </button>
     ```
   - **Input Type**: Dynamically changes between `type="password"` and `type="text"`

4. **Password Strength Indicator**
   - **Function**: `evaluatePasswordStrength(passwordValue || '')`
   - **File**: `frontend/src/utils/passwordStrength.ts`
   - **Watcher**: `form.watch('password')` - real-time password value
   - **Display**: Visual bar and strength label (Weak/Medium/Strong)

5. **Error Message Persistence**
   - **Problem**: Error was clearing after 1 second
   - **Solution**: Local state management with `useEffect` hooks
   - **Implementation**:
     ```tsx
     // Sync error from auth context
     useEffect(() => {
       if (error) {
         setLoginError(error);
       }
     }, [error]);
     
     // Clear error when user types
     useEffect(() => {
       if (emailValue || passwordValue) {
         setLoginError(null);
       }
     }, [emailValue, passwordValue]);
     ```
   - **Display**: Error persists until user starts typing new credentials

6. **Form Submission**
   - **Function**: `onSubmit` (async)
   - **Process**:
     ```tsx
     const onSubmit = async (values: LoginForm) => {
       try {
         setLoginError(null); // Clear previous errors
         await login(values.email, values.password); // AuthContext method
         navigate('/dashboard'); // Redirect on success
       } catch (err: any) {
         const message = err?.response?.data?.message || 'Login failed';
         setLoginError(message); // Set error state
         form.setError('email', { message }); // Form-level error
       }
     };
     ```

7. **Authentication Context Call**
   - **File**: `frontend/src/contexts/AuthContext.tsx`
   - **Function**: `login(email: string, password: string)`
   - **Implementation**:
     ```tsx
     login: (email: string, password: string) =>
       dispatch(loginUser({ email, password })).unwrap()
     ```

8. **Redux Action Dispatch**
   - **File**: `frontend/src/store/authSlice.ts`
   - **Action**: `loginUser` (async thunk)
   - **Process**:
     ```tsx
     export const loginUser = createAsyncThunk(
       'auth/login',
       async ({ email, password }, { rejectWithValue }) => {
         try {
           const response = await authService.login(email, password);
           localStorage.setItem('token', response.accessToken);
           localStorage.setItem('user', JSON.stringify(response));
           return { id, email, firstName, lastName, role };
         } catch (error: any) {
           return rejectWithValue(message);
         }
       }
     );
     ```

9. **API Service Call**
   - **File**: `frontend/src/services/authService.ts`
   - **Function**: `authService.login(email, password)`
   - **Implementation**:
     ```tsx
     async login(email: string, password: string): Promise<AuthResponse> {
       const response = await api.post<AuthResponse>('/auth/login', {
         email,
         password,
       });
       return response.data;
     }
     ```

10. **Axios Interceptor**
    - **File**: `frontend/src/services/api.ts`
    - **Request Interceptor**: Adds JWT token to headers
      ```tsx
      api.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      });
      ```
    - **Response Interceptor**: Handles 401 errors (token expiration)

11. **Backend Authentication**
    - **File**: `backend/src/auth/auth.controller.ts`
    - **Endpoint**: `POST /auth/login`
    - **Decorator**: `@Public()` - bypasses JWT guard
    - **Handler**: `login(@Body() loginDto: LoginDto)`
    - **Calls**: `authService.login(loginDto)`

12. **Backend Service**
    - **File**: `backend/src/auth/auth.service.ts`
    - **Function**: `async login(loginDto: LoginDto)`
    - **Process**:
      ```ts
      1. Find user by email (TypeORM query)
      2. If user not found → throw UnauthorizedException
      3. Compare password with bcrypt.compare()
      4. If password invalid → throw UnauthorizedException
      5. Generate JWT token with user.id, email, role
      6. Return user data (without password) + accessToken
      ```

13. **JWT Token Generation**
    - **Service**: `JwtService` from `@nestjs/jwt`
    - **Payload**: `{ sub: user.id, email: user.email, role: user.role }`
    - **Secret**: From environment variable `JWT_SECRET`

14. **Response Flow**
    - Backend → Frontend: `{ id, email, firstName, lastName, role, accessToken }`
    - Redux updates state: `user` set, `status: 'authenticated'`
    - Token stored in `localStorage`
    - User data stored in `localStorage`
    - Navigation to `/dashboard`

15. **Error Handling**
    - **Backend Errors**: `UnauthorizedException('Invalid credentials')`
    - **Frontend Catch**: Extracts message from `err.response.data.message`
    - **State Update**: `loginError` set, form error set
    - **UI Display**: Red error message persists until user types

### Key Functions and Files:

| Component | File | Function | Purpose |
|-----------|------|----------|---------|
| Login Page | `frontend/src/pages/Login.tsx` | `Login()` | Main login component |
| Form Hook | `react-hook-form` | `useForm()` | Form state management |
| Schema | `frontend/src/pages/Login.tsx` | `loginSchema` | Validation rules |
| Password Toggle | `frontend/src/pages/Login.tsx` | `showPassword` state | Visibility control |
| Error State | `frontend/src/pages/Login.tsx` | `loginError` state | Error persistence |
| Auth Context | `frontend/src/contexts/AuthContext.tsx` | `useAuth()` | Auth hook |
| Redux Action | `frontend/src/store/authSlice.ts` | `loginUser` | Async login action |
| API Service | `frontend/src/services/authService.ts` | `login()` | HTTP request |
| Axios Config | `frontend/src/services/api.ts` | Interceptors | Token injection |
| Backend Controller | `backend/src/auth/auth.controller.ts` | `login()` | API endpoint |
| Backend Service | `backend/src/auth/auth.service.ts` | `login()` | Business logic |
| Password Hash | `bcrypt` | `compare()` | Password verification |
| JWT Service | `@nestjs/jwt` | `sign()` | Token generation |

---

## Registration Workflow

### Registration Flow (Detailed)

**File: `frontend/src/pages/Register.tsx`**

#### Step-by-Step Process:

1. **User Visits Register Page**
   - Component: `Register` function component
   - Route: `/register` (defined in `frontend/src/App.tsx`)
   - Initial state:
     - `showPassword: false` (password visibility toggle)
     - Form initialized with empty fields

2. **Form Schema**
   - **File**: `frontend/src/pages/Register.tsx`
   - **Schema**: `registerSchema` (Zod validation)
     ```tsx
     {
       firstName: string (min 1 char)
       lastName: string (min 1 char)
       email: valid email format
       password: {
         min 8 characters
         regex: uppercase letter
         regex: number
         regex: special symbol
       }
       role: 'student' | 'instructor'
     }
     ```

3. **Password Visibility Toggle**
   - **Implementation**: Same as Login page
   - **State**: `const [showPassword, setShowPassword] = useState(false)`
   - **Icons**: `Eye` / `EyeOff` from `lucide-react`
   - **Position**: Absolute positioned button inside input wrapper

4. **Password Strength Validation**
   - **Function**: `evaluatePasswordStrength(passwordValue || '')`
   - **File**: `frontend/src/utils/passwordStrength.ts`
   - **Requirements Display**: Shows all password requirements as badges
   - **Real-time Feedback**: Updates as user types

5. **Form Submission**
   - **Function**: `onSubmit` (async)
   - **Process**:
     ```tsx
     const onSubmit = async (values: RegisterForm) => {
       try {
         await registerUser(values); // AuthContext method
         navigate('/dashboard'); // Redirect on success
       } catch (err: any) {
         const message = err?.response?.data?.message || 'Registration failed';
         form.setError('email', { message });
       }
     };
     ```

6. **Backend Registration**
   - **File**: `backend/src/auth/auth.service.ts`
   - **Function**: `async register(registerDto: RegisterDto)`
   - **Process**:
     ```ts
     1. Check if email already exists
     2. If exists → throw ConflictException('Email already exists')
     3. Hash password with bcrypt.hash(password, 10)
     4. Create user entity with hashed password
     5. Set role (default: 'student' if not provided)
     6. Save user to database
     7. Generate JWT token
     8. Return user data (without password) + accessToken
     ```

7. **Password Hashing**
   - **Library**: `bcrypt`
   - **Function**: `bcrypt.hash(password, 10)`
   - **Salt Rounds**: 10 (security level)
   - **Storage**: Hashed password stored in database

### Key Functions and Files:

| Component | File | Function | Purpose |
|-----------|------|----------|---------|
| Register Page | `frontend/src/pages/Register.tsx` | `Register()` | Main registration component |
| Form Schema | `frontend/src/pages/Register.tsx` | `registerSchema` | Validation rules |
| Password Toggle | `frontend/src/pages/Register.tsx` | `showPassword` state | Visibility control |
| Password Strength | `frontend/src/utils/passwordStrength.ts` | `evaluatePasswordStrength()` | Strength calculation |
| Auth Context | `frontend/src/contexts/AuthContext.tsx` | `register()` | Registration hook |
| Redux Action | `frontend/src/store/authSlice.ts` | `registerUser` | Async registration |
| API Service | `frontend/src/services/authService.ts` | `register()` | HTTP request |
| Backend Controller | `backend/src/auth/auth.controller.ts` | `register()` | API endpoint |
| Backend Service | `backend/src/auth/auth.service.ts` | `register()` | Business logic |
| Password Hash | `bcrypt` | `hash()` | Password hashing |

---

## Course Management Workflow

### Course Creation Flow

**Files**: 
- Frontend: `frontend/src/pages/CreateCourse.tsx`
- Backend: `backend/src/courses/courses.controller.ts`, `backend/src/courses/courses.service.ts`

#### Step-by-Step Process:

1. **Instructor Accesses Create Course**
   - **Route**: `/courses/create` (protected, instructor only)
   - **Guard**: `InstructorRoute` component in `frontend/src/App.tsx`
   - **Check**: Verifies `user.role === 'instructor'`

2. **Form Submission**
   - **Schema**: Course title, description, thumbnail (optional)
   - **Validation**: Zod schema validation
   - **Service Call**: `courseService.create(data)`

3. **API Request**
   - **Endpoint**: `POST /courses`
   - **Headers**: `Authorization: Bearer <token>`
   - **Body**: `{ title, description, thumbnail?, isPublished?: false }`

4. **Backend Processing**
   - **Guard**: `JwtAuthGuard` validates token
   - **Guard**: `RolesGuard` checks `@Roles('instructor')`
   - **Controller**: `create()` extracts user from `@Request() req`
   - **Service**: `create(createCourseDto, instructorId)`
   - **Process**:
     ```ts
     1. Create course entity with instructorId
     2. Set isPublished: false (default)
     3. Save to database
     4. Return course with instructor relation
     ```

5. **Module Addition**
   - **File**: `frontend/src/pages/EditCourse.tsx`
   - **Endpoint**: `POST /courses/:id/modules`
   - **Module Types**: `'text' | 'video' | 'pdf'`
   - **Process**:
     ```ts
     - Text: content field (string)
     - Video: videoUrl field (YouTube URL or file)
     - PDF: pdfUrl field (PDF URL or file)
     - Order: Sequential ordering
     ```

6. **Course Publishing**
   - **Action**: Update `isPublished: true`
   - **Endpoint**: `PATCH /courses/:id`
   - **Effect**: Course appears in public catalog

### Key Functions and Files:

| Component | File | Function | Purpose |
|-----------|------|----------|---------|
| Create Course | `frontend/src/pages/CreateCourse.tsx` | `CreateCourse()` | Course creation form |
| Edit Course | `frontend/src/pages/EditCourse.tsx` | `EditCourse()` | Course editing |
| Course Service | `frontend/src/services/courseService.ts` | `create()` | API call |
| Backend Controller | `backend/src/courses/courses.controller.ts` | `create()` | API endpoint |
| Backend Service | `backend/src/courses/courses.service.ts` | `create()` | Business logic |
| Roles Guard | `backend/src/auth/guards/roles.guard.ts` | `canActivate()` | Role checking |
| Course Entity | `backend/src/entities/course.entity.ts` | `Course` class | Database model |

---

## Enrollment Workflow

### Student Enrollment Flow

**Files**:
- Frontend: `frontend/src/pages/CourseCatalog.tsx`, `frontend/src/pages/CourseDetail.tsx`
- Backend: `backend/src/enrollments/enrollments.controller.ts`, `backend/src/enrollments/enrollments.service.ts`

#### Step-by-Step Process:

1. **Student Browses Catalog**
   - **Page**: `CourseCatalog.tsx`
   - **Endpoint**: `GET /courses?published=true`
   - **Service**: `courseService.getAll(true)`
   - **Display**: Course cards with title, description, instructor

2. **Student Views Course Details**
   - **Page**: `CourseDetail.tsx`
   - **Endpoint**: `GET /courses/:id`
   - **Service**: `courseService.getById(id)`
   - **Display**: Full course info, modules list, enroll button

3. **Enrollment Action**
   - **Button Click**: "Enroll" button
   - **Service**: `enrollmentService.enroll(courseId)`
   - **File**: `frontend/src/services/enrollmentService.ts`

4. **API Request**
   - **Endpoint**: `POST /enrollments/courses/:id`
   - **Headers**: `Authorization: Bearer <token>`
   - **Guard**: `JwtAuthGuard` (must be authenticated)

5. **Backend Enrollment Process**
   - **File**: `backend/src/enrollments/enrollments.service.ts`
   - **Function**: `async enroll(studentId: string, courseId: string)`
   - **Process**:
     ```ts
     1. Verify course exists
     2. Verify course is published
     3. Check if already enrolled (ConflictException if yes)
     4. Create Enrollment record
     5. Fetch all course modules
     6. Create Progress record for each module
        - enrollmentId: enrollment.id
        - moduleId: module.id
        - isCompleted: false
        - completionPercentage: 0
     7. Return enrollment with course and modules
     ```

6. **Progress Initialization**
   - **Entity**: `Progress` (one per module per enrollment)
   - **Fields**: `enrollmentId`, `moduleId`, `isCompleted`, `completionPercentage`
   - **Purpose**: Track student progress through course

### Key Functions and Files:

| Component | File | Function | Purpose |
|-----------|------|----------|---------|
| Course Catalog | `frontend/src/pages/CourseCatalog.tsx` | `CourseCatalog()` | Browse courses |
| Course Detail | `frontend/src/pages/CourseDetail.tsx` | `CourseDetail()` | Course details |
| Enrollment Service | `frontend/src/services/enrollmentService.ts` | `enroll()` | API call |
| Backend Controller | `backend/src/enrollments/enrollments.controller.ts` | `enroll()` | API endpoint |
| Backend Service | `backend/src/enrollments/enrollments.service.ts` | `enroll()` | Business logic |
| Enrollment Entity | `backend/src/entities/enrollment.entity.ts` | `Enrollment` class | Database model |
| Progress Entity | `backend/src/entities/progress.entity.ts` | `Progress` class | Database model |

---

## Progress Tracking Workflow

### Progress Update Flow

**Files**:
- Frontend: `frontend/src/pages/CourseDetail.tsx`
- Backend: `backend/src/progress/progress.controller.ts`, `backend/src/progress/progress.service.ts`

#### Step-by-Step Process:

1. **Student Views Enrolled Course**
   - **Page**: `CourseDetail.tsx`
   - **Endpoint**: `GET /enrollments/my-courses`
   - **Service**: `enrollmentService.getMyCourses()`
   - **Data**: Returns enrollments with course, modules, and progress

2. **Module Completion**
   - **Action**: Student marks module as complete
   - **Endpoint**: `PATCH /progress/:enrollmentId/modules/:moduleId`
   - **Body**: `{ completionPercentage: 100, isCompleted: true }`

3. **Backend Progress Update**
   - **File**: `backend/src/progress/progress.service.ts`
   - **Function**: `async updateProgress(enrollmentId, moduleId, updateDto)`
   - **Process**:
     ```ts
     1. Find progress record by enrollmentId and moduleId
     2. Update completionPercentage
     3. If percentage >= 100 → set isCompleted: true
     4. Save to database
     5. Return updated progress
     ```

4. **Overall Progress Calculation**
   - **Formula**: `(completedModules / totalModules) * 100`
   - **Display**: Progress bar on dashboard
   - **File**: `frontend/src/pages/Dashboard.tsx`

### Key Functions and Files:

| Component | File | Function | Purpose |
|-----------|------|----------|---------|
| Course Detail | `frontend/src/pages/CourseDetail.tsx` | `CourseDetail()` | Course viewing |
| Progress Service | `frontend/src/services/progressService.ts` | `updateProgress()` | API call |
| Backend Controller | `backend/src/progress/progress.controller.ts` | `updateProgress()` | API endpoint |
| Backend Service | `backend/src/progress/progress.service.ts` | `updateProgress()` | Business logic |
| Dashboard | `frontend/src/pages/Dashboard.tsx` | `Dashboard()` | Progress display |

---

## Frontend Architecture

### Component Structure

```
frontend/src/
├── pages/              # Route components
│   ├── Login.tsx       # Login page with password toggle
│   ├── Register.tsx    # Registration page with password toggle
│   ├── Dashboard.tsx   # User dashboard
│   ├── CourseCatalog.tsx
│   ├── CourseDetail.tsx
│   ├── CreateCourse.tsx
│   ├── EditCourse.tsx
│   └── InstructorCourses.tsx
├── components/         # Reusable components
│   ├── Layout.tsx      # Main layout wrapper
│   ├── ThemeToggle.tsx # Dark/light mode toggle
│   └── ui/             # UI primitives (shadcn/ui)
│       ├── button.tsx
│       ├── input.tsx
│       ├── form.tsx
│       ├── card.tsx
│       └── ...
├── contexts/           # React contexts
│   ├── AuthContext.tsx # Authentication context
│   └── ThemeContext.tsx # Theme context
├── services/          # API services
│   ├── api.ts         # Axios instance with interceptors
│   ├── authService.ts # Auth API calls
│   ├── courseService.ts # Course API calls
│   ├── enrollmentService.ts
│   └── progressService.ts
├── store/             # Redux store
│   ├── authSlice.ts   # Auth state management
│   └── hooks.ts       # Typed Redux hooks
└── utils/             # Utility functions
    └── passwordStrength.ts # Password strength calculator
```

### State Management

**Redux Toolkit**:
- **Store**: `frontend/src/store/index.ts` (configured store)
- **Slice**: `authSlice.ts` - manages user authentication state
- **Actions**:
  - `initializeAuth` - Check localStorage for existing session
  - `loginUser` - Async login action
  - `registerUser` - Async registration action
  - `logout` - Clear user state

**React Context**:
- **AuthContext**: Wraps Redux auth state, provides `useAuth()` hook
- **ThemeContext**: Manages dark/light theme state

### Routing

**File**: `frontend/src/App.tsx`
- **Routes**:
  - `/login` - Public
  - `/register` - Public
  - `/dashboard` - Private (authenticated)
  - `/courses` - Private
  - `/courses/:id` - Private
  - `/courses/create` - Private, Instructor only
  - `/courses/:id/edit` - Private, Instructor only
  - `/my-courses` - Private, Instructor only

**Route Guards**:
- `PrivateRoute` - Checks authentication
- `InstructorRoute` - Checks instructor role

---

## Backend Architecture

### Module Structure

```
backend/src/
├── auth/              # Authentication module
│   ├── auth.controller.ts    # Auth endpoints
│   ├── auth.service.ts       # Auth business logic
│   ├── auth.module.ts        # Module definition
│   ├── dto/
│   │   ├── login.dto.ts      # Login validation
│   │   └── register.dto.ts  # Registration validation
│   ├── guards/
│   │   ├── jwt-auth.guard.ts # JWT validation
│   │   └── roles.guard.ts    # Role-based access
│   ├── strategies/
│   │   └── jwt.strategy.ts   # Passport JWT strategy
│   └── decorators/
│       └── public.decorator.ts # Public route marker
├── courses/           # Course management
│   ├── courses.controller.ts
│   ├── courses.service.ts
│   ├── courses.module.ts
│   └── dto/
│       ├── create-course.dto.ts
│       ├── update-course.dto.ts
│       └── create-module.dto.ts
├── enrollments/       # Enrollment management
│   ├── enrollments.controller.ts
│   ├── enrollments.service.ts
│   └── enrollments.module.ts
├── progress/          # Progress tracking
│   ├── progress.controller.ts
│   ├── progress.service.ts
│   └── progress.module.ts
├── entities/         # TypeORM entities
│   ├── user.entity.ts
│   ├── course.entity.ts
│   ├── module.entity.ts
│   ├── enrollment.entity.ts
│   └── progress.entity.ts
└── config/
    └── database.config.ts
```

### Database Relationships

```
User (1) ──< (Many) Course
  │                    │
  │                    │
  │                    └──< (Many) Module
  │
  └──< (Many) Enrollment
         │
         └──< (Many) Progress ──> (1) Module
```

### Guards and Decorators

**JWT Auth Guard**:
- **File**: `backend/src/auth/guards/jwt-auth.guard.ts`
- **Purpose**: Validates JWT token on protected routes
- **Default**: Applied globally via `APP_GUARD` in `app.module.ts`

**Roles Guard**:
- **File**: `backend/src/auth/guards/roles.guard.ts`
- **Purpose**: Checks user role matches required role
- **Usage**: `@Roles('instructor')` decorator

**Public Decorator**:
- **File**: `backend/src/auth/decorators/public.decorator.ts`
- **Purpose**: Marks routes as public (bypasses JWT guard)
- **Usage**: `@Public()` decorator

---

## State Management

### Redux Auth Slice

**File**: `frontend/src/store/authSlice.ts`

**State Structure**:
```ts
interface AuthState {
  user: User | null;
  status: 'idle' | 'loading' | 'authenticated' | 'error';
  initialized: boolean;
  error?: string | null;
}
```

**Actions**:
1. **initializeAuth** (async thunk)
   - Checks localStorage for token
   - Validates token with backend
   - Sets user if valid

2. **loginUser** (async thunk)
   - Calls `authService.login()`
   - Stores token and user in localStorage
   - Updates Redux state

3. **registerUser** (async thunk)
   - Calls `authService.register()`
   - Stores token and user in localStorage
   - Updates Redux state

4. **logout** (reducer)
   - Clears user state
   - Removes token from localStorage
   - Resets status to 'idle'

**Reducers**:
- `loginUser.pending` → `status: 'loading'`, `error: null`
- `loginUser.fulfilled` → `user: payload`, `status: 'authenticated'`
- `loginUser.rejected` → `status: 'error'`, `error: payload`

---

## API Communication

### Axios Configuration

**File**: `frontend/src/services/api.ts`

**Base Configuration**:
```ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});
```

**Request Interceptor**:
- Adds JWT token to `Authorization` header
- Token retrieved from `localStorage.getItem('token')`

**Response Interceptor**:
- Handles 401 errors (unauthorized)
- Clears token and redirects to login
- Rejects promise with error

### API Endpoints

**Authentication**:
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get current user profile

**Courses**:
- `GET /courses?published=true` - Get all published courses
- `GET /courses/:id` - Get course by ID
- `POST /courses` - Create course (instructor)
- `PATCH /courses/:id` - Update course (instructor)
- `DELETE /courses/:id` - Delete course (instructor)
- `POST /courses/:id/modules` - Add module (instructor)
- `PATCH /courses/modules/:id` - Update module (instructor)
- `DELETE /courses/modules/:id` - Delete module (instructor)

**Enrollments**:
- `POST /enrollments/courses/:id` - Enroll in course
- `GET /enrollments/my-courses` - Get student's enrolled courses

**Progress**:
- `PATCH /progress/:enrollmentId/modules/:moduleId` - Update progress

---

## Security Implementation

### Password Security

**Hashing**:
- **Library**: `bcrypt`
- **Salt Rounds**: 10
- **Backend**: `bcrypt.hash(password, 10)`
- **Verification**: `bcrypt.compare(plainPassword, hashedPassword)`

**Frontend Password Visibility**:
- **Toggle**: Eye icon button
- **State**: `showPassword` boolean
- **Input Type**: `type={showPassword ? 'text' : 'password'}`

### JWT Authentication

**Token Generation**:
- **Service**: `JwtService` from `@nestjs/jwt`
- **Payload**: `{ sub: userId, email, role }`
- **Secret**: Environment variable `JWT_SECRET`
- **Expiration**: Configured in JWT module

**Token Storage**:
- **Location**: `localStorage`
- **Key**: `'token'`
- **Retrieval**: On every API request via interceptor

**Token Validation**:
- **Strategy**: `JwtStrategy` (Passport)
- **Guard**: `JwtAuthGuard`
- **Process**: Extracts token from `Authorization` header, validates signature, attaches user to request

### Role-Based Access Control

**Roles**:
- `'student'` - Can enroll and view courses
- `'instructor'` - Can create and manage courses

**Implementation**:
- **Guard**: `RolesGuard`
- **Decorator**: `@Roles('instructor')`
- **Check**: Compares `req.user.role` with required role

---

## File Structure and Functions

### Frontend Files

| File | Key Functions/Components | Purpose |
|------|--------------------------|---------|
| `pages/Login.tsx` | `Login()`, `onSubmit()`, `showPassword` state | Login page with password toggle |
| `pages/Register.tsx` | `Register()`, `onSubmit()`, `showPassword` state | Registration page with password toggle |
| `contexts/AuthContext.tsx` | `AuthProvider`, `useAuth()` | Auth context wrapper |
| `store/authSlice.ts` | `loginUser`, `registerUser`, `logout` | Redux auth state |
| `services/authService.ts` | `login()`, `register()`, `getProfile()` | Auth API calls |
| `services/api.ts` | Axios instance, interceptors | HTTP client configuration |
| `utils/passwordStrength.ts` | `evaluatePasswordStrength()` | Password strength calculation |
| `components/ui/input.tsx` | `Input` component | Reusable input component |

### Backend Files

| File | Key Functions/Classes | Purpose |
|------|----------------------|---------|
| `auth/auth.controller.ts` | `AuthController`, `register()`, `login()`, `getProfile()` | Auth endpoints |
| `auth/auth.service.ts` | `AuthService`, `register()`, `login()`, `getProfile()` | Auth business logic |
| `auth/guards/jwt-auth.guard.ts` | `JwtAuthGuard`, `canActivate()` | JWT validation |
| `auth/guards/roles.guard.ts` | `RolesGuard`, `canActivate()` | Role checking |
| `auth/strategies/jwt.strategy.ts` | `JwtStrategy`, `validate()` | Passport JWT strategy |
| `courses/courses.controller.ts` | `CoursesController`, CRUD methods | Course endpoints |
| `courses/courses.service.ts` | `CoursesService`, CRUD methods | Course business logic |
| `enrollments/enrollments.service.ts` | `EnrollmentsService`, `enroll()` | Enrollment logic |
| `progress/progress.service.ts` | `ProgressService`, `updateProgress()` | Progress tracking |
| `entities/user.entity.ts` | `User` entity | User database model |
| `entities/course.entity.ts` | `Course` entity | Course database model |
| `entities/enrollment.entity.ts` | `Enrollment` entity | Enrollment database model |
| `entities/progress.entity.ts` | `Progress` entity | Progress database model |

---

## Error Handling

### Frontend Error Handling

**Login Errors**:
- **State**: `loginError` in Login component
- **Persistence**: Clears when user types in email/password fields
- **Display**: Red error message below submit button

**API Errors**:
- **Interceptor**: Catches 401, clears token, redirects to login
- **Try-Catch**: Service calls wrapped in try-catch
- **Display**: Error messages shown to user

### Backend Error Handling

**Exceptions**:
- `UnauthorizedException` - Invalid credentials
- `ConflictException` - Email already exists, already enrolled
- `NotFoundException` - Course/module not found
- `ForbiddenException` - Insufficient permissions

**Error Response Format**:
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

---

## Summary

This Learning Management System implements a complete workflow from user authentication to course management and progress tracking. Key features include:

1. **Secure Authentication**: JWT-based with password hashing
2. **Password Visibility Toggle**: Eye icon toggle on login and register pages
3. **Error Persistence**: Login errors persist until user provides new credentials
4. **Role-Based Access**: Student and instructor roles with appropriate permissions
5. **Course Management**: Full CRUD operations for courses and modules
6. **Progress Tracking**: Real-time progress updates for enrolled courses
7. **Modern UI**: React with Tailwind CSS and shadcn/ui components
8. **Type Safety**: Full TypeScript implementation
9. **State Management**: Redux Toolkit for global state
10. **API Communication**: Axios with interceptors for token management

All components, functions, and files are documented above with their specific purposes and implementations.

