"use client";

import { useState } from "react";
import Image from "next/image";
import { FiUser, FiCpu, FiCheck, FiCopy } from "react-icons/fi";

export default function MessageBubble({
  message,
  onEdit,
  onRegenerate,
  onFeedback,
}) {
  const isUser = message.role === "user";

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const handleSaveEdit = () => {
    const value = editText.trim();

    if (!value) return;

    onEdit(message.id, value);
    setIsEditing(false);
  };

  return (
    <div
      className={`group flex w-full gap-3 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
          style={{ backgroundColor: "#8E288D" }}
        >
          <FiCpu size={16} />
        </div>
      )}

      <div
        className={`max-w-[80%] ${
          isUser ? "items-end" : "items-start"
        } flex flex-col`}
      >
        {/* Message */}
        {isEditing ? (
          <div className="w-full min-w-[320px] rounded-2xl border border-[#8E288D] bg-white p-3 shadow-sm">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={4}
              autoFocus
              className="w-full resize-none border-0 bg-transparent text-sm text-gray-800 outline-none"
            />

            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditText(message.content);
                  setIsEditing(false);
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveEdit}
                className="rounded-lg bg-[#8E288D] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
              >
                Save & Resend
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
              isUser
                ? "rounded-br-md bg-[#8E288D] text-white"
                : "rounded-bl-md border border-gray-200 bg-white text-gray-800 shadow-sm"
            }`}
          >
            {message.attachments?.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {message.attachments.map((attachment, index) => (
                  <Image
                    key={`${attachment.name}-${index}`}
                    src={attachment.dataUrl}
                    alt={`Attached image: ${attachment.name}`}
                    width={attachment.width || 1280}
                    height={attachment.height || 1280}
                    unoptimized
                    className="h-auto max-h-64 w-auto max-w-full rounded-md object-contain"
                  />
                ))}
              </div>
            )}
            <div className="whitespace-pre-wrap">
              {message.content}
            </div>
          </div>
        )}

        {/* Actions */}
        {!isEditing && (
          <div
            className={`mt-1 flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 ${
              isUser ? "justify-end" : "justify-start"
            }`}
          >
            <button
              onClick={handleCopy}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-[#8E288D]"
              title={copied ? "Copied" : "Copy response"}
              aria-label={copied ? "Copied" : "Copy response"}
            >
              {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
            </button>

            {isUser && (
              <button
                onClick={() => {
                  setEditText(message.content);
                  setIsEditing(true);
                }}
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-[#8E288D]"
                title="Edit"
              >
                ✎
              </button>
            )}

            {!isUser && (
              <button
                onClick={() => onRegenerate(message.id)}
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-[#8E288D]"
                title="Regenerate"
              >
                ↻
              </button>
            )}

            {!isUser && (
              <>
                <button
                  onClick={() => onFeedback(message.id, "like")}
                  className={`rounded-md p-1.5 text-sm hover:bg-gray-100 ${
                    message.feedback === "like"
                      ? "text-[#8E288D]"
                      : "text-gray-400"
                  }`}
                  title="Good response"
                >
                  👍
                </button>

                <button
                  onClick={() => onFeedback(message.id, "dislike")}
                  className={`rounded-md p-1.5 text-sm hover:bg-gray-100 ${
                    message.feedback === "dislike"
                      ? "text-red-500"
                      : "text-gray-400"
                  }`}
                  title="Bad response"
                >
                  👎
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-gray-600">
          <FiUser size={16} />
        </div>
      )}
    </div>
  );
}