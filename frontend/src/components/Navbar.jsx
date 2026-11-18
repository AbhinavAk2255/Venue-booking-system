import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, LayoutDashboard, LogOut, Menu, Settings, Sparkles, X } from "lucide-react";
import { useApp, useLockBody } from "../lib/store";
import Magnetic from "./ui/Magnetic";

import {
  USE_MOCK,
  fetchNotifications,
  markNotificationAsRead,
} from "../lib/api";

const LINKS = [
  { to: "/",         label: "Discover"    },
  { to: "/venues",   label: "Collection"  },
  { to: "/dashboard",label: "My bookings" },
];

export default function Navbar() {
  const { user, openAuth, signOut } = useApp();
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [userMenu,  setUserMenu]  = useState(false);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  useLockBody(menuOpen);

  const loadNotifications = async () => {
    if (!user || USE_MOCK) return;

    try {
      setNotificationLoading(true);

      const data = await fetchNotifications();

      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unread_count ?? 0);
    } catch (error) {
      console.error("Unable to load notifications:", error);
    } finally {
      setNotificationLoading(false);
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!user || USE_MOCK) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    loadNotifications();

    const interval = window.setInterval(loadNotifications, 30000);

    return () => window.clearInterval(interval);
  }, [user?.id]);

  useEffect(() => { setMenuOpen(false); setUserMenu(false); }, [location.pathname]);

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.is_read) {
        await markNotificationAsRead(notification.id);

        setNotifications((previous) =>
          previous.map((item) =>
            item.id === notification.id
              ? { ...item, is_read: true }
              : item
          )
        );

        setUnreadCount((count) => Math.max(0, count - 1));
      }
    } catch (error) {
      console.error("Unable to mark notification as read:", error);
    }
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 inset-x-0 z-[100] transition-all duration-500 ${
          scrolled ? "bg-ink/80 backdrop-blur-xl border-b border-cream/[0.07]" : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 h-[72px] flex items-center justify-between">
          <Link to="/" data-hover className="font-display text-[22px] tracking-[0.1em] font-light text-cream">
            Ven<span className="italic text-gold">u</span>va
          </Link>

          <nav className="hidden md:flex items-center gap-9">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} data-hover
                className={({ isActive }) =>
                  `relative text-[13px] tracking-[0.14em] uppercase transition-colors ${isActive ? "text-champagne" : "text-sand hover:text-cream"}`
                }
              >
                {({ isActive }) => (
                  <>
                    {l.label}
                    <span className={`absolute -bottom-1.5 left-0 h-px bg-gold transition-all duration-500 ${isActive ? "w-full" : "w-0"}`} />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">

            {user && (
              <div className="relative">
                <button
                  data-hover
                  onClick={() => {
                    const opening = !notificationsOpen;
                    setNotificationsOpen(opening);

                    if (opening) loadNotifications();
                  }}
                  className="relative grid size-10 place-items-center rounded-full border border-cream/10 text-cream hover:border-gold/40 hover:text-gold"
                  aria-label="Notifications"
                >
                  <Bell className="size-5" />

                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 grid min-w-5 h-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-ink">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 top-[calc(100%+12px)] z-[110] w-80 max-h-[420px] overflow-y-auto rounded-2xl border border-cream/10 bg-coal/95 p-3 shadow-2xl backdrop-blur-xl"
                    >
                      <div className="mb-3 flex items-center justify-between border-b border-cream/10 pb-3">
                        <h3 className="text-sm font-medium text-cream">
                          Notifications
                        </h3>

                        <span className="text-xs text-faint">
                          {unreadCount} unread
                        </span>
                      </div>

                      {notificationLoading ? (
                        <p className="py-6 text-center text-sm text-faint">
                          Loading notifications...
                        </p>
                      ) : notifications.length === 0 ? (
                        <p className="py-6 text-center text-sm text-faint">
                          No notifications yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {notifications.map((notification) => (
                            <button
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`w-full rounded-xl p-3 text-left transition-colors ${
                                notification.is_read
                                  ? "bg-cream/[0.03]"
                                  : "bg-gold/[0.08] hover:bg-gold/[0.12]"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium text-cream">
                                  {notification.title}
                                </p>

                                {!notification.is_read && (
                                  <span className="mt-1 size-2 shrink-0 rounded-full bg-gold" />
                                )}
                              </div>

                              <p className="mt-1 text-xs leading-5 text-sand">
                                {notification.message}
                              </p>

                              <p className="mt-2 text-[10px] text-faint">
                                {new Date(notification.created_at).toLocaleString()}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {!user ? (
              <>
                <button data-hover onClick={() => openAuth("signin")}
                  className="text-[13px] tracking-[0.14em] uppercase text-sand hover:text-cream transition-colors">
                  Sign in
                </button>
                <Magnetic>
                  <button data-hover onClick={() => navigate("/venues")}
                    className="shimmer-btn group flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-[13px] tracking-[0.1em] uppercase text-ink font-medium hover:bg-champagne transition-colors">
                    Book a venue
                  </button>
                </Magnetic>
              </>
            ) : (
              <div className="relative">
                <button data-hover onClick={() => setUserMenu((v) => !v)}
                  className="flex items-center gap-3 rounded-full border border-cream/10 bg-soot/60 pl-1.5 pr-4 py-1.5 hover:border-gold/40 transition-colors">
                  <span className="grid place-items-center size-8 rounded-full bg-gold text-ink text-[12px] font-semibold">
                    {user.username.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="text-sm text-cream/85 max-w-[120px] truncate">{user.username}</span>
                </button>
                <AnimatePresence>
                  {userMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 top-[calc(100%+10px)] w-56 rounded-2xl border border-cream/10 bg-coal/95 backdrop-blur-xl p-2 shadow-2xl"
                    >
                      <div className="px-3 py-2.5 border-b border-cream/[0.07] mb-1">
                        <p className="text-sm text-cream truncate">
                          {user.username}
                          <span className="ml-2 rounded-full border border-gold/30 bg-gold/[0.07] px-2 py-0.5 text-[9px] tracking-[0.18em] uppercase text-champagne">
                            {user.role}
                          </span>
                        </p>
                        <p className="text-xs text-faint truncate">{user.email}</p>
                      </div>
                      <button data-hover onClick={() => navigate("/dashboard")}
                        className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-sand hover:text-cream hover:bg-cream/[0.05] transition-colors">
                        <LayoutDashboard className="size-4" /> My bookings
                      </button>

                      {/* Admin panel link — always visible for logged-in users */}
                      {user?.is_superuser && (
                        <button onClick={() => navigate("/admin")} className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-sand hover:text-cream hover:bg-cream/[0.05] transition-colors">
                          Admin Panel
                        </button>
                      )}

                      {user.role === "owner" && (
                        <button data-hover onClick={() => { setUserMenu(false); navigate("/host"); }}
                          className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-champagne hover:text-gold hover:bg-gold/10 transition-colors">
                          <Settings className="size-4" /> Host panel
                        </button>
                      )}

                      <button data-hover onClick={signOut}
                        className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-sand hover:text-wine hover:bg-wine/10 transition-colors">
                        <LogOut className="size-4" /> Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center gap-3">
            {user && (
              <button
                data-hover
                onClick={() => {
                  setMenuOpen(false);
                  setNotificationsOpen((previous) => !previous);
                  loadNotifications();
                }}
                className="relative grid size-10 place-items-center rounded-full border border-cream/10 text-cream hover:border-gold/40 hover:text-gold"
                aria-label="Notifications"
              >
                <Bell className="size-5" />

                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid min-w-5 h-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-ink">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            )}

            <button
              data-hover
              className="text-cream p-2"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-6" />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[120] bg-ink flex flex-col"
          >
            <div className="h-[72px] px-5 flex items-center justify-between border-b border-cream/[0.07]">
              <span className="font-display text-[22px] tracking-[0.1em] text-cream">Ven<span className="italic text-gold">u</span>va</span>
              <button data-hover onClick={() => setMenuOpen(false)} className="text-cream p-2" aria-label="Close">
                <X className="size-6" />
              </button>
            </div>
            <div className="flex-1 flex flex-col justify-center px-8 gap-2">

              {LINKS.map((l, i) => (
                <motion.div key={l.to} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 + i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
                  <Link to={l.to} data-hover className="font-display text-5xl font-light text-cream/90 hover:text-gold transition-colors">
                    {l.label}
                  </Link>
                </motion.div>
              ))}

              {/* ADD MOBILE NOTIFICATIONS HERE */}
              {user && (
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setNotificationsOpen((previous) => !previous);
                      loadNotifications();
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-cream/10 px-4 py-3 text-cream"
                  >
                    <span className="flex items-center gap-3">
                      <Bell className="size-5 text-gold" />
                      <span className="text-sm">Notifications</span>
                    </span>

                    {unreadCount > 0 && (
                      <span className="rounded-full bg-gold px-2 py-1 text-xs font-bold text-ink">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-xl border border-cream/10 p-3">
                      {notificationLoading ? (
                        <p className="py-3 text-center text-sm text-faint">
                          Loading notifications...
                        </p>
                      ) : notifications.length === 0 ? (
                        <p className="py-3 text-center text-sm text-faint">
                          No notifications yet.
                        </p>
                      ) : (
                        notifications.map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`w-full rounded-lg p-3 text-left ${
                              notification.is_read ? "bg-cream/[0.03]" : "bg-gold/[0.08]"
                            }`}
                          >
                            <p className="text-sm font-medium text-cream">
                              {notification.title}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-sand">
                              {notification.message}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* KEEP YOUR EXISTING SIGN IN / SIGN OUT CODE BELOW */}
              <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="mt-10">
                {!user
                  ? <button data-hover onClick={() => { setMenuOpen(false); openAuth("signin"); }}
                      className="shimmer-btn rounded-full bg-gold px-8 py-4 text-sm tracking-[0.12em] uppercase text-ink font-medium">
                      Sign in
                    </button>
                  : <button data-hover onClick={() => { setMenuOpen(false); signOut(); }}
                      className="rounded-full border border-cream/20 px-8 py-4 text-sm tracking-[0.12em] uppercase text-cream">
                      Sign out
                    </button>
                }
              </motion.div>

            </div>
            <div className="px-8 pb-10 flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-faint">
              <Sparkles className="size-3.5 text-gold" /> Discover · Book · Celebrate
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
