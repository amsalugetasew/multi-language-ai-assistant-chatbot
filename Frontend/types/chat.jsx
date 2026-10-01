export const createMessage = ({
  role,
  content,
  id = crypto.randomUUID(),
}) => ({
  id,
  role,
  content,
  createdAt: new Date().toISOString(),
  feedback: null,
});

export const createConversation = ({
  title = "New Chat",
  language = "English",
} = {}) => ({
  id: crypto.randomUUID(),
  title,
  language,
  messages: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  pinned: false,
  archived: false,
});