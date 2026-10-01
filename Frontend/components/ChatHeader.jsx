"use client";

import LanguageSelector from "./LanguageSelector";

export default function ChatHeader({
  sidebarOpen,
  setSidebarOpen,
  language,
  setLanguage,
  conversation,
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          ☰
        </button>

        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold text-slate-800">
            {conversation?.title || "AI Assistant"}
          </h2>

          <p className="text-xs text-slate-400">
            Multilingual AI conversation
          </p>
        </div>
      </div>

      <LanguageSelector
        language={language}
        onChange={setLanguage}
      />
    </header>
  );
}