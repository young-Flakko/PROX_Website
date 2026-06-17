// ==========================================================================
// Pulse — auth.js
// --------------------------------------------------------------------------
// Included on every page. Handles:
//   - Signup form (signup.html)
//   - Login form (login.html)
//   - Logout button (navbar, every page)
//   - Showing/hiding navbar links based on whether the user is logged in,
//     and whether they are an admin.
//
// Nav elements expected in every page's navbar:
//   .nav-guest      -> only visible when logged OUT (Login / Sign up links)
//   .nav-authed     -> only visible when logged IN (Messages, Upload, Logout...)
//   .nav-admin-only -> only visible when the logged-in user's role is "admin"
//   #nav-profile-link -> "Profile" link, href gets set to profile.html?uid=...
//   #nav-logout-btn   -> logout button
// ==========================================================================

import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --------------------------------------------------------------------------
// Navbar state — runs on every page
// --------------------------------------------------------------------------

onAuthStateChanged(auth, async (user) => {
  const guestEls = document.querySelectorAll(".nav-guest");
  const authedEls = document.querySelectorAll(".nav-authed");
  const adminEls = document.querySelectorAll(".nav-admin-only");
  const profileLink = document.getElementById("nav-profile-link");

  if (user) {
    guestEls.forEach((el) => el.classList.add("hidden"));
    authedEls.forEach((el) => el.classList.remove("hidden"));

    if (profileLink) {
      profileLink.href = `profile.html?uid=${user.uid}`;
    }

    // Check the user's role in Firestore to decide whether to show
    // the Admin nav link.
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const role = userDoc.exists() ? userDoc.data().role : "user";
      adminEls.forEach((el) =>
        el.classList.toggle("hidden", role !== "admin")
      );
    } catch (err) {
      console.error("Could not load user role:", err);
      adminEls.forEach((el) => el.classList.add("hidden"));
    }
  } else {
    guestEls.forEach((el) => el.classList.remove("hidden"));
    authedEls.forEach((el) => el.classList.add("hidden"));
    adminEls.forEach((el) => el.classList.add("hidden"));
  }
});

// --------------------------------------------------------------------------
// Logout button
// --------------------------------------------------------------------------

const logoutBtn = document.getElementById("nav-logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });
}

// --------------------------------------------------------------------------
// Signup form (signup.html)
// --------------------------------------------------------------------------

const signupForm = document.getElementById("signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const displayName = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;
    const errorEl = document.getElementById("signup-error");
    errorEl.textContent = "";

    if (!displayName || !email || !password) {
      errorEl.textContent = "Please fill in all fields.";
      return;
    }

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Create the matching profile document in Firestore.
      // NOTE: the very first account you create will have role "user" too —
      // open the Firestore console afterwards and manually change your own
      // document's "role" field to "admin".
      await setDoc(doc(db, "users", credential.user.uid), {
        displayName,
        bio: "",
        profilePicUrl: "",
        role: "user",
        createdAt: serverTimestamp(),
      });

      window.location.href = "index.html";
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });
}

// --------------------------------------------------------------------------
// Login form (login.html)
// --------------------------------------------------------------------------

const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const errorEl = document.getElementById("login-error");
    errorEl.textContent = "";

    if (!email || !password) {
      errorEl.textContent = "Please fill in all fields.";
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "index.html";
    } catch (err) {
      errorEl.textContent = "Login failed. Check your email and password.";
    }
  });
}
