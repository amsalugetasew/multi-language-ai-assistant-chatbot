"use client";

import { useState } from "react";
import {
  FiSettings,
  FiBell,
  FiMoon,
  FiGlobe,
  FiMessageSquare,
  FiTrash2,
} from "react-icons/fi";

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("English");

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: "#8E288D" }}
            >
              <FiSettings size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Settings
              </h1>

              <p className="text-sm text-gray-500">
                Manage your assistant preferences
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5">

          {/* Language */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <FiGlobe className="text-[#8E288D]" size={20} />

              <div className="flex-1">
                <h2 className="font-semibold text-gray-900">
                  Default Language
                </h2>

                <p className="text-sm text-gray-500">
                  Choose the default language for conversations.
                </p>
              </div>

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#8E288D]"
              >
                <option>English</option>
                <option>Amharic</option>
                <option>Afaan Oromo</option>
                <option>Arabic</option>
                <option>French</option>
                <option>Spanish</option>
                <option>Chinese</option>
              </select>
            </div>
          </section>

          {/* Notifications */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <FiBell className="text-[#8E288D]" size={20} />

              <div className="flex-1">
                <h2 className="font-semibold text-gray-900">
                  Notifications
                </h2>

                <p className="text-sm text-gray-500">
                  Enable assistant notifications.
                </p>
              </div>

              <button
                onClick={() => setNotifications((value) => !value)}
                className={`relative h-6 w-11 rounded-full transition ${
                  notifications ? "bg-[#8E288D]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    notifications ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Dark Mode */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <FiMoon className="text-[#8E288D]" size={20} />

              <div className="flex-1">
                <h2 className="font-semibold text-gray-900">
                  Dark Mode
                </h2>

                <p className="text-sm text-gray-500">
                  Use a dark interface for the assistant.
                </p>
              </div>

              <button
                onClick={() => setDarkMode((value) => !value)}
                className={`relative h-6 w-11 rounded-full transition ${
                  darkMode ? "bg-[#8E288D]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    darkMode ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Chat Preferences */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <FiMessageSquare className="text-[#8E288D]" size={20} />

              <div>
                <h2 className="font-semibold text-gray-900">
                  Chat Preferences
                </h2>

                <p className="text-sm text-gray-500">
                  Configure conversation behavior and response preferences.
                </p>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="rounded-2xl border border-red-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <FiTrash2 className="text-red-600" size={20} />

              <div className="flex-1">
                <h2 className="font-semibold text-gray-900">
                  Delete Conversations
                </h2>

                <p className="text-sm text-gray-500">
                  Permanently remove your saved conversations.
                </p>
              </div>

              <button
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                onClick={() => {
                  localStorage.removeItem(
                    "multi-language-ai-chat-conversations"
                  );
                  alert("All conversations have been deleted.");
                }}
              >
                Delete All
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}