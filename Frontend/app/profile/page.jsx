"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FiUser,
  FiEdit2,
  FiSave,
  FiCamera,
  FiX,
  FiTrash2,
} from "react-icons/fi";
import WorkspaceShell from "../../components/WorkspaceShell";
import { API_BASE_URL, deleteProfileImage, getCurrentUser, updateCurrentProfile, uploadProfileImage } from "../../lib/api";

export default function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const [draftProfile, setDraftProfile] = useState({ name: "", email: "" });
  const [profileSaveError, setProfileSaveError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [hasProfileImage, setHasProfileImage] = useState(false);
  const [profileImageVersion, setProfileImageVersion] = useState(0);
  const [photoError, setPhotoError] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: "",
  });

  useEffect(() => {
    getCurrentUser()
      .then(({ user, has_profile_image: hasImage }) => {
        setProfile({ name: user.full_name, email: user.email, role: user.role });
        setHasProfileImage(Boolean(hasImage));
      })
      .catch((error) => console.error("Could not load profile:", error));
  }, []);

  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  const handleSave = () => {
    setProfileSaving(true);
    setProfileSaveError("");
    updateCurrentProfile({ fullName: draftProfile.name, email: draftProfile.email })
      .then(({ user }) => {
        setProfile({ name: user.full_name, email: user.email, role: user.role });
        setEditing(false);
      })
      .catch((error) => setProfileSaveError(error.message))
      .finally(() => setProfileSaving(false));
  };

  const handlePhotoSelection = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
      setPhotoError("Choose an image smaller than 10 MB.");
      return;
    }

    setPhotoBusy(true);
    setPhotoError("");
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not prepare this image.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
      if (!blob || blob.size > 2 * 1024 * 1024) {
        throw new Error("Could not resize the photo below 2 MB.");
      }
      setPhotoFile(new File([blob], "profile.jpg", { type: "image/jpeg" }));
      setPhotoPreview(URL.createObjectURL(blob));
    } catch (error) {
      setPhotoError(error.message || "Could not prepare that photo.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const closePhotoModal = () => {
    setPhotoModalOpen(false);
    setPhotoFile(null);
    setPhotoPreview("");
    setPhotoError("");
  };

  const saveProfilePhoto = async () => {
    if (!photoFile) return;
    setPhotoBusy(true);
    setPhotoError("");
    try {
      await uploadProfileImage(photoFile);
      setHasProfileImage(true);
      setProfileImageVersion(Date.now());
      closePhotoModal();
    } catch (error) {
      setPhotoError(error.message || "Profile photo upload failed.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const removeProfilePhoto = async () => {
    setPhotoBusy(true);
    setPhotoError("");
    try {
      await deleteProfileImage();
      setHasProfileImage(false);
      setProfileImageVersion(Date.now());
      closePhotoModal();
    } catch (error) {
      setPhotoError(error.message || "Could not remove the profile photo.");
    } finally {
      setPhotoBusy(false);
    }
  };

  return (
    <WorkspaceShell>
    <main className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-950/50 px-4 py-6 sm:px-8" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="profile-page-title" className="relative max-h-[calc(100dvh-3rem)] w-full max-w-3xl overflow-y-auto rounded-xl bg-gray-50 px-4 py-6 shadow-2xl sm:px-6 sm:py-8">
      <Link href="/dashboard" aria-label="Close profile" title="Close profile" className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-md bg-white/90 text-slate-600 shadow-sm hover:bg-white hover:text-slate-900">
        <FiX size={18} />
      </Link>
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-8">
          <h1 id="profile-page-title" className="text-2xl font-bold text-gray-900">
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
            <button
              type="button"
              onClick={() => { setPhotoError(""); setPhotoModalOpen(true); }}
              aria-label="Change profile photo"
              title="Change profile photo"
              className="group relative -mt-12 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gray-100 text-[#8E288D] shadow"
            >
              {hasProfileImage ? (
                <Image
                  src={`${API_BASE_URL}/api/auth/profile-image?v=${profileImageVersion}`}
                  alt="Profile photo"
                  width={96}
                  height={96}
                  unoptimized
                  className="h-full w-full rounded-full object-cover"
                />
              ) : <FiUser size={38} />}
              <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#8E288D] text-white">
                <FiCamera size={13} />
              </span>
            </button>

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

            <button
                onClick={() => {
                  setDraftProfile({ name: profile.name, email: profile.email });
                  setProfileSaveError("");
                  setEditing(true);
                }}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-[#8E288D] hover:text-[#8E288D]"
              >
                <FiEdit2 size={15} />
                Edit
              </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div><p className="text-sm font-semibold text-gray-700">Full name</p><p className="mt-2 text-sm text-gray-600">{profile.name}</p></div>
            <div><p className="text-sm font-semibold text-gray-700">Email</p><p className="mt-2 break-all text-sm text-gray-600">{profile.email}</p></div>
            <div><p className="text-sm font-semibold text-gray-700">Role</p><p className="mt-2 text-sm capitalize text-gray-600">{profile.role}</p></div>
          </div>
        </div>
      </div>
      </section>
      {photoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !photoBusy) closePhotoModal();
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="profile-photo-title" className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="profile-photo-title" className="text-lg font-semibold text-slate-900">Profile photo</h2>
                <p className="mt-1 text-sm text-slate-500">Choose a photo to display in your account menu.</p>
              </div>
              <button type="button" onClick={closePhotoModal} disabled={photoBusy} aria-label="Close photo dialog" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"><FiX size={18} /></button>
            </div>

            <div className="my-6 flex justify-center">
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-[#8E288D]">
                {photoPreview ? (
                  <Image src={photoPreview} alt="Selected profile photo preview" width={128} height={128} unoptimized className="h-full w-full object-cover" />
                ) : hasProfileImage ? (
                  <Image src={`${API_BASE_URL}/api/auth/profile-image?v=${profileImageVersion}`} alt="Current profile photo" width={128} height={128} unoptimized className="h-full w-full object-cover" />
                ) : <FiUser size={52} />}
              </div>
            </div>

            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoSelection} />
            {photoError && <p role="alert" className="mb-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">{photoError}</p>}
            <div className="flex flex-wrap justify-end gap-2">
              {hasProfileImage && !photoFile && (
                <button type="button" onClick={removeProfilePhoto} disabled={photoBusy} className="mr-auto flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                  <FiTrash2 size={15} /> Remove photo
                </button>
              )}
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={photoBusy} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                {photoFile || hasProfileImage ? "Choose another" : "Choose photo"}
              </button>
              <button type="button" onClick={photoFile ? saveProfilePhoto : closePhotoModal} disabled={photoBusy || (photoFile && !photoFile.size)} className="rounded-md bg-[#95298E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7d2178] disabled:opacity-50">
                {photoBusy ? "Saving..." : photoFile ? "Save photo" : "Done"}
              </button>
            </div>
            <p className="mt-3 text-right text-xs text-slate-500">JPEG, PNG, or WebP · maximum 2 MB after resizing</p>
          </section>
        </div>
      )}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8" onMouseDown={(event) => { if (event.target === event.currentTarget && !profileSaving) setEditing(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="profile-details-title" className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5">
              <h2 id="profile-details-title" className="text-lg font-semibold text-slate-900">Edit personal information</h2>
              <p className="mt-1 text-sm text-slate-500">Update the name and email associated with your account.</p>
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">Full name
                <input required minLength={2} maxLength={160} value={draftProfile.name} onChange={(event) => setDraftProfile((current) => ({ ...current, name: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-[#95298E]" />
              </label>
              <label className="block text-sm font-medium text-slate-700">Email
                <input required type="email" value={draftProfile.email} onChange={(event) => setDraftProfile((current) => ({ ...current, email: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-[#95298E]" />
              </label>
            </div>
            {profileSaveError && <p role="alert" className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">{profileSaveError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" disabled={profileSaving} onClick={() => setEditing(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">Cancel</button>
              <button type="button" disabled={profileSaving || !draftProfile.name.trim() || !draftProfile.email.trim()} onClick={handleSave} className="flex items-center gap-2 rounded-md bg-[#95298E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><FiSave size={15} />{profileSaving ? "Saving..." : "Save changes"}</button>
            </div>
          </section>
        </div>
      )}
    </main>
    </WorkspaceShell>
  );
}