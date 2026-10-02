"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  FiChevronDown,
  FiLogOut,
  FiUser,
} from "react-icons/fi";

import {
  API_BASE_URL,
  getCurrentUser,
  logoutUser,
} from "../lib/api";

const modules = [
  { href: "/dashboard", label: "Executive dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/data", label: "AI data query", roles: ["admin", "manager", "analyst"] },
  { href: "/", label: "Assistant" },
  { href: "/users", label: "User management", roles: ["admin"] },
  { href: "/settings", label: "Settings" },
];

export default function WorkspaceShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const profileMenuRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [hasProfileImage, setHasProfileImage] = useState(false);

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then(({ user: currentUser, has_profile_image: hasImage }) => {
        if (!active) return;
        setUser(currentUser);
        setHasProfileImage(Boolean(hasImage));
        setAuthError("");

        if (currentUser.must_change_password && pathname !== "/change-password") {
          router.replace("/change-password");
        } else if (pathname === "/users" && currentUser.role !== "admin") {
          router.replace("/dashboard");
        }
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401 || error.status === 403) {
          router.replace("/login");
          return;
        }
        setAuthError(error.message || "The workspace service is unavailable.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [pathname, retryCount, router]);

  useEffect(() => {
    if (!profileMenuOpen) return;

    const closeMenu = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, [profileMenuOpen]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      router.replace("/login");
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Checking account access...
      </main>
    );
  }

  if (authError || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <section className="w-full max-w-lg border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase text-amber-800">Workspace unavailable</p>
          <h1 className="mt-2 text-xl font-bold text-slate-900">Backend setup is required</h1>
          <p role="alert" className="mt-3 text-sm leading-6 text-slate-700">{authError || "The account service did not return a user."}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Configure <code>DATABASE_URL</code> and <code>AUTH_JWT_SECRET</code> in <code>backend/.env</code>, then restart the backend.</p>
          <div className="mt-5 flex gap-3">
            <button type="button" onClick={() => { setLoading(true); setRetryCount((count) => count + 1); }} className="rounded-md bg-[#95298E] px-4 py-2 text-sm font-semibold text-white">Retry</button>
            <Link href="/login" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Sign in</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="z-20 px-3 py-3 lg:px-6">
        <div className="mx-auto flex min-h-16 max-w-[1440px] flex-wrap items-center gap-x-4 gap-y-1 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm md:px-5">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2 font-bold">
            <Image
              src="/mizan.png"
              alt="Mizan home"
              width={40}
              height={40}
              priority
              className="h-9 w-9 rounded-full object-cover"
            />
            <span className="hidden whitespace-nowrap text-sm font-semibold text-[#95298E] sm:block">ሚዛን AI</span>
          </Link>

          <nav className="order-3 flex w-full min-w-0 flex-1 items-center justify-start gap-1 overflow-x-auto md:order-none md:w-auto md:justify-center" aria-label="Workspace">
            {modules
              .filter((item) => !item.roles || item.roles.includes(user.role))
              .map(({ href, label }) => {
                const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-[13px] transition ${
                      active ? "bg-purple-50 font-semibold text-[#95298E]" : "text-slate-600 hover:bg-purple-100"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
          </nav>

          <div className="relative ml-auto shrink-0" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setProfileMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={profileMenuOpen}
            aria-label={`Account menu for ${user.full_name}`}
            className="flex max-w-56 items-center gap-2 rounded-md p-1.5 text-left hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-800"
          >
            {hasProfileImage ? (
              <Image
                src={`${API_BASE_URL}/api/auth/profile-image`}
                alt=""
                width={36}
                height={36}
                unoptimized
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-900">
                <FiUser size={17} />
              </span>
            )}
            <span className="hidden min-w-0 sm:block">
              <span className="block max-w-36 truncate text-sm font-semibold">{user.full_name}</span>
              <span className="block text-xs capitalize text-slate-500">{user.role}</span>
            </span>
            <FiChevronDown size={15} className="hidden text-slate-500 sm:block" />
          </button>

          {profileMenuOpen && (
            <div role="menu" className="absolute right-0 top-full z-30 mt-2 w-64 border border-slate-200 bg-white p-2 shadow-lg">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="truncate text-sm font-semibold">{user.full_name}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
                <p className="mt-1 text-xs capitalize text-emerald-800">{user.role}</p>
              </div>
              <Link href="/profile" role="menuitem" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 rounded px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                <FiUser size={16} /> Profile
              </Link>
              <div className="my-1 border-t border-slate-100" />
              <button type="button" role="menuitem" onClick={handleLogout} className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm text-rose-700 hover:bg-rose-50">
                <FiLogOut size={16} /> Sign out
              </button>
            </div>
          )}
          </div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}