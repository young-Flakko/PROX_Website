// ==========================================================================
// Pulse — messages.js (messages.html)
// --------------------------------------------------------------------------
// - Lists conversations the logged-in user is part of.
// - Opens a real-time chat for the selected conversation using onSnapshot,
//   so new messages appear instantly without refreshing.
// - "New message" lets you start a conversation by typing the other
//   person's exact display name (a real app would have a proper search /
//   user picker — this is the simplest version for a skeleton).
// ==========================================================================

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const conversationListEl = document.getElementById("conversation-list");
const chatWindowEl = document.getElementById("chat-window");
const newMessageBtn = document.getElementById("new-message-btn");

let currentUser = null;
let activeConversationId = null;
let unsubscribeMessages = null;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  loadConversations();
});

// --------------------------------------------------------------------------
// Conversation list
// --------------------------------------------------------------------------

async function loadConversations() {
  const convQuery = query(
    collection(db, "conversations"),
    where("participants", "array-contains", currentUser.uid),
    orderBy("lastUpdated", "desc")
  );

  const snapshot = await getDocs(convQuery);
  conversationListEl.innerHTML = "";

  if (snapshot.empty) {
    conversationListEl.innerHTML =
      '<div class="conversation-item">No conversations yet. Start one below.</div>';
    return;
  }

  for (const convDoc of snapshot.docs) {
    const conv = convDoc.data();
    const otherUid = conv.participants.find((id) => id !== currentUser.uid);

    let otherName = "Unknown user";
    try {
      const otherDoc = await getDoc(doc(db, "users", otherUid));
      if (otherDoc.exists()) otherName = otherDoc.data().displayName;
    } catch (err) {
      console.error(err);
    }

    const item = document.createElement("div");
    item.className = "conversation-item";
    item.dataset.id = convDoc.id;
    item.innerHTML = `
      <div class="conv-name">${escapeHtml(otherName)}</div>
      <div class="conv-preview">${escapeHtml(conv.lastMessage || "")}</div>
    `;
    item.addEventListener("click", () => openConversation(convDoc.id, otherName));
    conversationListEl.appendChild(item);
  }
}

// --------------------------------------------------------------------------
// Open a conversation + real-time message listener
// --------------------------------------------------------------------------

function openConversation(conversationId, otherName) {
  activeConversationId = conversationId;

  // Highlight the active conversation in the list.
  document.querySelectorAll(".conversation-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.id === conversationId);
  });

  chatWindowEl.innerHTML = `
    <div class="chat-header">${escapeHtml(otherName)}</div>
    <div class="chat-messages" id="chat-messages"></div>
    <form class="chat-input-row" id="chat-form">
      <input type="text" id="chat-input" placeholder="Type a message..." autocomplete="off" required />
      <button type="submit" class="btn btn-primary">Send</button>
    </form>
  `;

  const messagesEl = document.getElementById("chat-messages");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");

  // Stop listening to the previous conversation's messages.
  if (unsubscribeMessages) unsubscribeMessages();

  const messagesQuery = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("sentAt", "asc")
  );

  unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
    messagesEl.innerHTML = "";
    snapshot.forEach((msgDoc) => {
      const msg = msgDoc.data();
      const bubble = document.createElement("div");
      bubble.className =
        "message-bubble" + (msg.senderId === currentUser.uid ? " own" : "");
      bubble.textContent = msg.text;
      messagesEl.appendChild(bubble);
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });

  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    await addDoc(
      collection(db, "conversations", conversationId, "messages"),
      {
        senderId: currentUser.uid,
        text,
        sentAt: serverTimestamp(),
      }
    );

    await updateDoc(doc(db, "conversations", conversationId), {
      lastMessage: text,
      lastUpdated: serverTimestamp(),
    });

    chatInput.value = "";
  });
}

// --------------------------------------------------------------------------
// Start a new conversation
// --------------------------------------------------------------------------

if (newMessageBtn) {
  newMessageBtn.addEventListener("click", async () => {
    const name = prompt("Start a conversation with (exact display name):");
    if (!name) return;

    // Find the user by display name.
    const usersQuery = query(
      collection(db, "users"),
      where("displayName", "==", name.trim())
    );
    const snapshot = await getDocs(usersQuery);

    if (snapshot.empty) {
      alert("No user found with that display name.");
      return;
    }

    const otherDoc = snapshot.docs[0];
    const otherUid = otherDoc.id;

    if (otherUid === currentUser.uid) {
      alert("You can't message yourself.");
      return;
    }

    // Check if a conversation already exists between these two users.
    const existingQuery = query(
      collection(db, "conversations"),
      where("participants", "array-contains", currentUser.uid)
    );
    const existingSnap = await getDocs(existingQuery);
    let conversationId = null;
    existingSnap.forEach((convDoc) => {
      const participants = convDoc.data().participants;
      if (participants.includes(otherUid)) {
        conversationId = convDoc.id;
      }
    });

    if (!conversationId) {
      const newConvRef = await addDoc(collection(db, "conversations"), {
        participants: [currentUser.uid, otherUid],
        lastMessage: "",
        lastUpdated: serverTimestamp(),
      });
      conversationId = newConvRef.id;
    }

    await loadConversations();
    openConversation(conversationId, otherDoc.data().displayName);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
