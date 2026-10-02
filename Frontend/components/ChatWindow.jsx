"use client";

import { useEffect, useRef } from "react";

import MessageBubble from "./MessageBubble";

const suggestions = [
  {
    title: "Explain AI",
    text: "Explain artificial intelligence in simple terms.",
    icon: "💡",
  },
  {
    title: "Translate",
    text: "Translate 'Good morning, how are you?' into Amharic.",
    icon: "🌍",
  },
  {
    title: "Write",
    text: "Help me write a professional email.",
    icon: "✍️",
  },
  {
    title: "Learn",
    text: "Teach me the basics of machine learning.",
    icon: "🎓",
  },
];

export default function ChatWindow({
  messages,
  language,
  isTyping,
  onSuggestion,
  onEdit,
  onRegenerate,
  onFeedback,
}) {
  const scrollAreaRef = useRef(null);
  const lastMessage = messages[messages.length - 1];

  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    scrollArea.scrollTo({
      top: scrollArea.scrollHeight,
      behavior: "smooth",
    });
  }, [isTyping, messages.length, lastMessage?.id, lastMessage?.content]);

  return (
    <div ref={scrollAreaRef} className="flex-1 overflow-y-auto">
      {messages.length === 0 ? (
        <WelcomeScreen
          language={language}
          onSuggestion={onSuggestion}
        />
      ) : (
        <div className="mx-auto w-full max-w-4xl px-4 py-8">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onEdit={onEdit}
              onRegenerate={onRegenerate}
              onFeedback={onFeedback}
            />
          ))}

          {isTyping && <TypingIndicator />}
        </div>
      )}
    </div>
  );
}

function WelcomeScreen({ language, onSuggestion }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col items-center justify-center px-5 py-12">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#8E288D] text-xl font-bold text-white shadow-lg">
        AI
      </div>

      <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        How can I help you?
      </h1>

      <p className="mt-3 max-w-2xl text-center text-sm leading-6 text-slate-500 sm:text-base">
        Your intelligent multi-language AI assistant. Ask
        questions, translate content, learn new topics, write
        documents, or have a natural conversation.
      </p>

      <div className="mt-5 rounded-full border border-[#8E288D]/20 bg-[#8E288D]/5 px-4 py-2 text-sm font-medium text-[#8E288D]">
        🌍 Responding in {language}
      </div>

      <div className="mt-10 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.title}
            onClick={() => onSuggestion(suggestion.text)}
            className="group rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-[#8E288D]/40 hover:bg-[#8E288D]/5 hover:shadow-md"
          >
            <div className="text-xl">
              {suggestion.icon}
            </div>

            <p className="mt-3 text-sm font-bold text-slate-800">
              {suggestion.title}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              {suggestion.text}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8E288D] text-xs font-bold text-white">
        AI
      </div>

      <div className="flex items-center gap-1 rounded-2xl bg-slate-100 px-4 py-3">
        <span className="typing-dot" />
        <span className="typing-dot animation-delay-150" />
        <span className="typing-dot animation-delay-300" />
      </div>
    </div>
  );
}