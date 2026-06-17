// ==========================================================================
// Pulse — feed.js (index.html)
// --------------------------------------------------------------------------
// Loads every post where isPublic == true and renders it as a card.
// This is the "public side" of the platform — anyone can see this,
// logged in or not.
// ==========================================================================

import { db } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const feedEl = document.getElementById("feed");
const emptyEl = document.getElementById("feed-empty");

async function loadFeed() {
  feedEl.innerHTML = "";

  const postsQuery = query(
    collection(db, "posts"),
    where("isPublic", "==", true),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(postsQuery);

  if (snapshot.empty) {
    emptyEl.classList.remove("hidden");
    return;
  }
  emptyEl.classList.add("hidden");

  for (const docSnap of snapshot.docs) {
    const post = docSnap.data();
    const card = await buildPostCard(post);
    feedEl.appendChild(card);
  }
}

async function buildPostCard(post) {
  // Look up the author's display name for the card.
  let authorName = "Unknown";
  try {
    const authorDoc = await getDoc(doc(db, "users", post.ownerId));
    if (authorDoc.exists()) {
      authorName = authorDoc.data().displayName || "Unknown";
    }
  } catch (err) {
    console.error("Could not load author:", err);
  }

  const card = document.createElement("div");
  card.className = "post-card";

  // Image or video media
  let mediaHtml;
  if (post.mediaType === "video") {
    mediaHtml = `<video class="media" src="${post.mediaUrl}" controls muted></video>`;
  } else {
    mediaHtml = `<img class="media" src="${post.mediaUrl}" alt="Post image" />`;
  }

  card.innerHTML = `
    ${mediaHtml}
    <div class="post-body">
      <div class="post-author">
        <a href="profile.html?uid=${post.ownerId}">@${authorName}</a>
      </div>
      <p class="post-caption">${post.caption ? escapeHtml(post.caption) : ""}</p>
    </div>
  `;

  return card;
}

// Basic HTML-escaping so user captions can't inject markup.
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

loadFeed();
