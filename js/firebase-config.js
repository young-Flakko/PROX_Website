// ==========================================================================
// Pulse — Firebase configuration
// --------------------------------------------------------------------------
// 1. Go to https://console.firebase.google.com -> create a project.
// 2. Project settings -> General -> "Your apps" -> add a Web app.
// 3. Copy the config object Firebase gives you and paste the values below.
// 4. In the Firebase console, enable:
//      - Authentication -> Sign-in method -> Email/Password
//      - Firestore Database -> Create database (start in test mode for dev,
//        then tighten the security rules before going live)
// ==========================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// TODO: replace with your own Firebase project config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ==========================================================================
// Cloudinary configuration
// --------------------------------------------------------------------------
// 1. Sign up at https://cloudinary.com and find your "Cloud name" on the
//    dashboard.
// 2. Settings -> Upload -> "Upload presets" -> Add upload preset.
//      - Set "Signing Mode" to "Unsigned"
//      - Restrict allowed formats (jpg, png, mp4, etc.) and a max file size
// 3. Put the cloud name and preset name below. These are safe to expose in
//    frontend code (unlike your Cloudinary API secret, which should never
//    appear in this project at all).
// ==========================================================================

export const CLOUDINARY_CLOUD_NAME = "YOUR_CLOUD_NAME";
export const CLOUDINARY_UPLOAD_PRESET = "YOUR_UNSIGNED_UPLOAD_PRESET";
