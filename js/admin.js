// ==========================================================================
// Pulse — admin.js (admin.html)
// --------------------------------------------------------------------------
// - Redirects away anyone who isn't logged in as an admin.
// - Lists every post (public or not) with a toggle for isPublic — this is
//   the core of the "what's visible on the public side" control.
// - Lists every user with a toggle to disable/enable their account.
//
// IMPORTANT: this page-level check is just for the UI. The real
// enforcement has to happen in Firestore Security Rules — see README.md.
// Without matching security rules, a user could bypass this page entirely
// and write to Firestore directly.
// ==========================================================================

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const postsTableBody = document.getElementById("admin-posts-body");
const usersTableBody = document.getElementById("admin-users-body");
const accessDeniedEl = document.getElementById("admin-denied");
const adminContentEl = document.getElementById("admin-content");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const userDoc = await getDoc(doc(db, "users", user.uid));
  const role = userDoc.exists() ? userDoc.data().role : "user";

  if (role !== "admin") {
    accessDeniedEl.classList.remove("hidden");
    adminContentEl.classList.add("hidden");
    return;
  }

  loadPosts();
  loadUsers();
});

// --------------------------------------------------------------------------
// Posts moderation
// --------------------------------------------------------------------------

async function loadPosts() {
  const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(postsQuery);

  postsTableBody.innerHTML = "";

  for (const postDoc of snapshot.docs) {
    const post = postDoc.data();

    let ownerName = "Unknown";
    try {
      const ownerDoc = await getDoc(doc(db, "users", post.ownerId));
      if (ownerDoc.exists()) ownerName = ownerDoc.data().displayName;
    } catch (err) {
      console.error(err);
    }

    const row = document.createElement("tr");
    const thumb =
      post.mediaType === "video"
        ? `<video class="media-thumb" src="${post.mediaUrl}" muted></video>`
        : `<img class="media-thumb" src="${post.mediaUrl}" alt="" />`;

    row.innerHTML = `
      <td>${thumb}</td>
      <td>${escapeHtml(ownerName)}</td>
      <td>${escapeHtml(post.caption || "")}</td>
      <td>
        <span class="badge ${post.isPublic ? "badge-public" : "badge-hidden"}">
          ${post.isPublic ? "Public" : "Hidden"}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-ghost toggle-post-btn" data-id="${postDoc.id}" data-public="${post.isPublic}">
          ${post.isPublic ? "Hide" : "Approve"}
        </button>
      </td>
    `;

    postsTableBody.appendChild(row);
  }

  // Wire up toggle buttons.
  postsTableBody.querySelectorAll(".toggle-post-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const postId = btn.dataset.id;
      const isPublic = btn.dataset.public === "true";

      await updateDoc(doc(db, "posts", postId), { isPublic: !isPublic });
      loadPosts(); // refresh the table
    });
  });
}

// --------------------------------------------------------------------------
// User management
// --------------------------------------------------------------------------

async function loadUsers() {
  const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(usersQuery);

  usersTableBody.innerHTML = "";

  snapshot.forEach((userDoc) => {
    const user = userDoc.data();
    const disabled = !!user.disabled;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td><a href="profile.html?uid=${userDoc.id}">${escapeHtml(user.displayName || "Unnamed")}</a></td>
      <td>${user.role === "admin" ? '<span class="badge badge-admin">Admin</span>' : "User"}</td>
      <td>${disabled ? '<span class="badge badge-hidden">Disabled</span>' : '<span class="badge badge-public">Active</span>'}</td>
      <td>
        <button class="btn btn-sm btn-ghost toggle-user-btn" data-id="${userDoc.id}" data-disabled="${disabled}">
          ${disabled ? "Enable" : "Disable"}
        </button>
      </td>
    `;
    usersTableBody.appendChild(row);
  });

  usersTableBody.querySelectorAll(".toggle-user-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const userId = btn.dataset.id;
      const disabled = btn.dataset.disabled === "true";

      await updateDoc(doc(db, "users", userId), { disabled: !disabled });
      loadUsers(); // refresh the table
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
