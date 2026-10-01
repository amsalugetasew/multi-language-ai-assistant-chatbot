"use client";

import { useState } from "react";
import {
  FiUser,
  FiMail,
  FiEdit2,
  FiSave,
} from "react-icons/fi";

export default function ProfilePage() {
  const [editing, setEditing] = useState(false);

  const [profile, setProfile] = useState({
    name: "AI Assistant User",
    email: "user@example.com",
    role: "User",
  });

  const handleChange = (field, value) => {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSave = () => {
    setEditing(false);

    console.log("Profile saved:", profile);
  };

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Profile
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your personal information
          </p>
        </div>

        {/* Profile Card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* Cover */}
          <div
            className="h-32 rounded-t-2xl"
            style={{ backgroundColor: "#8E288D" }}
          />

          {/* Avatar */}
          <div className="relative px-6 pb-6">
            <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gray-100 text-[#8E288D] shadow">
              <FiUser size={38} />
            </div>

            <div className="mt-4">
              <h2 className="text-xl font-bold text-gray-900">
                {profile.name}
              </h2>

              <p className="text-sm text-gray-500">
                {profile.role}
              </p>
            </div>
          </div>
        </div>

        {/* Information */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">

          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Personal Information
              </h2>

              <p className="text-sm text-gray-500">
                Update your account information.
              </p>
            </div>

            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-[#8E288D] hover:text-[#8E288D]"
              >
                <FiEdit2 size={15} />
                Edit
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: "#8E288D" }}
              >
                <FiSave size={15} />
                Save
              </button>
            )}
          </div>

          <div className="space-y-5">

            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Full Name
              </label>

              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                  value={profile.name}
                  disabled={!editing}
                  onChange={(e) =>
                    handleChange("name", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:border-[#8E288D] focus:outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Email
              </label>

              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                  type="email"
                  value={profile.email}
                  disabled={!editing}
                  onChange={(e) =>
                    handleChange("email", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:border-[#8E288D] focus:outline-none"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Role
              </label>

              <input
                value={profile.role}
                disabled
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}