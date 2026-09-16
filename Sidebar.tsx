"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  isOpen = true,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  const links = [
    {
      href: "/workspace",
      label: "New Analysis",
      icon: "＋",
    },
    {
      href: "/workspace?history=true",
      label: "History",
      icon: "◷",
    },
    {
      href: "/settings",
      label: "Settings",
      icon: "⚙",
    },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white p-4 transition-transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="mb-8 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          Lucida AI
        </Link>

        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        )}
      </div>

      <nav className="space-y-2">
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href === "/workspace?history=true" &&
              pathname === "/workspace");

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-gray-100 text-black"
                  : "text-gray-600 hover:bg-gray-50 hover:text-black"
              }`}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-gray-50 p-4">
        <p className="text-sm font-semibold">Lucida AI</p>
        <p className="mt-1 text-xs text-gray-500">
          Visual intelligence workspace
        </p>
      </div>
    </aside>
  );
    }
