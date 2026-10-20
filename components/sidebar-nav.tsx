"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, Network } from "lucide-react";

const NAV = [
  {
    label: "Projects",
    href: "/",
    icon: FolderKanban,
    active: (p: string) =>
      p === "/" || (p.startsWith("/projects") && !p.endsWith("/graph")),
  },
  {
    label: "Graph View",
    href: "/graph",
    icon: Network,
    active: (p: string) => p.startsWith("/graph") || p.endsWith("/graph"),
  },
];

export function SidebarNav({ horizontal = false }: { horizontal?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className={horizontal ? "flex gap-2" : "space-y-1"}
    >
      {NAV.map((item) => {
        const Icon = item.icon;
        const isActive = item.active(pathname);
        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
              isActive
                ? "bg-violet-600/25 text-white ring-1 ring-violet-500/50"
                : "text-slate-300 hover:bg-white/10"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}