"use client";

import { useEffect, useRef } from "react";

export default function ConversationMenu({
  conversation,
  onRename,
  onPin,
  onArchive,
  onDelete,
  onClose,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute right-2 top-10 z-50 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
    >
      <button
        onClick={() => {
          onRename(conversation);
          onClose();
        }}
        className="menu-item"
      >
        ✏️
        <span>Rename</span>
      </button>

      <button
        onClick={() => {
          onPin(conversation.id);
          onClose();
        }}
        className="menu-item"
      >
        📌
        <span>
          {conversation.pinned ? "Unpin" : "Pin"}
        </span>
      </button>

      <button
        onClick={() => {
          onArchive(conversation.id);
          onClose();
        }}
        className="menu-item"
      >
        📦
        <span>
          {conversation.archived ? "Unarchive" : "Archive"}
        </span>
      </button>

      <div className="my-1 border-t border-slate-100" />

      <button
        onClick={() => {
          onDelete(conversation);
          onClose();
        }}
        className="menu-item text-red-600 hover:bg-red-50"
      >
        🗑️
        <span>Delete</span>
      </button>
    </div>
  );
}