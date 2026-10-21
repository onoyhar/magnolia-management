"use client";

import Link from "next/link";
import { useAuth } from "../lib/AuthContext";
import { useRouter } from "next/navigation";

const ICONS = {
  home: ["M3 12l2-3m0 0l7-4 7 4M5 9v7a1 1 0 001 1h2m0 0h6m0 0h2a1 1 0 001-1v-7m-15 6l2 3m10-11v4m0 0h4m-4 0h-4"],
  users: ["M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"],
  card: ["M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"],
  chart: ["M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"],
  settings: [
    "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
    "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  ],
  logout: ["M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"],
};

const NAV_ITEMS = [
  { key: "home", href: "/", label: "Beranda", short: "Beranda", icon: "home" },
  { key: "data-warga", href: "/data-warga", label: "Data Warga", short: "Warga", icon: "users" },
  { key: "pembayaran", href: "/pembayaran", label: "Daftar Pembayaran", short: "Bayar", icon: "card" },
  { key: "statistik", href: "/statistik", label: "Statistik", short: "Statistik", icon: "chart" },
  { key: "settings", href: "/settings", label: "Pengaturan", short: "Atur", icon: "settings" },
];

function NavIcon({ name, className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {ICONS[name].map((d) => (
        <path key={d} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={d} />
      ))}
    </svg>
  );
}

export default function LayoutWithSidebar({ children, currentPage }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="relative flex min-h-screen bg-gradient-to-br from-teal-100 via-cyan-50 to-emerald-100">
      {/* Blob latar supaya efek glass terlihat */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-teal-300/40 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-emerald-200/50 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-200/50 blur-3xl" />
      </div>

      {/* Sidebar: hanya desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-toska text-white lg:flex">
        <div className="p-6 border-b border-white/10">
          <span className="text-xl font-bold tracking-tight">WargaApp</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentPage === item.key ? "bg-white/10 font-medium" : "text-white/80 hover:bg-white/5"
              }`}
            >
              <NavIcon name={item.icon} className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4 space-y-3">
          {user && (
            <div className="text-xs text-white/70 px-2 py-2">
              <p className="font-medium text-white">{user.name || user.username}</p>
              <p className="text-white/60">{user.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition flex items-center justify-center gap-2"
          >
            <NavIcon name="logout" className="w-4 h-4" />
            Logout
          </button>
          <div className="text-center text-xs text-white/50 pt-2">
            v1.1.0 &copy; 2026 Pengelola
          </div>
        </div>
      </aside>

      <main className="relative flex-1 min-w-0 flex flex-col pb-28 lg:pb-0">
        {/* Top bar: hanya mobile */}
        <header className="glass sticky top-3 z-30 mx-3 mt-3 flex items-center justify-between rounded-2xl px-4 py-3 lg:hidden">
          <span className="text-base font-bold text-toska">WargaApp</span>
          <div className="flex items-center gap-2">
            {user && (
              <span className="max-w-[120px] truncate text-xs text-gray-600">
                {user.name || user.username}
              </span>
            )}
            <button
              onClick={handleLogout}
              aria-label="Logout"
              className="rounded-xl bg-red-500/90 p-2 text-white active:scale-95 transition"
              type="button"
            >
              <NavIcon name="logout" className="h-4 w-4" />
            </button>
          </div>
        </header>

        {children}
      </main>

      {/* Bottom bar: hanya mobile */}
      <nav className="glass-strong fixed inset-x-3 bottom-3 z-40 rounded-2xl px-2 py-2 lg:hidden">
        <ul className="flex items-stretch justify-between gap-1">
          {NAV_ITEMS.map((item) => {
            const active = currentPage === item.key;
            return (
              <li key={item.key} className="flex-1">
                <Link
                  href={item.href}
                  className={`flex flex-col items-center gap-1 rounded-xl py-2 transition active:scale-95 ${
                    active ? "bg-toska text-white shadow-md" : "text-gray-600"
                  }`}
                >
                  <NavIcon name={item.icon} className="h-5 w-5" />
                  <span className="text-[11px] font-medium leading-none">{item.short}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
