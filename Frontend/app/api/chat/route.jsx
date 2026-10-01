

/*
This gives a working API endpoint for the chatbot. For now, it returns a simulated response; later we can connect it to the actual LLM/backend.
*/

export async function POST(request) {
  try {
    const body = await request.json();

    const { message, language, conversationId } = body;

    if (!message || !message.trim()) {
      return Response.json(
        {
          error: "Message is required.",
        },
        { status: 400 }
      );
    }

    // Simulated AI response
    const responses = {
      English: `I understand your question: "${message}". This is a simulated AI response. You can connect this endpoint to your real AI model later.`,
      
      Amharic: `ጥያቄዎን ተረድቻለሁ። "${message}" ብለው ጠይቀዋል። ይህ ለጊዜው የተመሰለ የAI ምላሽ ነው።`,
      
      "Afaan Oromo": `Gaaffii kee nan hubadhe: "${message}". Kun yeroo ammaa deebii AI fakkeeffame dha.`,
      
      Arabic: `لقد فهمت سؤالك: "${message}". هذه إجابة تجريبية للذكاء الاصطناعي.`,
      
      French: `J'ai compris votre question : "${message}". Ceci est actuellement une réponse AI simulée.`,
      
      Spanish: `Entiendo tu pregunta: "${message}". Esta es actualmente una respuesta de IA simulada.`,
      
      Chinese: `我理解你的问题：“${message}”。这是目前的模拟 AI 回复。`,
    };

    const response =
      responses[language] ||
      `I understand your question: "${message}".`;

    return Response.json({
      success: true,
      conversationId,
      message: response,
      language,
    });
  } catch (error) {
    console.error("Chat API error:", error);

    return Response.json(
      {
        success: false,
        error: "Something went wrong while processing your message.",
      },
      { status: 500 }
    );
  }
}