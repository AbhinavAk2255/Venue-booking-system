import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as api from "./api";
import { BOOKINGS_CHANGED_EVENT, prettyDate } from "./data";

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [venues,        setVenues]        = useState([]);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [venuesError,   setVenuesError]   = useState(null);
  const [user,          setUser]          = useState(() => api.validateSession());
  const [authBusy,      setAuthBusy]      = useState(false);
  const [authOpen,      setAuthOpen]      = useState(false);
  const [authMode,      setAuthMode]      = useState("signin");
  const [bookings,      setBookings]      = useState([]);
  const [bookingsLoaded,setBookingsLoaded]= useState(false);
  const [toasts,        setToasts]        = useState([]);
  const afterAuth = useRef(null);

  const toast = useCallback((message, kind = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, kind }].slice(-3));
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setBookings([]);
      toast("Your session expired. Please log in again.", "error");
    };

    window.addEventListener(
      "venuva:session-expired",
      handleSessionExpired
    );

    return () => {
      window.removeEventListener(
        "venuva:session-expired",
        handleSessionExpired
      );
    };
  }, [toast]);

  useEffect(() => {
    let alive = true;
    api.fetchVenues()
      .then((list) => { if (alive) { setVenues(list); setVenuesError(null); } })
      .catch((e)   => { if (alive) setVenuesError(e instanceof Error ? e.message : "Could not reach the venue server"); })
      .finally(()  => { if (alive) setVenuesLoading(false); });
    return () => { alive = false; };
  }, []);

  const refreshBookings = useCallback(async () => {
    try {
      const list = await api.fetchBookings();
      setBookings((prev) => {
        const prevStatus = new Map(prev.map((b) => [b.id, b.status]));
        list
          .filter((b) => b.status === "approved" && prevStatus.get(b.id) === "pending")
          .forEach((b) => toast(`Approved — ${b.venueName} is yours for ${prettyDate(b.date)}`));
        return list;
      });
      setBookingsLoaded(true);
    } catch {
      setBookingsLoaded(true);
    }
  }, [toast]);

  useEffect(() => {
    if (user) void refreshBookings();
    else { setBookings([]); setBookingsLoaded(true); }
  }, [user, refreshBookings]);

  useEffect(() => {
    const handler = () => void refreshBookings();
    window.addEventListener(BOOKINGS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(BOOKINGS_CHANGED_EVENT, handler);
  }, [refreshBookings]);

  const signIn = useCallback(async (username, password) => {
    setAuthBusy(true);
    try {
      const u = await api.signIn(username, password);
      setUser(u);
      setAuthOpen(false);
      toast(`Welcome back, ${u.username}`);
      afterAuth.current?.();
      afterAuth.current = null;
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not sign in", "error");
      throw e;
    } finally {
      setAuthBusy(false);
    }
  }, [toast]);

  const signUp = useCallback(async (username, email, password) => {
  try {
    setAuthBusy(true);
    const u = await api.signUp(username, email, password);
      setUser(u);
      setAuthOpen(false);
      toast(`Welcome to Venuva, ${u.username}`);
      afterAuth.current?.();
      afterAuth.current = null;
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not create account", "error");
      throw e;
    } finally {
      setAuthBusy(false);
    }
  }, [toast]);

  const signOut = useCallback(() => {
    void api.signOut();
    setUser(null);
    setBookings([]);
    toast("Signed out successfully", "info");
  }, [toast]);

  const openAuth  = useCallback((mode = "signin") => { setAuthMode(mode); setAuthOpen(true); }, []);
  const closeAuth = useCallback(() => setAuthOpen(false), []);
  const addBooking = useCallback((booking) => setBookings((b) => [booking, ...b]), []);

  const cancelBooking = useCallback(async (id) => {
    await api.cancelBooking(id);
    await refreshBookings();
    toast("Request updated — the date is released", "info");
  }, [refreshBookings, toast]);

  const bookedDatesFor = useCallback((venueId) =>
    new Set(bookings.filter((b) => b.venueId === venueId && b.status !== "rejected").map((b) => b.date)),
  [bookings]);

  const value = useMemo(() => ({
    venues, venuesLoading, venuesError,
    user, authBusy, signIn, signUp, signOut,
    authOpen, authMode, openAuth, closeAuth, afterAuth,
    bookings, bookingsLoaded, refreshBookings, addBooking, cancelBooking, bookedDatesFor,
    toasts, toast,
  }), [venues, venuesLoading, venuesError, user, authBusy, signIn, signUp, signOut,
       authOpen, authMode, openAuth, closeAuth, bookings, bookingsLoaded,
       refreshBookings, addBooking, cancelBooking, bookedDatesFor, toasts, toast]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function useLockBody(locked) {
  useEffect(() => {
    if (!locked) return;
    const lenis = lenisRef.current;
    lenis?.stop();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      lenis?.start();
    };
  }, [locked]);
}

export const lenisRef = { current: null };
