# 🚀 RUN ME FIRST - Quick Setup Guide

## Step-by-Step Setup

### 1️⃣ Install Dependencies

**Open PowerShell/Terminal and run:**

```powershell
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ../frontend
npm install
```

### 2️⃣ Setup PostgreSQL Database

**Option A: Using psql**
```powershell
psql -U postgres
CREATE DATABASE lms_db;
\q
```

**Option B: Using createdb**
```powershell
createdb -U postgres lms_db
```

### 3️⃣ Create Backend Environment File

**Create file: `backend/.env`** with this content:

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

**⚠️ IMPORTANT:** Change `DB_PASSWORD` and `JWT_SECRET` to your actual values!

### 4️⃣ Run the Application

**Open TWO terminal windows:**

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

### 5️⃣ Open Browser

Go to: **http://localhost:5173**

## ✅ Success Indicators

- Backend shows: `Application is running on: http://localhost:3000`
- Frontend shows: `Local: http://localhost:5173/`
- Browser loads the login page

## 🐛 Common Issues

### "Cannot find module" errors
**Solution:** Run `npm install` in the directory with the error

### "Port already in use"
**Solution:** 
- Change `PORT=3000` to `PORT=3001` in `backend/.env`
- Or kill the process using the port

### "Database connection failed"
**Solution:**
- Check PostgreSQL is running
- Verify database credentials in `backend/.env`
- Ensure database `lms_db` exists

### TypeScript errors in frontend
**Solution:**
```powershell
cd frontend
Remove-Item -Recurse -Force node_modules
npm install
```

## 📚 Need More Help?

- See `COMMANDS.md` for all commands
- See `QUICK_START.md` for quick reference
- See `SETUP.md` for detailed setup
- See `FIXES_APPLIED.md` for fixes applied

## 🎯 Next Steps After Setup

1. Register a new account (Student or Instructor)
   - Use a strong password (uppercase, lowercase, number, underscore)
   - Toggle password visibility with the eye icon
2. Login with your credentials
3. Explore the dashboard
4. **As Instructor**:
   - Create courses with modules
   - Upload videos/PDFs or use YouTube URLs
   - Answer student questions
5. **As Student**:
   - Browse courses with search and filters
   - Enroll in courses
   - View content (videos, PDFs, text)
   - Track your progress automatically
   - Ask questions on course pages

## ✨ Key Features

- **Password Security**: Strong validation with real-time feedback
- **Video Support**: Large YouTube player with automatic URL conversion
- **PDF Viewer**: Embedded viewer with same-tab viewing
- **Search & Filter**: Find courses quickly by title, description, or instructor
- **Progress Tracking**: Automatic progress updates when viewing modules
- **Q&A System**: Students can ask questions, instructors can answer
- **File Upload**: Upload videos and PDFs for course modules
- **Modern UI**: Learning-optimized colors and fast performance

