import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3, BookOpen, Building2, ChevronLeft, ChevronRight,
  Home, LogOut, Menu, Settings, Users, X,ClipboardCheck,
} from "lucide-react";
import { useApp } from "../../lib/store";
import Cursor from "../ui/Cursor";


const NAV = [
  { to: "/admin",          icon: Home,      label: "Dashboard"  },
  { to: "/admin/users",    icon: Users,     label: "Users"      },
  { to: "/admin/venues",   icon: Building2, label: "Venues"     },
  { to: "/admin/bookings", icon: BookOpen,  label: "Bookings"   },
  { to: "/admin/host-applications", icon: ClipboardCheck, label: "Host Applications" },
];

export default function AdminLayout({ children }) {
  const { user, signOut } = useApp();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    signOut();
    navigate("/");
  };

  const sidebar = (
    <div className={`flex flex-col h-full bg-coal border-r border-cream/[0.07] transition-all duration-300 ${collapsed ? "w-[72px]" : "w-[260px]"}`}>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-cream/[0.07]">
        {!collapsed && (
          <Link to="/admin" className="font-display text-xl tracking-[0.1em] text-cream">
            Ven<span className="italic text-gold">u</span>va
            <span className="ml-2 text-[9px] tracking-[0.2em] uppercase text-gold bg-gold/10 border border-gold/30 rounded-full px-2 py-0.5">
              Admin
            </span>
          </Link>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:grid size-8 place-items-center rounded-lg text-sand hover:text-cream hover:bg-cream/[0.05] transition-colors">
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden grid size-8 place-items-center text-sand">
          <X className="size-5" />
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === "/admin"}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                isActive
                  ? "bg-gold/[0.1] text-gold border border-gold/20"
                  : "text-sand hover:text-cream hover:bg-cream/[0.04] border border-transparent"
              } ${collapsed ? "justify-center" : ""}`
            }
          >
            <Icon className="size-[18px] shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-cream/[0.07] p-3 space-y-2">
        <Link to="/" onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sand hover:text-cream hover:bg-cream/[0.04] transition-colors ${collapsed ? "justify-center" : ""}`}>
          <BarChart3 className="size-[18px] shrink-0" />
          {!collapsed && <span>View site</span>}
        </Link>
        <button onClick={handleLogout}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sand hover:text-wine hover:bg-wine/10 transition-colors w-full ${collapsed ? "justify-center" : ""}`}>
          <LogOut className="size-[18px] shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>

        {/* User info */}
        {!collapsed && user && (
          <div className="rounded-xl bg-soot/60 px-3 py-3 mt-2">
            <p className="text-xs text-cream truncate">{user.username}</p>
            <p className="text-[10px] text-faint truncate">{user.email}</p>
            <span className="inline-block mt-1.5 text-[9px] tracking-[0.18em] uppercase text-gold bg-gold/10 border border-gold/20 rounded-full px-2 py-0.5">
              Super Admin
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (

    <div className="flex h-screen bg-ink text-cream overflow-hidden">
      <Cursor />

      {/* Desktop sidebar */}
      <div className="hidden lg:block shrink-0">{sidebar}</div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 h-full w-[260px]">{sidebar}</div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 shrink-0 flex items-center justify-between px-5 border-b border-cream/[0.07] bg-coal/40">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden grid size-9 place-items-center rounded-lg text-sand hover:text-cream">
            <Menu className="size-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <span className="text-[11px] tracking-[0.16em] uppercase text-faint hidden sm:block">
              Admin Panel
            </span>
            {user && (
              <div className="flex items-center gap-2 rounded-full border border-cream/10 bg-soot/50 pl-1 pr-3 py-1">
                <span className="grid size-7 place-items-center rounded-full bg-gold text-ink text-[11px] font-semibold">
                  {user.username?.slice(0, 2).toUpperCase()}
                </span>
                <span className="text-sm text-cream/80 max-w-[100px] truncate">{user.username}</span>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
