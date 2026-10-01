const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

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
}) {
  const response = await fetch(
    `${API_BASE_URL}/api/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        language,
        conversation_id: conversationId,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.detail ||
        "Failed to communicate with AI backend."
    );
  }

  return response.json();
}