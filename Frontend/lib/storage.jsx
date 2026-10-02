const STORAGE_KEY = "multi-language-ai-chat-conversations";

function getStorageKey(userId) {
  return `${STORAGE_KEY}:${userId}`;
}

export function getConversations(userId) {
  if (typeof window === "undefined" || !userId) {
    return [];
  }

  try {
    const scopedKey = getStorageKey(userId);
    let stored = localStorage.getItem(scopedKey);

    if (!stored) {
      stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        localStorage.setItem(scopedKey, stored);
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    if (!stored) {
      return [];
    }

    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to load conversations:", error);
    return [];
  }
}

export function saveConversations(conversations, userId) {
  if (typeof window === "undefined" || !userId) {
    return;
  }

  try {
    localStorage.setItem(
      getStorageKey(userId),
      JSON.stringify(conversations)
    );
  } catch (error) {
    console.error("Failed to save conversations:", error);
  }
}

export function clearStoredConversations(userId) {
  if (typeof window === "undefined" || !userId) {
    return;
  }

  localStorage.removeItem(getStorageKey(userId));
}