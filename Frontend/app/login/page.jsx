"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiLock, FiMail, FiEye, FiEyeOff } from "react-icons/fi";

import { loginUser } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const { user } = await loginUser(email, password);
      router.replace(user.must_change_password ? "/change-password" : "/dashboard");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 h-20 w-20 overflow-hidden rounded-2xl">
            <img
              src="/mizan.png"
              alt="ሚዛን (Mizan) AI Assistant"
              className="mx-auto mb-4 h-20 w-20 object-contain"
            />
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            ሚዛን (Mizan) AI Assistant
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Sign in to continue to your workspace
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Email address
              </label>

              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#8E288D] focus:ring-2 focus:ring-[#8E288D]/10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Password
              </label>

              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-11 text-sm outline-none transition focus:border-[#8E288D] focus:ring-2 focus:ring-[#8E288D]/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#8E288D]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

            {/* Login */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg py-3 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: "#8E288D" }}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Register */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Need access? Register and wait for administrator activation.{" "}
            <Link
              href="/register"
              className="font-semibold text-[#8E288D] hover:underline"
            >
              Create profile
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}