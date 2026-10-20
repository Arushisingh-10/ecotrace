import { LogoutButton } from "@/components/logout-button";
import { SidebarNav } from "@/components/sidebar-nav";

function Logo() {
  return (
    <div>
      <p className="text-lg font-bold text-white">EchoTrace</p>
      <p className="text-[11px] text-slate-400">
        From Feedback to Better Products
      </p>
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
        <SidebarNav />
        <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-400">
          <p className="font-semibold text-white">
            Better decisions. With evidence.
          </p>
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

        {/* Nav (mobile / tablet) */}
        <div className="border-b border-white/10 px-4 py-2 lg:hidden">
          <SidebarNav horizontal />
        </div>

        <div className="mx-auto max-w-[1400px] p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}