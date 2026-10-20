import Link from "next/link";
import {
  Home,
  FolderKanban,
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

const NAV = [

  { label: "Home", href: "/", icon: Home },
  { label: "Projects", href: "/", icon: FolderKanban },
];


function Logo() {
  return (
    <div>
      <p className="text-lg font-bold text-white">EchoTrace</p>
      <p className="text-[11px] text-slate-400">From Feedback to Better Products</p>
    </div>
  );
}

export function AppShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const initial = email.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#070b17] text-slate-100 lg:flex">
      {/* Sidebar (laptop) */}
      <aside className="hidden w-64 shrink-0 flex-col gap-6 border-r border-white/10 bg-gradient-to-b from-[#0d1330] to-[#1a1040] p-4 lg:sticky lg:top-0 lg:flex lg:h-screen">
        <Logo />
        <nav className="space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const inner = (
              <>
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {!item.href && (
                  <span className="ml-auto text-[10px] uppercase text-slate-500">Soon</span>
                )}
              </>
            );
            return item.href ? (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
              >
                {inner}
              </Link>
            ) : (
              <div
                key={item.label}
                className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500"
              >
                {inner}
              </div>
            );
          })}
        </nav>
        <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-400">
          <p className="font-semibold text-white">Better decisions. With evidence.</p>
          <p className="mt-1">v1.0.0</p>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-[#070b17]/90 px-4 py-3 backdrop-blur sm:px-6">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden max-w-[220px] truncate text-sm text-slate-300 sm:block">
              {email}
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">
              {initial}
            </span>
            <LogoutButton />
          </div>
        </header>

        <div className="mx-auto max-w-[1400px] p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}