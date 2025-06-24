# Firebase Setup Guide for VH Banquets

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Name it "VH Banquets" or similar
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Set Up Web App

1. In your Firebase project dashboard, click the web icon (</>)
2. Register app with nickname "VH Banquets Web"
3. Copy the configuration object values
4. Create `.env` file in project root using the `.env.example` template

## Step 3: Configure Firestore Database

1. Go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (we'll secure it later)
4. Select a location (choose closest to your users)
5. Click "Done"

## Step 4: Set Up Authentication

1. Go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Anonymous" sign-in
5. (Optional) Enable "Email/Password" for admin users

## Step 5: Configure Storage

1. Go to "Storage" in the left sidebar
2. Click "Get started"
3. Choose "Start in test mode"
4. Select same location as Firestore
5. Click "Done"

## Step 6: Set Up Security Rules

### Firestore Rules (secure but functional)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow access to app data structure
    match /artifacts/vh-banquets-app/users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow anonymous users to create their own data
    match /artifacts/vh-banquets-app/users/{userId} {
      allow create: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /events/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Current App Features Using Firebase

✅ **Authentication**: Anonymous users auto-signed in
✅ **Event Management**: Create, read, update events in Firestore
✅ **File Upload**: PDF and image uploads to Firebase Storage
✅ **Real-time Updates**: Live data synchronization
✅ **Client Management**: Store client information
✅ **Floor Plans**: Save layout configurations
✅ **Payment Integration**: Store payment records

## Data Structure in Firestore

```text
artifacts/
  vh-banquets-app/
    users/
      {userId}/
        events/
          {eventId}/ → Event documents
        clients/
          {clientId}/ → Client documents  
        floorPlans/
          {planId}/ → Floor plan documents
        files/
          {fileId}/ → File metadata
```

## Next Steps After Setup

1. Copy your Firebase config to `.env` file
2. Test the connection by creating an event
3. Upload a file to test Storage
4. Set up proper security rules
5. Consider adding admin authentication
