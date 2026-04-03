# 615Nav — Setup Guide

## Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- EAS CLI (for TestFlight): `npm install -g eas-cli`
- iOS device or simulator / Android device or emulator

---

## 1. Install Dependencies

```bash
cd 615nav
npm install
```

---

## 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project called **615nav**
3. Enable the following services:
   - **Authentication** → Email/Password
   - **Firestore Database** → Start in production mode
   - **Storage** → Default bucket
4. Register an iOS app (bundle ID: `com.nashville.615nav`)
5. Copy the config from **Project Settings → Your Apps → SDK snippet → Config**
6. Paste into `src/services/firebase.js` replacing the placeholder values

### Firestore Security Rules (paste in Firebase Console)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
    match /comments/{commentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow delete: if request.auth.uid == resource.data.userId;
    }
    match /notifications/{notifId} {
      allow read, write: if request.auth.uid == resource.data.toUserId;
      allow create: if request.auth != null;
    }
  }
}
```

### Storage Rules
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.resource.size < 50 * 1024 * 1024;
    }
  }
}
```

---

## 3. Configure Google Places API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Places API** and **Maps SDK for iOS/Android**
3. Create an API key
4. Paste into `src/services/placesService.js`:
   ```js
   const GOOGLE_PLACES_API_KEY = 'YOUR_KEY_HERE';
   ```
5. Also add to `app.json` under `expo.android.config.googleMaps.apiKey` and `expo.ios.config.googleMapsApiKey`

> **Note:** Without a Places API key, the app uses realistic mock Nashville data.

---

## 4. Run Locally

```bash
# Start Expo dev server
npx expo start

# iOS Simulator
npx expo start --ios

# Android
npx expo start --android
```

---

## 5. Build for TestFlight

```bash
# Login to EAS
eas login

# Configure build
eas build:configure

# Build for iOS (creates .ipa)
eas build --platform ios

# Submit to TestFlight
eas submit --platform ios
```

---

## App Architecture

```
615nav/
├── App.js                     # Root: providers + navigation container
├── src/
│   ├── theme/colors.js        # Brand palette + typography
│   ├── context/
│   │   ├── AuthContext.js     # Firebase auth state + user profile
│   │   └── AppContext.js      # Location + global app state
│   ├── navigation/
│   │   ├── MainNavigator.js   # Bottom tab bar (5 tabs)
│   │   └── *Stack.js          # Per-tab stack navigators
│   ├── screens/
│   │   ├── auth/AuthScreen.js
│   │   ├── home/
│   │   │   ├── HomeScreen.js      # Real-time feed
│   │   │   ├── CreatePostScreen.js # Photo/video upload + anonymous posting
│   │   │   └── CommentsScreen.js  # Threaded comments
│   │   ├── map/MapScreen.js       # Live Nashville alerts map
│   │   ├── places/
│   │   │   ├── PlacesScreen.js    # Google Places by category
│   │   │   └── PlaceDetailScreen.js
│   │   ├── notifications/NotificationsScreen.js
│   │   └── profile/
│   │       ├── ProfileScreen.js
│   │       └── EditProfileScreen.js
│   ├── components/
│   │   ├── PostCard.js
│   │   └── Avatar.js
│   ├── services/
│   │   ├── firebase.js
│   │   ├── postService.js
│   │   ├── notificationService.js
│   │   ├── placesService.js
│   │   ├── locationService.js
│   │   └── alertService.js
│   └── utils/time.js
```

---

## Brand Colors

| Token | Hex | Usage |
|---|---|---|
| Primary Red | `#EB1414` | Buttons, CTAs, highlights |
| Cream | `#EDD5B4` | Text on red, accents |
| Charcoal | `#383731` | Secondary backgrounds |
| Warm Gray | `#CCC1B9` | Borders, secondary text |
| Near Black | `#1A1916` | Main background, nav |
