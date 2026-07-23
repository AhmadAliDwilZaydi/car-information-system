"use client";

import Link from "next/link";
import { Menu, CarFront, LayoutDashboard, Users, ReceiptText, Settings, UserCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import clsx from "clsx";

type Props = {
  children: React.ReactNode;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cars", label: "Katalog Mobil", icon: CarFront },
  { href: "/chat", label: "AI Chatbot", icon: Users },
  { href: "/bulk", label: "Bulk Data", icon: ReceiptText },
  { href: "/profile", label: "Profile", icon: UserCircle },
  { href: "/settings", label: "Settings", icon: Settings }
];

export default function AppShell({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const title = useMemo(() => navItems.find((item) => pathname.startsWith(item.href))?.label || "Dashboard", [pathname]);

  const logout = () => {
    localStorage.removeItem("crms_token");
    localStorage.removeItem("crms_user");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className={clsx("fixed inset-y-0 z-40 w-72 bg-white border-r border-slate-200 p-4 transition-transform", open ? "translate-x-0" : "-translate-x-full", "lg:translate-x-0")}>
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 p-4 text-white shadow-lg">
          <p className="text-sm opacity-90">Car Information</p>
          <h2 className="text-xl font-bold">Information System</h2>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                  pathname.startsWith(item.href)
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button className="mt-6 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100" onClick={logout}>
          Logout
        </button>
      </div>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-6">
          <button className="rounded-lg border border-slate-300 p-2 lg:hidden" onClick={() => setOpen((prev) => !prev)}>
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-slate-800">{title}</h1>
          <div className="text-sm text-slate-500">Admin Panel</div>
        </header>

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
