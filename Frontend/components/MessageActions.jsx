"use client";

import { useState } from "react";

export default function MessageActions({
  message,
  onCopy,
  onEdit,
  onRegenerate,
  onFeedback,
}) {
  const [copied, setCopied] = useState(false);

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message.content);

    setCopied(true);
    onCopy?.(message);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  if (message.role === "user") {
    return (
      <button
        onClick={() => onEdit(message)}
        className="message-action"
        title="Edit message"
      >
        ✏️
        <span>Edit</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={copyMessage}
        className="message-action"
        title="Copy"
      >
        {copied ? "✓" : "📋"}
        <span>{copied ? "Copied" : "Copy"}</span>
      </button>

      <button
        onClick={() => onRegenerate(message)}
        className="message-action"
        title="Regenerate response"
      >
        🔄
        <span>Regenerate</span>
      </button>

      <button
        onClick={() => onFeedback(message.id, "like")}
        className={`message-icon-action ${
          message.feedback === "like"
            ? "bg-green-50 text-green-600"
            : ""
        }`}
        title="Good response"
      >
        👍
      </button>

      <button
        onClick={() => onFeedback(message.id, "dislike")}
        className={`message-icon-action ${
          message.feedback === "dislike"
            ? "bg-red-50 text-red-600"
            : ""
        }`}
        title="Bad response"
      >
        👎
      </button>
    </div>
  );
}