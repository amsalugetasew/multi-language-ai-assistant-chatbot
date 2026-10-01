import { sendChatMessage } from "./api";

export async function generateAIResponse(message, language) {
  const result = await sendChatMessage({ message, language });
  return result.message;
}