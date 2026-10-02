"use client";

import { useMemo, useState } from "react";
import ConversationMenu from "./ConversationMenu";

export default function ChatSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onRename,
  onPin,
  onArchive,
  onDelete,
  onDeleteAll,
  isOpen,
}) {
  const [search, setSearch] = useState("");
  const [menuId, setMenuId] = useState(null);

  const visibleConversations = useMemo(() => {
    const query = search.toLowerCase().trim();

    return conversations.filter((conversation) => {
      if (conversation.archived) return false;

      if (!query) return true;

      return conversation.title
        .toLowerCase()
        .includes(query);
    });
  }, [conversations, search]);

  const pinned = visibleConversations.filter(
    (item) => item.pinned
  );

  const recent = visibleConversations.filter(
    (item) => !item.pinned
  );

  if (!isOpen) {
    return null;
  }

  return (
    <aside className="flex w-[280px] shrink-0 flex-col border-r border-slate-200 bg-[#f8f8fa]">
      {/* Brand */}
      {/* <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8E288D] text-sm font-bold text-white shadow-sm">
          AI
        </div>

        <div>
          <h1 className="text-sm font-bold text-slate-900">
            AI Assistant
          </h1>
          <p className="text-xs text-slate-500">
            Multi-Language
          </p>
        </div>
      </div> */}

      {/* New chat */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#8E288D] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#701460]"
        >
          <span className="text-lg">＋</span>
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
          <span className="text-slate-400">⌕</span>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />

          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-slate-400 hover:text-slate-700"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {pinned.length > 0 && (
          <ConversationSection
            title="Pinned"
            conversations={pinned}
            activeConversationId={activeConversationId}
            menuId={menuId}
            setMenuId={setMenuId}
            onSelectConversation={onSelectConversation}
            onRename={onRename}
            onPin={onPin}
            onArchive={onArchive}
            onDelete={onDelete}
          />
        )}

        <ConversationSection
          title="Recent"
          conversations={recent}
          activeConversationId={activeConversationId}
          menuId={menuId}
          setMenuId={setMenuId}
          onSelectConversation={onSelectConversation}
          onRename={onRename}
          onPin={onPin}
          onArchive={onArchive}
          onDelete={onDelete}
        />

        {visibleConversations.length === 0 && (
          <div className="px-4 py-10 text-center">
            <div className="text-2xl">💬</div>
            <p className="mt-2 text-sm font-medium text-slate-600">
              No conversations
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Start a new chat to begin.
            </p>
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="border-t border-slate-200 p-3">
        <button className="sidebar-bottom-button">
          ⚙️
          Settings
        </button>

        <button className="sidebar-bottom-button">
          ❓
          Help & Support
        </button>

        {conversations.length > 0 && (
          <button
            onClick={onDeleteAll}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-500 transition hover:bg-red-50"
          >
            🗑️
            Delete all chats
          </button>
        )}
      </div>
    </aside>
  );
}

function ConversationSection({
  title,
  conversations,
  activeConversationId,
  menuId,
  setMenuId,
  onSelectConversation,
  onRename,
  onPin,
  onArchive,
  onDelete,
}) {
  return (
    <div className="mb-5">
      <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {title}
      </p>

      <div className="space-y-1">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className="group relative"
          >
            <button
              onClick={() =>
                onSelectConversation(conversation.id)
              }
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 pr-10 text-left text-sm transition ${
                activeConversationId === conversation.id
                  ? "bg-[#8E288D]/10 font-semibold text-[#8E288D]"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span className="shrink-0 text-sm">
                {conversation.pinned ? "📌" : "💬"}
              </span>

              <span className="min-w-0 flex-1 truncate">
                {conversation.title}
              </span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuId(
                  menuId === conversation.id
                    ? null
                    : conversation.id
                );
              }}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 opacity-0 transition hover:bg-white hover:text-slate-700 group-hover:opacity-100"
            >
              ⋯
            </button>

            {menuId === conversation.id && (
              <ConversationMenu
                conversation={conversation}
                onRename={onRename}
                onPin={onPin}
                onArchive={onArchive}
                onDelete={onDelete}
                onClose={() => setMenuId(null)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}