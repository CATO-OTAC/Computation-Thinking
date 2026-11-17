"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Compass, LogOut, ShieldCheck, Sparkles, User, Map } from "lucide-react";

interface NavUser {
  userId: string;
  name: string;
  email: string;
  role: "USER" | "MANAGER";
}

export default function Navbar() {
  const [user, setUser] = useState<NavUser | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="no-print sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-sky-600 text-white shadow">
            <Compass className="h-5 w-5" />
          </span>
          <div>
            <span className="text-lg tracking-tight">Travel Assistant</span>
            <span className="hidden sm:block text-[10px] font-medium text-teal-700 uppercase tracking-wider">
              Da Lat & Nha Trang • CT Smart Planner
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
          <Link
            href="/planner"
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-white shadow-sm hover:bg-teal-700 transition"
          >
            <Sparkles className="h-4 w-4" />
            <span>Plan Trip</span>
          </Link>

          {user && (
            <Link
              href="/trips"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100"
            >
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">My Trips</span>
            </Link>
          )}

          {user?.role === "MANAGER" && (
            <Link
              href="/manager"
              className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-indigo-700 hover:bg-indigo-100"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Manager Hub</span>
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="hidden md:flex flex-col text-right leading-tight">
                <span className="text-xs font-semibold text-slate-800">{user.name}</span>
                <span className="text-[10px] text-slate-500">{user.role}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50"
            >
              <User className="h-4 w-4" />
              <span>Sign In</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}