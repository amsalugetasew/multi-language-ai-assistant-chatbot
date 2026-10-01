"use client";

import { useEffect, useRef } from "react";

export default function ChatInput({
  value,
  onChange,
  onSend,
  language,
  isTyping,
  onStop,
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!textareaRef.current) return;

    textareaRef.current.style.height = "auto";

    textareaRef.current.style.height =
      `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
  }, [value]);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (!isTyping) {
        onSend();
      }
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-4">
      <div className="mx-auto w-full max-w-4xl">
        <div className="relative rounded-2xl border border-slate-300 bg-white shadow-sm transition focus-within:border-[#8E288D] focus-within:ring-2 focus-within:ring-[#8E288D]/10">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={`Message AI Assistant in ${language}...`}
            className="max-h-40 min-h-[58px] w-full resize-none bg-transparent px-4 py-4 pr-28 text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />

          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1">
            <button
              type="button"
              className="input-icon-button"
              title="Attach file"
            >
              📎
            </button>

            <button
              type="button"
              className="input-icon-button"
              title="Voice input"
            >
              🎤
            </button>

            {isTyping ? (
              <button
                type="button"
                onClick={onStop}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-white transition hover:bg-slate-700"
                title="Stop generating"
              >
                ■
              </button>
            ) : (
              <button
                type="button"
                onClick={onSend}
                disabled={!value.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#8E288D] text-lg font-bold text-white transition hover:bg-[#701460] disabled:cursor-not-allowed disabled:opacity-40"
                title="Send message"
              >
                ↑
              </button>
            )}
          </div>
        </div>

        <p className="mt-2 text-center text-[11px] text-slate-400">
          Press Enter to send · Shift + Enter for a new line
        </p>
      </div>
    </div>
  );
}