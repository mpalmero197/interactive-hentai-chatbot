"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  return (
    <div className="flex min-h-dvh flex-col bg-[#0c0610] text-rose-50">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0c0610]/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-serif text-lg tracking-wide text-rose-100">Afterglow</span>
            <span className="hidden text-[10px] uppercase tracking-[0.22em] text-amber-200/50 sm:inline">
              companions
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <NavLink href="/" active={path === "/"}>
              Home
            </NavLink>
            <NavLink href="/create" active={path.startsWith("/create")}>
              Create
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:py-8">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-rose-500/20 px-3 py-1 text-rose-100"
          : "rounded-full px-3 py-1 text-white/50 hover:text-rose-100"
      }
    >
      {children}
    </Link>
  );
}
