// ==========================================================================
// Pulse — profile.js (profile.html)
// --------------------------------------------------------------------------
// Loads a profile based on the ?uid=... query string. If no uid is given,
// or the uid matches the logged-in user, shows the "edit profile" form too.
//
// Posts:
//   - Viewing your OWN profile shows all of your posts (public + pending).
//   - Viewing someone ELSE's profile only shows their public posts.
// ==========================================================================

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
let profileUid = params.get("uid");

const profileHeader = document.getElementById("profile-header");
const editSection = document.getElementById("profile-edit-section");
const postsGrid = document.getElementById("profile-posts");
const postsEmpty = document.getElementById("profile-posts-empty");

onAuthStateChanged(auth, (currentUser) => {
  // No uid in the URL -> default to "my profile".
  if (!profileUid && currentUser) {
    profileUid = currentUser.uid;
  }

  if (!profileUid) {
    profileHeader.innerHTML =
      '<p>No profile to show. <a href="login.html">Log in</a> to view your profile.</p>';
    return;
  }

  const isOwnProfile = currentUser && currentUser.uid === profileUid;
  loadProfile(profileUid, isOwnProfile);
  loadPosts(profileUid, isOwnProfile);

  if (isOwnProfile) {
    setupEditForm(profileUid);
  }
});

async function loadProfile(uid, isOwnProfile) {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (!userDoc.exists()) {
    profileHeader.innerHTML = "<p>This profile does not exist.</p>";
    return;
  }

  const data = userDoc.data();
  const avatar = data.profilePicUrl || "assets/default-avatar.png";

  profileHeader.innerHTML = `
    <img class="avatar" src="${avatar}" alt="${escapeHtml(data.displayName)}'s avatar" />
    <div class="profile-info">
      <h1>${escapeHtml(data.displayName || "Unnamed user")}</h1>
      <p class="bio">${escapeHtml(data.bio || "No bio yet.")}</p>
      ${data.role === "admin" ? '<span class="role-badge">Admin</span>' : ""}
    </div>
  `;

  if (isOwnProfile) {
    editSection.classList.remove("hidden");
    document.getElementById("edit-name").value = data.displayName || "";
    document.getElementById("edit-bio").value = data.bio || "";
  }
}

async function loadPosts(uid, isOwnProfile) {
  let postsQuery;

  if (isOwnProfile) {
    // Show everything this user has posted, public or not.
    postsQuery = query(
      collection(db, "posts"),
      where("ownerId", "==", uid),
      orderBy("createdAt", "desc")
    );
  } else {
    // Only show this user's public posts to other visitors.
    postsQuery = query(
      collection(db, "posts"),
      where("ownerId", "==", uid),
      where("isPublic", "==", true),
      orderBy("createdAt", "desc")
    );
  }

  const snapshot = await getDocs(postsQuery);
  postsGrid.innerHTML = "";

  if (snapshot.empty) {
    postsEmpty.classList.remove("hidden");
    return;
  }
  postsEmpty.classList.add("hidden");

  snapshot.forEach((docSnap) => {
    const post = docSnap.data();
    const card = document.createElement("div");
    card.className = "post-card";

    let mediaHtml;
    if (post.mediaType === "video") {
      mediaHtml = `<video class="media" src="${post.mediaUrl}" controls muted></video>`;
    } else {
      mediaHtml = `<img class="media" src="${post.mediaUrl}" alt="Post image" />`;
    }

    card.innerHTML = `
      ${mediaHtml}
      <div class="post-body">
        <p class="post-caption">${post.caption ? escapeHtml(post.caption) : ""}</p>
        ${
          isOwnProfile
            ? `<span class="badge ${post.isPublic ? "badge-public" : "badge-hidden"}">
                 ${post.isPublic ? "Public" : "Pending review"}
               </span>`
            : ""
        }
      </div>
    `;

    postsGrid.appendChild(card);
  });
}

function setupEditForm(uid) {
  const form = document.getElementById("edit-profile-form");
  const successEl = document.getElementById("edit-success");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    successEl.textContent = "";

    const displayName = document.getElementById("edit-name").value.trim();
    const bio = document.getElementById("edit-bio").value.trim();

    await updateDoc(doc(db, "users", uid), {
      displayName,
      bio,
    });

    successEl.textContent = "Profile updated!";
    loadProfile(uid, true);

    // TODO: profile picture upload — reuse the Cloudinary upload pattern
    // from upload.js, then updateDoc(..., { profilePicUrl: <returned url> })
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
