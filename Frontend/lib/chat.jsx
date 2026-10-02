import { sendChatMessage } from "./api";

export async function generateAIResponse(message, language, attachments = []) {
  const result = await sendChatMessage({ message, language, attachments });
  return result.message;
}