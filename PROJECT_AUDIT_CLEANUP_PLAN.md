# VH Banquets - Project Architecture Audit & Cleanup Plan

## Current State Analysis (July 14, 2025)

### 🔍 **Project Structure Issues Identified:**

#### 1. **Conflicting Applications:**
- **Root `/src`**: Legacy React web app (conflicting with mobile)
- **`/mobile`**: React Native/Expo app (correct for mobile)
- **`/backend`**: Node.js/Express + PostgreSQL API (correct)
- **`/api`**: Legacy API for Runway ML (redundant/outdated)

#### 2. **Multiple Package.json Files:**
- **Root**: React web app dependencies
- **Mobile**: React Native dependencies ✅
- **Backend**: Node.js API dependencies ✅
- **API**: Legacy Runway ML API ❌

#### 3. **Database Setup:**
- **PostgreSQL Schema**: Properly defined ✅
- **Migrations**: Available ✅
- **Connection**: Configured ✅

---

## 🎯 **Recommended Architecture:**

```
vh-banquets/
├── mobile/              # React Native Mobile App
│   ├── src/
│   ├── package.json
│   └── app.json
├── backend/             # Node.js API + PostgreSQL
│   ├── src/
│   ├── database/
│   ├── package.json
│   └── simple-server.js
└── docs/               # Documentation only
```

---

## 🚨 **Action Items Required:**

### **IMMEDIATE CLEANUP:**

#### 1. **Remove Conflicting Files:**
- [ ] Delete root `/src` directory (old React web app)
- [ ] Delete `/api` directory (legacy Runway API)
- [ ] Clean up root `package.json` 
- [ ] Remove unused Docker/CI files

#### 2. **Standardize Environment:**
- [ ] Create proper `.env` files for backend
- [ ] Update mobile environment configuration
- [ ] Remove Firebase dependencies (if not needed)

#### 3. **Database Integration:**
- [ ] Ensure PostgreSQL is properly connected
- [ ] Run migrations
- [ ] Test all database connections

#### 4. **Mobile App:**
- [ ] Verify React Native setup
- [ ] Update API endpoints to point to backend
- [ ] Test authentication flow

#### 5. **Backend API:**
- [ ] Consolidate all APIs into single backend
- [ ] Remove duplicate middleware
- [ ] Standardize error handling
- [ ] Add proper logging

---

## 🔧 **Files to Keep:**

### **Mobile App (React Native):**
```
mobile/
├── App.js ✅
├── package.json ✅
├── src/store/ ✅
├── src/services/ ✅
└── src/components/ ✅
```

### **Backend API:**
```
backend/
├── simple-server.js ✅
├── package.json ✅
├── database/schema.sql ✅
├── scripts/migrate.js ✅
└── public/login.html ✅
```

---

## 🗑️ **Files to Remove:**

### **Root Level Conflicts:**
- `src/` (entire directory)
- `public/` (React app public)
- `package.json` (root level)
- `tailwind.config.js`
- `postcss.config.js`

### **Legacy API:**
- `api/` (entire directory)
- `functions/` (Firebase functions)

### **Unused Integrations:**
- Runway ML files
- Rhode Sign specific files
- Shift4 payment files (unless needed)

---

## 📋 **Migration Steps:**

### **Step 1: Backup Important Code**
1. Extract any useful components from `/src`
2. Save any custom configurations
3. Document current integrations

### **Step 2: Clean File Structure**
1. Remove conflicting directories
2. Update package.json files
3. Clean up environment files

### **Step 3: Test Core Functionality**
1. Test backend API endpoints
2. Test mobile app compilation
3. Test database connections

### **Step 4: Update Mobile App**
1. Point mobile app to backend API
2. Update authentication flow
3. Test complete user journey

---

## 🔗 **Final Architecture:**

### **Backend (Node.js + PostgreSQL):**
- **Port**: 3001
- **Database**: PostgreSQL on 5432
- **API Endpoints**: `/api/*`
- **Authentication**: JWT tokens

### **Mobile (React Native + Expo):**
- **Platform**: iOS/Android
- **State Management**: Redux Toolkit
- **API Client**: Axios
- **Navigation**: React Navigation

### **Development Workflow:**
1. **Backend**: `cd backend && npm run dev`
2. **Mobile**: `cd mobile && npm start`
3. **Database**: PostgreSQL running locally

---

## ⚠️ **Critical Dependencies:**

### **Backend Must-Have:**
- express, cors, helmet
- pg (PostgreSQL client)
- bcryptjs, jsonwebtoken
- express-validator

### **Mobile Must-Have:**
- @react-navigation/*
- @reduxjs/toolkit
- react-redux
- axios

### **Remove Unused:**
- Firebase (unless actively used)
- Runway ML SDK
- React web dependencies
- Duplicate APIs

---

## 🎯 **Success Criteria:**

- [x] Single backend API serving mobile app
- [x] PostgreSQL database working
- [x] React Native app compiling
- [x] Authentication working end-to-end
- [ ] Clean file structure
- [ ] No conflicting dependencies
- [ ] Proper environment setup

---

**Next Steps:** Would you like me to start the cleanup process? I recommend starting with backing up any important code, then removing the conflicting directories.
