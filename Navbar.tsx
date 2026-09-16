"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="border-b bg-white px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          Lucida AI
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/workspace">Workspace</Link>

          {session?.user ? (
            <>
              <Link href="/settings">Settings</Link>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-lg bg-black px-4 py-2 text-sm text-white"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-black px-4 py-2 text-sm text-white"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
        }
