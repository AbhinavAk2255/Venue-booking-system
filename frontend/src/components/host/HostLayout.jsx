import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useApp } from "../../lib/store";
import Cursor from "../ui/Cursor";

const NAV = [
  { to: "/host", icon: Home, label: "Dashboard" },
  { to: "/host/venues", icon: Building2, label: "My Venues" },
  { to: "/host/bookings", icon: BookOpen, label: "Venue Bookings" },
];

export default function HostLayout({ children }) {
  const { user, signOut } = useApp();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    signOut();
    navigate("/");
  };

  const sidebar = (
    <div className={`flex h-full flex-col border-r border-cream/[0.07] bg-coal transition-all duration-300 ${collapsed ? "w-[72px]" : "w-[270px]"}`}>
      <div className="flex h-16 items-center justify-between border-b border-cream/[0.07] px-4">
        {!collapsed && (
          <Link to="/host" className="font-display text-xl tracking-[0.1em] text-cream">
            Ven<span className="italic text-gold">u</span>va
            <span className="ml-2 rounded-full border border-champagne/30 bg-champagne/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-champagne">
              Host
            </span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden size-8 place-items-center rounded-lg text-sand transition-colors hover:bg-cream/[0.05] hover:text-cream lg:grid"
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
        <button onClick={() => setMobileOpen(false)} className="grid size-8 place-items-center text-sand lg:hidden">
          <X className="size-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/host"}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all duration-200 ${
                isActive
                  ? "border-champagne/30 bg-champagne/[0.08] text-champagne"
                  : "border-transparent text-sand hover:bg-cream/[0.04] hover:text-cream"
              } ${collapsed ? "justify-center" : ""}`
            }
          >
            <Icon className="size-[18px] shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-2 border-t border-cream/[0.07] p-3">
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sand transition-colors hover:bg-cream/[0.04] hover:text-cream ${collapsed ? "justify-center" : ""}`}
        >
          <BarChart3 className="size-[18px] shrink-0" />
          {!collapsed && <span>View site</span>}
        </Link>
        <button
          onClick={handleLogout}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sand transition-colors hover:bg-wine/10 hover:text-wine ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut className="size-[18px] shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>

        {!collapsed && user && (
          <div className="mt-2 rounded-xl bg-soot/60 px-3 py-3">
            <p className="truncate text-xs text-cream">{user.username}</p>
            <p className="truncate text-[10px] text-faint">{user.email}</p>
            <span className="mt-1.5 inline-block rounded-full border border-champagne/20 bg-champagne/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-champagne">
              Venue Host
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-ink text-cream">
      <Cursor />
      <div className="hidden shrink-0 lg:block">{sidebar}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 h-full w-[270px]">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-cream/[0.07] bg-coal/40 px-5">
          <button onClick={() => setMobileOpen(true)} className="grid size-9 place-items-center rounded-lg text-sand hover:text-cream lg:hidden">
            <Menu className="size-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <span className="hidden text-[11px] uppercase tracking-[0.16em] text-faint sm:block">Host Panel</span>
            {user && (
              <div className="flex items-center gap-2 rounded-full border border-cream/10 bg-soot/50 py-1 pl-1 pr-3">
                <span className="grid size-7 place-items-center rounded-full bg-champagne text-[11px] font-semibold text-ink">
                  {user.username?.slice(0, 2).toUpperCase()}
                </span>
                <span className="max-w-[100px] truncate text-sm text-cream/80">{user.username}</span>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
