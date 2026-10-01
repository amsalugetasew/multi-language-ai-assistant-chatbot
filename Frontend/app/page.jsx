"use client";

import { useEffect, useMemo, useState } from "react";

import ChatSidebar from "@/components/ChatSidebar";
import ChatHeader from "@/components/ChatHeader";
import ChatWindow from "@/components/ChatWindow";
import ChatInput from "@/components/ChatInput";
import ConfirmDialog from "@/components/ConfirmDialog";

import {
  createConversation,
  createMessage,
} from "../types/chat";

import {
  getConversations,
  saveConversations,
} from "../lib/storage";

import { generateAIResponse } from "../lib/chat";

export default function Home() {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] =
    useState(null);

  const [language, setLanguage] = useState("English");
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

  /* =========================
     LOAD SAVED CHATS
  ========================= */

  useEffect(() => {
    const saved = getConversations();

    setConversations(saved);

    if (saved.length > 0) {
      setActiveConversationId(saved[0].id);
      setLanguage(saved[0].language || "English");
    }
  }, []);

  /* =========================
     SAVE CHATS
  ========================= */

  useEffect(() => {
    if (conversations.length > 0) {
      saveConversations(conversations);
    }
  }, [conversations]);

  /* =========================
     ACTIVE CONVERSATION
  ========================= */

  const activeConversation = useMemo(() => {
    return conversations.find(
      (conversation) =>
        conversation.id === activeConversationId
    );
  }, [conversations, activeConversationId]);

  const messages = activeConversation?.messages || [];

  /* =========================
     NEW CHAT
  ========================= */

  const handleNewChat = () => {
    const conversation = createConversation({
      language,
    });

    setConversations((previous) => [
      conversation,
      ...previous,
    ]);

    setActiveConversationId(conversation.id);
    setInput("");
  };

  /* =========================
     SELECT CHAT
  ========================= */

  const handleSelectConversation = (id) => {
    const conversation = conversations.find(
      (item) => item.id === id
    );

    setActiveConversationId(id);

    if (conversation?.language) {
      setLanguage(conversation.language);
    }

    setInput("");
  };

  /* =========================
     SEND MESSAGE
  ========================= */

  const handleSend = async () => {
    const trimmed = input.trim();

    if (!trimmed || isTyping) return;

    let conversationId = activeConversationId;

    // Automatically create a chat if none exists.
    if (!conversationId) {
      const newConversation = createConversation({
        title: trimmed.slice(0, 40),
        language,
      });

      conversationId = newConversation.id;

      setConversations((previous) => [
        newConversation,
        ...previous,
      ]);

      setActiveConversationId(conversationId);
    }

    const userMessage = createMessage({
      role: "user",
      content: trimmed,
    });

    setConversations((previous) =>
      previous.map((conversation) => {
        if (conversation.id !== conversationId) {
          return conversation;
        }

        const newTitle =
          conversation.messages.length === 0
            ? trimmed.slice(0, 40)
            : conversation.title;

        return {
          ...conversation,
          title: newTitle || "New Chat",
          language,
          messages: [
            ...conversation.messages,
            userMessage,
          ],
          updatedAt: new Date().toISOString(),
        };
      })
    );

    setInput("");
    setIsTyping(true);

    try {
      const response = await generateAIResponse(
        trimmed,
        language
      );

      const assistantMessage = createMessage({
        role: "assistant",
        content: response,
      });

      setConversations((previous) =>
        previous.map((conversation) => {
          if (conversation.id !== conversationId) {
            return conversation;
          }

          return {
            ...conversation,
            messages: [
              ...conversation.messages,
              assistantMessage,
            ],
            updatedAt: new Date().toISOString(),
          };
        })
      );
    } catch (error) {
      console.error(error);

      const errorMessage = createMessage({
        role: "assistant",
        content:
          "Sorry, something went wrong while generating the response.",
      });

      setConversations((previous) =>
        previous.map((conversation) => {
          if (conversation.id !== conversationId) {
            return conversation;
          }

          return {
            ...conversation,
            messages: [
              ...conversation.messages,
              errorMessage,
            ],
          };
        })
      );
    } finally {
      setIsTyping(false);
    }
  };

  /* =========================
     RENAME CHAT
  ========================= */

  const handleRename = (conversation) => {
    const newName = window.prompt(
      "Enter a new conversation name:",
      conversation.title
    );

    if (!newName?.trim()) return;

    setConversations((previous) =>
      previous.map((item) =>
        item.id === conversation.id
          ? {
              ...item,
              title: newName.trim(),
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
  };

  /* =========================
     PIN CHAT
  ========================= */

  const handlePin = (id) => {
    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === id
          ? {
              ...conversation,
              pinned: !conversation.pinned,
            }
          : conversation
      )
    );
  };

  /* =========================
     ARCHIVE CHAT
  ========================= */

  const handleArchive = (id) => {
    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === id
          ? {
              ...conversation,
              archived: !conversation.archived,
            }
          : conversation
      )
    );

    if (id === activeConversationId) {
      setActiveConversationId(null);
    }
  };

  /* =========================
     DELETE CHAT
  ========================= */

  const handleDelete = (conversation) => {
    setDeleteTarget(conversation);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    const deletedId = deleteTarget.id;

    setConversations((previous) =>
      previous.filter(
        (conversation) =>
          conversation.id !== deletedId
      )
    );

    if (activeConversationId === deletedId) {
      const remaining = conversations.filter(
        (conversation) =>
          conversation.id !== deletedId
      );

      setActiveConversationId(
        remaining.length > 0 ? remaining[0].id : null
      );
    }

    setDeleteTarget(null);
  };

  /* =========================
     DELETE ALL
  ========================= */

  const confirmDeleteAll = () => {
    setConversations([]);
    setActiveConversationId(null);
    setInput("");
    setDeleteAllOpen(false);

    localStorage.removeItem(
      "multi-language-ai-chat-conversations"
    );
  };

  /* =========================
     MESSAGE EDIT
  ========================= */

  const handleEditMessage = (messageId, newContent) => {
    if (!activeConversationId) return;

    setConversations((previous) =>
      previous.map((conversation) => {
        if (
          conversation.id !== activeConversationId
        ) {
          return conversation;
        }

        return {
          ...conversation,
          messages: conversation.messages.map(
            (message) =>
              message.id === messageId
                ? {
                    ...message,
                    content: newContent,
                  }
                : message
          ),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  /* =========================
     REGENERATE
  ========================= */

  const handleRegenerate = async (assistantMessage) => {
    if (!activeConversationId || isTyping) return;

    const conversation = conversations.find(
      (item) => item.id === activeConversationId
    );

    if (!conversation) return;

    const messageIndex =
      conversation.messages.findIndex(
        (message) =>
          message.id === assistantMessage.id
      );

    if (messageIndex <= 0) return;

    const previousUserMessage =
      conversation.messages[messageIndex - 1];

    if (previousUserMessage.role !== "user") {
      return;
    }

    setIsTyping(true);

    try {
      const response = await generateAIResponse(
        previousUserMessage.content,
        language
      );

      setConversations((previous) =>
        previous.map((item) => {
          if (item.id !== activeConversationId) {
            return item;
          }

          return {
            ...item,
            messages: item.messages.map((message) =>
              message.id === assistantMessage.id
                ? {
                    ...message,
                    content: response,
                  }
                : message
            ),
            updatedAt: new Date().toISOString(),
          };
        })
      );
    } finally {
      setIsTyping(false);
    }
  };

  /* =========================
     FEEDBACK
  ========================= */

  const handleFeedback = (messageId, feedback) => {
    setConversations((previous) =>
      previous.map((conversation) => {
        if (
          conversation.id !== activeConversationId
        ) {
          return conversation;
        }

        return {
          ...conversation,
          messages: conversation.messages.map(
            (message) =>
              message.id === messageId
                ? {
                    ...message,
                    feedback:
                      message.feedback === feedback
                        ? null
                        : feedback,
                  }
                : message
          ),
        };
      })
    );
  };

  /* =========================
     SUGGESTION
  ========================= */

  const handleSuggestion = (text) => {
    setInput(text);
  };

  /* =========================
     STOP
  ========================= */

  const handleStop = () => {
    setIsTyping(false);
  };

  /* =========================
     LANGUAGE
  ========================= */

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);

    if (!activeConversationId) return;

    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === activeConversationId
          ? {
              ...conversation,
              language: newLanguage,
            }
          : conversation
      )
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white text-slate-900">
      {/* Sidebar */}
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onRename={handleRename}
        onPin={handlePin}
        onArchive={handleArchive}
        onDelete={handleDelete}
        onDeleteAll={() => setDeleteAllOpen(true)}
        isOpen={sidebarOpen}
      />

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col">
        <ChatHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          language={language}
          setLanguage={handleLanguageChange}
          conversation={activeConversation}
        />

        <ChatWindow
          messages={messages}
          language={language}
          isTyping={isTyping}
          onSuggestion={handleSuggestion}
          onEdit={handleEditMessage}
          onRegenerate={handleRegenerate}
          onFeedback={handleFeedback}
        />

        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          language={language}
          isTyping={isTyping}
          onStop={handleStop}
        />
      </main>

      {/* Delete conversation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete conversation?"
        message={`"${deleteTarget?.title || ""}" will be permanently deleted from this browser.`}
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Delete all */}
      <ConfirmDialog
        open={deleteAllOpen}
        title="Delete all conversations?"
        message="All of your saved conversations will be permanently removed from this browser."
        confirmText="Delete All"
        onConfirm={confirmDeleteAll}
        onCancel={() => setDeleteAllOpen(false)}
      />
    </div>
  );
}