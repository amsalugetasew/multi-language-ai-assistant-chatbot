export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

async function getErrorMessage(response, fallback) {
  const errorData = await response.json().catch(() => null);
  const detail = errorData?.detail;

  if (typeof detail === "string") return detail;
  if (detail?.message) return detail.message;
  if (Array.isArray(detail)) {
    const firstIssue = detail[0];
    const field = firstIssue?.loc?.at(-1);
    if (field === "images") {
      return "Images must be JPEG, PNG, or WebP, no larger than 4.5 MB each, with up to three images per message.";
    }
    if (field === "language") return "Choose a supported response language.";
    return firstIssue?.msg || fallback;
  }

  if (response.status === 413) return "The upload is too large. Choose a smaller file.";
  if (response.status === 429) return "The service usage limit was reached. Try again later.";
  if (response.status >= 500) return "The AI service is temporarily unavailable. Try again shortly.";
  return fallback;
}

async function request(url, options, fallback) {
  let response;
  try {
    response = await fetch(url, { ...options, credentials: "include" });
  } catch {
    throw new Error("Cannot connect to the AI backend. Check that it is running and try again.");
  }

  if (!response.ok) {
    const error = new Error(await getErrorMessage(response, fallback));
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function getLanguages() {
  const response = await fetch(`${API_BASE_URL}/api/health/languages`);
  if (!response.ok) {
    throw new Error("Failed to load supported languages.");
  }
  const data = await response.json();
  return data.languages;
}

export async function sendChatMessage({
  message,
  language,
  conversationId,
  attachments = [],
}) {
  return request(
    `${API_BASE_URL}/api/chat`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        language,
        conversation_id: conversationId,
        images: attachments.map((attachment) => attachment.dataUrl),
      }),
    },
    "The message could not be sent. Check it and try again."
  );
}

export async function transcribeAudio(audio, filename) {
  const formData = new FormData();
  formData.append("file", audio, filename);

  const result = await request(
    `${API_BASE_URL}/api/chat/transcribe`,
    { method: "POST", body: formData },
    "Voice transcription failed. Try recording again."
  );
  return result.text;
}

export function loginUser(email, password) {
  return request(
    `${API_BASE_URL}/api/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    },
    "Sign in failed. Check your details and try again."
  );
}

export function registerUser({ fullName, email, password }) {
  return request(
    `${API_BASE_URL}/api/auth/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, email, password }),
    },
    "Registration failed. Check the details and try again."
  );
}

export function getCurrentUser() {
  return request(
    `${API_BASE_URL}/api/auth/me`,
    { method: "GET" },
    "Sign in to continue."
  );
}

export function logoutUser() {
  return request(
    `${API_BASE_URL}/api/auth/logout`,
    { method: "POST" },
    "Could not sign out. Try again."
  );
}

export function changePassword(currentPassword, newPassword) {
  return request(
    `${API_BASE_URL}/api/auth/change-password`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    },
    "Password could not be changed. Check the current password and try again."
  );
}

export function apiRequest(path, options = {}) {
  return request(
    `${API_BASE_URL}${path}`,
    options,
    "The request could not be completed. Check your access and try again."
  );
}

export function uploadProfileImage(file) {
  const formData = new FormData();
  formData.append("file", file, file.name || "profile.jpg");
  return request(
    `${API_BASE_URL}/api/auth/profile-image`,
    { method: "POST", body: formData },
    "Could not upload the profile photo. Try another image."
  );
}

export function deleteProfileImage() {
  return request(
    `${API_BASE_URL}/api/auth/profile-image`,
    { method: "DELETE" },
    "Could not remove the profile photo. Try again."
  );
}

export function updateCurrentProfile({ fullName, email }) {
  return request(
    `${API_BASE_URL}/api/auth/profile`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, email }),
    },
    "Profile details could not be saved. Check the values and try again."
  );
}