"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-actions";

const navItems = [
  { label: "Dashboard", href: "/", icon: "◈" },
  { label: "Leads", href: "/leads", icon: "◎" },
  { label: "Pipeline", href: "/pipeline", icon: "▷" },
  { label: "Workflows", href: "/workflows", icon: "⟳" },
  { label: "DB Health", href: "/health", icon: "❤" },
];

export function DashboardShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r bg-muted/30">
        <div className="border-b p-6">
          <h1 className="text-lg font-bold tracking-tight">Hunterman OS</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Agency Operating System
          </p>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-3 border-t p-4">
          <div className="text-xs text-muted-foreground">
            <p>Local Growth Pipeline</p>
            <p className="mt-1 font-medium text-emerald-600">● Active</p>
          </div>
          <div className="border-t pt-3">
            <p className="truncate text-xs text-muted-foreground" title={email}>
              Signed in as{" "}
              <span className="font-medium text-foreground">{email}</span>
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              disabled={isPending}
              onClick={() => startTransition(() => signOut())}
            >
              {isPending ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
