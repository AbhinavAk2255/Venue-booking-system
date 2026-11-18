import { useEffect, useState } from "react";
import { HashRouter, Route, Routes, useLocation, Navigate, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Lenis from "lenis";
import { AppProvider, lenisRef, useApp } from "./lib/store";
import Cursor         from "./components/ui/Cursor";
import Toasts         from "./components/ui/Toasts";
import Preloader      from "./components/Preloader";
import Navbar         from "./components/Navbar";
import Footer         from "./components/Footer";
import AuthModal      from "./components/AuthModal";
import Home           from "./pages/Home";
import Venues         from "./pages/Venues";
import VenueDetail    from "./pages/VenueDetail";
import Dashboard      from "./pages/Dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers     from "./pages/admin/AdminUsers";
import AdminVenues    from "./pages/admin/AdminVenues";
import AdminBookings  from "./pages/admin/AdminBookings";
import { LogIn, ShieldAlert } from "lucide-react";

import HostDashboard from "./pages/host/HostDashboard";
import HostVenues from "./pages/host/HostVenues";
import HostBookings from "./pages/host/HostBookings";

import AdminHostApplications from "./pages/admin/AdminHostApplications";

const EASE = [0.22, 1, 0.36, 1];

/* ── Animated page wrapper for public routes ── */
function Page({ children }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.55, ease: EASE }}
    >
      {children}
    </motion.main>
  );
}

/* ── Scroll to top on route change ── */
function ScrollManager() {
  const { pathname } = useLocation();
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/* ── Admin login screen ── */
function AdminLoginPage() {
  const { openAuth, user } = useApp();
  const navigate = useNavigate();


  useEffect(() => {
    if (user?.is_superuser) {
      navigate("/admin", { replace: true });
    }
  }, [user, navigate]);


  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-5">
      <div className="text-center max-w-md">
        <div className="mx-auto grid size-20 place-items-center rounded-full border border-gold/30 bg-gold/[0.06] mb-8">
          <ShieldAlert className="size-8 text-gold" />
        </div>
        <h1 className="font-display text-4xl font-light text-cream">Admin Access</h1>
        <p className="mt-4 text-sm text-sand leading-relaxed">
          Sign in with your <span className="text-gold">superuser</span> or{" "}
          <span className="text-gold">owner</span> account to access the admin dashboard.
        </p>
        <button
          onClick={() => openAuth("signin")}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-gold px-8 py-4 text-[13px] font-medium tracking-[0.14em] uppercase text-ink hover:bg-champagne transition-colors"
        >
          <LogIn className="size-4" /> Sign in to continue
        </button>
        <p className="mt-6 text-xs text-faint">
          Not an admin?{" "}
          <a href="/#/" className="text-gold hover:text-champagne transition-colors">
            Go to the main site →
          </a>
        </p>
      </div>
      <AuthModal />
      <Toasts />
    </div>
  );
}


function AdminGuard({ children }) {
  const { user } = useApp();

  if (!user) {
    return <AdminLoginPage />;
  }

  if (!user.is_superuser) {
    return <Navigate to="/" replace />;
  }

  return children;
}



function HostGuard({ children }) {
  const { user, openAuth } = useApp();

  useEffect(() => {
    if (!user) {
      openAuth("signin");
    }
  }, [user, openAuth]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in to access the host dashboard.</p>
      </div>
    );
  }

  // Only venue owners can access the host dashboard.
  if (user.role !== "owner") {
    return <Navigate to="/" replace />;
  }

  return children;
}



/* ── Public layout wrapper (Navbar + Footer) ── */
function PublicLayout({ children }) {
  const [loading, setLoading] = useState(true);
  return (
    <div className="relative min-h-screen">
      <AnimatePresence>{loading && <Preloader onDone={() => setLoading(false)} />}</AnimatePresence>
      <Cursor />
      <Navbar />
      <AnimatePresence mode="wait">{children}</AnimatePresence>
      <Footer />
      <AuthModal />
      <Toasts />
      <div
        aria-hidden
        className="grain-overlay pointer-events-none fixed inset-0 z-[95] opacity-[0.05] mix-blend-overlay"
      />
    </div>
  );
}

/* ── Lenis smooth scroll ── */
function LenisProvider() {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenisRef.current = lenis;
    let raf = 0;
    const loop = (time) => { lenis.raf(time); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); lenisRef.current = null; };
  }, []);
  return null;
}

/* ── All routes ── */
function AppRoutes() {
  const location = useLocation();
  return (
    <Routes location={location} key={location.pathname}>
      {/* ── Public routes (with Navbar + Footer) ── */}
      <Route path="/" element={
        <PublicLayout>
          <Page key="/"><Home /></Page>
        </PublicLayout>
      } />
      <Route path="/venues" element={
        <PublicLayout>
          <Page key="/venues"><Venues /></Page>
        </PublicLayout>
      } />
      <Route path="/venue/:slug" element={
        <PublicLayout>
          <Page key="venue"><VenueDetail /></Page>
        </PublicLayout>
      } />
      <Route path="/dashboard" element={
        <PublicLayout>
          <Page key="/dashboard"><Dashboard /></Page>
        </PublicLayout>
      } />

      {/* Host routes */}
      <Route path="/host" element={
          <HostGuard>
            <HostDashboard />
          </HostGuard>
        }
      />

      <Route
        path="/host/venues"
        element={
          <HostGuard>
            <HostVenues />
          </HostGuard>
        }
      />

      <Route
        path="/host/bookings"
        element={
          <HostGuard>
            <HostBookings />
          </HostGuard>
        }
      />

      <Route
        path="/host/*"
        element={<Navigate to="/host" replace />}
      />

      {/* ── Admin routes (NO Navbar/Footer) ── */}
      <Route path="/admin" element={
        <AdminGuard><AdminDashboard /></AdminGuard>
      } />
      <Route path="/admin/users" element={
        <AdminGuard><AdminUsers /></AdminGuard>
      } />
      <Route path="/admin/venues" element={
        <AdminGuard><AdminVenues /></AdminGuard>
      } />
      <Route path="/admin/bookings" element={
        <AdminGuard><AdminBookings /></AdminGuard>
      } />

      <Route path="/admin/host-applications" element={
        <AdminGuard>
          <AdminHostApplications />
        </AdminGuard>
      } />

      <Route path="/admin/*" element={<Navigate to="/admin" replace />} />



      {/* ── Catch-all ── */}
      <Route path="*" element={
        <PublicLayout>
          <Page key="404"><Home /></Page>
        </PublicLayout>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <ScrollManager />
        <LenisProvider />
        <AppRoutes />
      </HashRouter>
    </AppProvider>
  );
}
