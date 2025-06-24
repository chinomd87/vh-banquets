# Firebase Console Configuration Checklist

Your Firebase project: **vh-banquets**
Console URL: <https://console.firebase.google.com/project/vh-banquets>

## ✅ Configuration Complete

- [x] Firebase project created
- [x] Web app registered  
- [x] Configuration added to .env.local
- [x] App starting with Firebase connection

## 🔧 Required Firebase Services Setup

### 1. Enable Authentication

**Location**: Authentication > Sign-in method

- [ ] Enable **Anonymous** provider (required for your app)
- [ ] (Optional) Enable **Email/Password** for admin users

### 2. Create Firestore Database

**Location**: Firestore Database

- [ ] Click "Create database"
- [ ] Choose "Start in test mode" (for development)
- [ ] Select your preferred location
- [ ] Click "Done"

### 3. Enable Cloud Storage

**Location**: Storage

- [ ] Click "Get started"
- [ ] Choose "Start in test mode"
- [ ] Select same location as Firestore
- [ ] Click "Done"

### 4. Set Security Rules (Important!)

#### Firestore Rules

**Location**: Firestore Database > Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to access their own data
    match /artifacts/vh-banquets-app/users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

#### Storage Rules

**Location**: Storage > Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload files to their folders
    match /events/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🧪 Test Your Setup

Once services are enabled, test these features:

1. **Create an Event** - Tests Firestore write
2. **Upload a File** - Tests Storage upload  
3. **View Dashboard** - Tests Firestore read
4. **Check Browser Console** - Look for any Firebase errors

## 🚀 Your App's Firebase Features

With these services enabled, your app will have:

- ✅ **User Authentication** (anonymous)
- ✅ **Event Management** (create, edit, delete)
- ✅ **File Uploads** (PDFs, images)
- ✅ **Real-time Updates** (live data sync)
- ✅ **Client Management**
- ✅ **Inventory Tracking**
- ✅ **Floor Plan Designer**
- ✅ **Menu Management**

## 📋 Next Steps

1. Complete the service setup above (10 minutes)
2. Test by creating an event in your app
3. Upload a sample PDF to test file storage
4. Check that data appears in Firebase Console

**Need Help?**

- [Firebase Console](https://console.firebase.google.com/project/vh-banquets)
- [Documentation](https://firebase.google.com/docs)
- Check browser console for any connection errors
