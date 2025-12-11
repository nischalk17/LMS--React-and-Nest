# Setup and Run Commands

## Prerequisites

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/download/)
3. **npm** (comes with Node.js)

## Initial Setup

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 3. Database Setup

1. Start PostgreSQL service
2. Create a database:

```bash
# Using psql command line
psql -U postgres
CREATE DATABASE lms_db;
\q
```

Or using createdb command:
```bash
createdb -U postgres lms_db

or directly use pgadmin4 
```

### 4. Backend Environment Configuration

Create a `.env` file in the `backend` directory:

```bash
cd backend
```

Create `.env` file with the following content:

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

**Important:** Change the database credentials and JWT_SECRET to match your setup!

### 5. Frontend Environment Configuration (Optional)

Create a `.env` file in the `frontend` directory:

```bash
cd frontend
```

Create `.env` file:

```env
VITE_API_URL=http://localhost:3000
```

## Running the Application

### Option 1: Run Backend and Frontend Separately

#### Terminal 1 - Backend:
```bash
cd backend
npm run start:dev
```

The backend will run on `http://localhost:3000`

#### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:5173`

### Option 2: Using npm scripts (if you add them to root package.json)

You can create a root `package.json` with scripts to run both:

```json
{
  "scripts": {
    "dev:backend": "cd backend && npm run start:dev",
    "dev:frontend": "cd frontend && npm run dev",
    "install:all": "cd backend && npm install && cd ../frontend && npm install"
  }
}
```

## Verification

1. **Backend is running** if you see:
   ```
   Application is running on: http://localhost:3000
   ```

2. **Frontend is running** if you see:
   ```
   VITE v5.x.x  ready in xxx ms
   ➜  Local:   http://localhost:5173/
   ```

3. **Open browser** and navigate to `http://localhost:5173`

## Common Issues and Solutions

### Issue: "Cannot connect to database"
**Solution:** 
- Check PostgreSQL is running
- Verify database credentials in `.env`
- Ensure database `lms_db` exists

### Issue: "Port 3000 already in use"
**Solution:**
- Change `PORT` in backend `.env` file
- Or stop the process using port 3000

### Issue: "Module not found" errors
**Solution:**
- Run `npm install` in the respective directory (backend or frontend)
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

### Issue: TypeScript errors in frontend
**Solution:**
- Ensure all dependencies are installed: `cd frontend && npm install`
- Check that `@types/react` and `@types/react-dom` are in devDependencies

## Production Build

### Build Backend:
```bash
cd backend
npm run build
npm run start:prod
```

### Build Frontend:
```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/` directory.

## Testing the Application

1. **Register a new user:**
   - Go to `http://localhost:5173/register`
   - Create a student or instructor account

2. **Login:**
   - Go to `http://localhost:5173/login`
   - Use your credentials

3. **As Instructor:**
   - Create a course
   - Add modules to the course
   - Publish the course

4. **As Student:**
   - Browse courses in the catalog
   - Enroll in a course
   - View progress on dashboard

## Troubleshooting

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql -U postgres -d lms_db -c "SELECT version();"
```

### Check if ports are in use
```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# Linux/Mac
lsof -i :3000
lsof -i :5173
```

### Clear and Reinstall Dependencies
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

