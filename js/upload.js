// ==========================================================================
// Pulse — upload.js (upload.html)
// --------------------------------------------------------------------------
// 1. User picks a photo or video.
// 2. The file is sent directly to Cloudinary using an UNSIGNED upload
//    preset (see firebase-config.js for where to set the cloud name and
//    preset name).
// 3. Cloudinary returns a URL for the uploaded file.
// 4. We create a new document in the "posts" collection with that URL.
//    New posts start with isPublic: false — the admin has to approve them
//    before they show up on the public feed (see admin.js).
// ==========================================================================

import { auth, db, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const form = document.getElementById("upload-form");
const fileInput = document.getElementById("upload-file");
const captionInput = document.getElementById("upload-caption");
const preview = document.getElementById("upload-preview");
const progressBar = document.getElementById("upload-progress");
const progressFill = progressBar.querySelector(".fill");
const statusEl = document.getElementById("upload-status");
const submitBtn = document.getElementById("upload-submit");

let currentUser = null;

// Only logged-in users can upload — bounce guests to the login page.
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    currentUser = user;
  }
});

// Show a quick preview of the chosen file.
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) {
    preview.classList.remove("visible");
    return;
  }

  const url = URL.createObjectURL(file);
  if (file.type.startsWith("video/")) {
    preview.outerHTML = `<video id="upload-preview" class="upload-preview visible" src="${url}" controls></video>`;
  } else {
    preview.outerHTML = `<img id="upload-preview" class="upload-preview visible" src="${url}" alt="Preview" />`;
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.textContent = "";

  const file = fileInput.files[0];
  if (!file) {
    statusEl.textContent = "Please choose a photo or video first.";
    return;
  }
  if (!currentUser) {
    statusEl.textContent = "You need to be logged in to upload.";
    return;
  }

  const mediaType = file.type.startsWith("video/") ? "video" : "image";

  submitBtn.disabled = true;
  progressBar.classList.add("visible");
  statusEl.textContent = "Uploading...";

  try {
    const mediaUrl = await uploadToCloudinary(file, (percent) => {
      progressFill.style.width = `${percent}%`;
    });

    await addDoc(collection(db, "posts"), {
      ownerId: currentUser.uid,
      mediaUrl,
      mediaType,
      caption: captionInput.value.trim(),
      isPublic: false, // admin approves before this appears on the public feed
      createdAt: serverTimestamp(),
    });

    statusEl.textContent = "Uploaded! Your post is pending admin approval.";
    form.reset();
    progressBar.classList.remove("visible");
    progressFill.style.width = "0%";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Something went wrong with the upload. Try again.";
  } finally {
    submitBtn.disabled = false;
  }
});

// Uploads a file to Cloudinary using XHR so we can report progress.
// Returns a Promise that resolves with the secure_url of the upload.
function uploadToCloudinary(file, onProgress) {
  return new Promise((resolve, reject) => {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);
        resolve(response.secure_url);
      } else {
        reject(new Error(`Cloudinary upload failed: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(formData);
  });
}
