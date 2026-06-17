import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDFG9D7FxNwQjmj_tSliPJvIoqhQENrDXI",
  authDomain: "prox-4d1b7.firebaseapp.com",
  projectId: "prox-4d1b7",
  storageBucket: "prox-4d1b7.firebasestorage.app",
  messagingSenderId: "988640118301",
  appId: "1:988640118301:web:fb76dd891053005935e8f4"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const CLOUDINARY_CLOUD_NAME = "YOUR_CLOUD_NAME";
export const CLOUDINARY_UPLOAD_PRESET = "YOUR_UNSIGNED_PRESET";