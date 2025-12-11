# Commands to Run the LMS Application

## 📋 Prerequisites Setup

### 1. Install Dependencies

**Backend:**
```powershell
cd backend
npm install
```

**Frontend:**
```powershell
cd frontend
npm install
```

### 2. Setup Database

Create PostgreSQL database:
```powershell
# Using psql
psql -U postgres
CREATE DATABASE lms_db;
\q
```

Or using createdb:
```powershell
createdb -U postgres lms_db
```

### 3. Create Backend .env File

Create `backend/.env`:
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

## 🚀 Running the Application

### Option 1: Using PowerShell Scripts (Windows)

**Terminal 1 - Backend:**
```powershell
.\run-backend.ps1
```

**Terminal 2 - Frontend:**
```powershell
.\run-frontend.ps1
```

### Option 2: Manual Commands

**Terminal 1 - Backend:**
```powershell
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

### Option 3: Using Bash Scripts (Linux/Mac)

**Terminal 1 - Backend:**
```bash
chmod +x run-backend.sh
./run-backend.sh
```

**Terminal 2 - Frontend:**
```bash
chmod +x run-frontend.sh
./run-frontend.sh
```

## ✅ Verify It's Working

1. **Backend** should show:
   ```
   Application is running on: http://localhost:3000
   ```

2. **Frontend** should show:
   ```
   VITE v5.x.x  ready in xxx ms
   ➜  Local:   http://localhost:5173/
   ```

3. **Open browser** and go to: `http://localhost:5173`

## 🛠️ Other Useful Commands

### Backend Commands
```powershell
cd backend

# Development
npm run start:dev

# Production build
npm run build
npm run start:prod

# Run tests
npm run test
npm run test:e2e

# Lint code
npm run lint
```

### Frontend Commands
```powershell
cd frontend

# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🔧 Troubleshooting Commands

### Check if ports are in use (Windows)
```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :5173
```

### Kill process on port (Windows)
```powershell
# Find PID first, then:
taskkill /F /PID <pid>
```

### Check if ports are in use (Linux/Mac)
```bash
lsof -i :3000
lsof -i :5173
```

### Kill process on port (Linux/Mac)
```bash
kill -9 <pid>
```

### Reinstall Dependencies
```powershell
# Backend
cd backend
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install

# Frontend
cd frontend
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

### Test Database Connection
```powershell
psql -U postgres -d lms_db -c "SELECT version();"
```

## 📝 Quick Reference

| Task | Command |
|------|---------|
| Start Backend | `cd backend && npm run start:dev` |
| Start Frontend | `cd frontend && npm run dev` |
| Install Backend Deps | `cd backend && npm install` |
| Install Frontend Deps | `cd frontend && npm install` |
| Build Backend | `cd backend && npm run build` |
| Build Frontend | `cd frontend && npm run build` |

## 🎯 First Time Setup Checklist

- [ ] Install Node.js (v18+)
- [ ] Install PostgreSQL
- [ ] Create database `lms_db`
- [ ] Install backend dependencies: `cd backend && npm install`
- [ ] Install frontend dependencies: `cd frontend && npm install`
- [ ] Create `backend/.env` file with database credentials
- [ ] Start backend: `cd backend && npm run start:dev`
- [ ] Start frontend: `cd frontend && npm run dev`
- [ ] Open browser: `http://localhost:5173`

