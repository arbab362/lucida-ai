"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

type Profile = {
  name?: string | null;
  email?: string | null;
  focus?: string[];
};

const focusOptions = [
  "Learning",
  "Business",
  "Design",
  "Development",
  "Research",
  "Marketing",
  "Education",
];

export default function SettingsPage() {
  const { data: session, status } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [focus, setFocus] = useState<string[]>([]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [error, setError] = useState("");

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    if (status === "authenticated") {
      loadProfile();
    }

    const savedTheme = localStorage.getItem("lucida-theme");

    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle(
        "dark",
        savedTheme === "dark"
      );
    }
  }, [status]);

  async function loadProfile() {
    try {
      const response = await fetch("/api/profile");

      if (!response.ok) return;

      const data: Profile = await response.json();

      setName(data.name || "");
      setEmail(data.email || session?.user?.email || "");
      setFocus(Array.isArray(data.focus) ? data.focus : []);
    } catch {
      // Keep the page usable even if profile loading fails.
    }
  }

  function toggleFocus(item: string) {
    setFocus((current) =>
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item]
    );
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setProfileMessage("");
    setError("");
    setLoadingProfile(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          focus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to update your profile.");
        setLoadingProfile(false);
        return;
      }

      setProfileMessage("Profile updated successfully.");
    } catch {
      setError("Something went wrong while updating your profile.");
    } finally {
      setLoadingProfile(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPasswordMessage("");
    setError("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoadingPassword(true);

    try {
      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to change your password.");
        setLoadingPassword(false);
        return;
      }

      setPasswordMessage(
        data.message || "Password changed successfully."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Something went wrong while changing your password.");
    } finally {
      setLoadingPassword(false);
    }
  }

  function changeTheme(value: string) {
    setTheme(value);
    localStorage.setItem("lucida-theme", value);

    document.documentElement.classList.toggle(
      "dark",
      value === "dark"
    );
  }

  async function exportData() {
    setError("");

    try {
      const response = await fetch("/api/export");

      if (!response.ok) {
        setError("Unable to export your data.");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "lucida-data.json";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch {
      setError("Unable to export your data.");
    }
  }

  async function deleteAccount() {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (!confirmed) return;

    const secondConfirm = window.confirm(
      "This will permanently delete your account and saved analyses. Continue?"
    );

    if (!secondConfirm) return;

    setDeleting(true);
    setError("");

    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to delete your account.");
        setDeleting(false);
        return;
      }

      await signOut({
        callbackUrl: "/",
      });
    } catch {
      setError("Something went wrong while deleting your account.");
      setDeleting(false);
    }
  }

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-400">Loading settings...</p>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Please sign in</h1>

          <p className="mt-2 text-slate-400">
            You need to sign in to access settings.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-block rounded-xl bg-blue-500 px-6 py-3 font-semibold hover:bg-blue-400"
          >
            Go to Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/workspace"
            className="text-sm text-slate-400 hover:text-white"
          >
            ← Back to Workspace
          </Link>

          <h1 className="mt-6 text-3xl font-bold">
            Settings
          </h1>

          <p className="mt-2 text-slate-400">
            Manage your profile, appearance, security and account.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Profile */}
        <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              Profile
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Update your personal information and interests.
            </p>
          </div>

          <form onSubmit={saveProfile} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium"
              >
                Name
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-blue-400"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-slate-500"
              />
            </div>

            <div>
              <p className="mb-3 text-sm font-medium">
                Your interests
              </p>

              <div className="flex flex-wrap gap-2">
                {focusOptions.map((item) => {
                  const selected = focus.includes(item);

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleFocus(item)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        selected
                          ? "border-blue-400 bg-blue-500/20 text-blue-300"
                          : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      {selected ? "✓ " : ""}
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {profileMessage && (
              <p className="text-sm text-emerald-400">
                {profileMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={loadingProfile}
              className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold hover:bg-blue-400 disabled:opacity-50"
            >
              {loadingProfile ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </section>

        {/* Appearance */}
        <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold">
            Appearance
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Choose how Lucida looks on your device.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => changeTheme("dark")}
              className={`rounded-xl border px-5 py-3 text-sm ${
                theme === "dark"
                  ? "border-blue-400 bg-blue-500/20 text-blue-300"
                  : "border-white/10 text-slate-400"
              }`}
            >
              🌙 Dark
            </button>

            <button
              onClick={() => changeTheme("light")}
              className={`rounded-xl border px-5 py-3 text-sm ${
                theme === "light"
                  ? "border-blue-400 bg-blue-500/20 text-blue-300"
                  : "border-white/10 text-slate-400"
              }`}
            >
              ☀ Light
            </button>
          </div>
        </section>

        {/* Security */}
        <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold">
            Security
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Change your account password.
          </p>

          <form
            onSubmit={changePassword}
            className="mt-6 space-y-5"
          >
            <div>
              <label
                htmlFor="currentPassword"
                className="mb-2 block text-sm font-medium"
              >
                Current password
              </label>

              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(event.target.value)
                }
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-blue-400"
              />
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="mb-2 block text-sm font-medium"
              >
                New password
              </label>

              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(event.target.value)
                }
                autoComplete="new-password"
                required
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-blue-400"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium"
              >
                Confirm new password
              </label>

              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                autoComplete="new-password"
                required
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-blue-400"
              />
            </div>

            {passwordMessage && (
              <p className="text-sm text-emerald-400">
                {passwordMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={loadingPassword}
              className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold hover:bg-blue-400 disabled:opacity-50"
            >
              {loadingPassword
                ? "Changing..."
                : "Change Password"}
            </button>
          </form>
        </section>

        {/* Account */}
        <section className="rounded-2xl border border-red-400/20 bg-red-400/[0.03] p-6">
          <h2 className="text-xl font-semibold">
            Account
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Export your data or permanently delete your account.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={exportData}
              className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/5"
            >
              ↓ Download My Data
            </button>

            <button
              onClick={deleteAccount}
              disabled={deleting}
              className="rounded-xl border border-red-400/30 px-5 py-3 text-sm font-semibold text-red-300 hover:bg-red-400/10 disabled:opacity-50"
            >
              {deleting
                ? "Deleting..."
                : "Delete Account"}
            </button>
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-slate-600">
          Lucida AI · Account Settings
        </p>
      </div>
    </main>
  );
        }
