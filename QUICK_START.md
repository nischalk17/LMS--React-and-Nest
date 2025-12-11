# Quick Start Guide

## 🚀 Fast Setup (5 minutes)

### Step 1: Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 2: Setup Database

1. Make sure PostgreSQL is running
2. Create database:
```bash
createdb -U postgres lms_db
```

### Step 3: Configure Environment

**Backend `.env` file** (`backend/.env`):
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=lms_db
JWT_SECRET=your-secret-key-change-this
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Step 4: Run the Application

**Terminal 1 - Start Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```

### Step 5: Open Browser

Navigate to: **http://localhost:5173**

## ✅ Verify It's Working

1. Backend should show: `Application is running on: http://localhost:3000`
2. Frontend should show: `Local: http://localhost:5173/`
3. Browser should load the login page

## 🎯 First Steps

1. **Register** a new account (choose Student or Instructor)
2. **Login** with your credentials
3. **Explore** the dashboard

## 📝 Commands Reference

| Action | Command |
|--------|---------|
| Start Backend | `cd backend && npm run start:dev` |
| Start Frontend | `cd frontend && npm run dev` |
| Build Backend | `cd backend && npm run build` |
| Build Frontend | `cd frontend && npm run build` |
| Install All | `cd backend && npm install && cd ../frontend && npm install` |

## 🐛 Common Issues

**Database connection error?**
- Check PostgreSQL is running
- Verify `.env` credentials

**Port already in use?**
- Change `PORT` in backend `.env`
- Or kill the process: `taskkill /F /PID <pid>` (Windows)

**Module not found?**
- Run `npm install` in the directory with the error

## 📚 Next Steps

- Read `README.md` for full documentation
- Check `docs/BACKEND.md` for API details
- See `docs/FRONTEND.md` for frontend architecture
- Review `docs/WORKFLOW.md` for system workflows

