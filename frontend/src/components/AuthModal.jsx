import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowRight, Building2, CalendarHeart, Loader2, Lock, Mail, User as UserIcon, X } from "lucide-react";
import { useApp, useLockBody } from "../lib/store";
import { IMAGES } from "../lib/data";
import { USE_MOCK } from "../lib/api";

export default function AuthModal() {
  const { authOpen, authMode, closeAuth, signIn, signUp, authBusy } = useApp();
  const [mode,            setMode]            = useState(authMode);
  const [username,        setUsername]        = useState("");
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldError,      setFieldError]      = useState("");
  useLockBody(authOpen);

  useEffect(() => { setMode(authMode); setFieldError(""); }, [authMode, authOpen]);
  useEffect(() => { setFieldError(""); }, [mode]);

  const submit = async (e) => {
    e.preventDefault();
    setFieldError("");
    if (!username.trim())  { setFieldError("Username is required"); return; }
    if (!password)         { setFieldError("Password is required");  return; }
    if (mode === "signup") {
      if (!email.trim())         { setFieldError("Email is required");                  return; }
      if (password.length < 8)   { setFieldError("Password must be at least 8 characters"); return; }
      if (password !== confirmPassword) { setFieldError("Passwords do not match");      return; }
    }
    try {
      if (mode === "signin") await signIn(username.trim(), password);
      else                   signUp(username.trim(), email.trim(), password);
      setUsername(""); setEmail(""); setPassword(""); setConfirmPassword(""); setFieldError("");
    } catch (err) {
      if (err instanceof Error) setFieldError(err.message);
    }
  };

  return (
    <AnimatePresence>
      {authOpen && (
        <motion.div className="fixed inset-0 z-[140] grid place-items-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="absolute inset-0 bg-ink/80 backdrop-blur-md" onClick={closeAuth}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            initial={{ opacity: 0, y: 48, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.97 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-4xl grid md:grid-cols-[0.9fr_1.1fr] overflow-hidden rounded-3xl border border-cream/10 bg-coal shadow-[0_60px_120px_-30px_rgba(0,0,0,0.9)]"
          >
            {/* Left image */}
            <div className="relative hidden md:block">
              <img src={IMAGES.imgAbout} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-ink/40" />
              <div className="absolute bottom-0 p-8">
                <p className="font-display text-3xl font-light leading-tight text-cream">
                  Find your<br /><span className="italic text-gold">perfect venue.</span>
                </p>
              </div>
            </div>

            {/* Right form */}
            <div className="relative p-7 sm:p-10">
              <button data-hover onClick={closeAuth}
                className="absolute right-5 top-5 grid size-9 place-items-center rounded-full border border-cream/10 text-sand hover:text-cream hover:border-cream/30 transition-colors"
                aria-label="Close">
                <X className="size-4" />
              </button>

              {/* Toggle tabs */}
              <div className="flex rounded-full border border-cream/10 p-1 w-fit mb-9">
                {["signin", "signup"].map((m) => (
                  <button key={m} data-hover onClick={() => setMode(m)}
                    className={`relative rounded-full px-5 py-2 text-[12px] tracking-[0.14em] uppercase transition-colors ${mode === m ? "text-ink" : "text-sand hover:text-cream"}`}>
                    {mode === m && (
                      <motion.span layoutId="auth-pill" className="absolute inset-0 rounded-full bg-gold"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                    )}
                    <span className="relative z-10">{m === "signin" ? "Sign in" : "Register"}</span>
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={mode}
                  initial={{ opacity: 0, x: mode === "signin" ? -18 : 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: mode === "signin" ? 18 : -18 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>

                  <h3 className="font-display text-3xl font-light text-cream">
                    {mode === "signin" ? "Welcome back." : "Create your account."}
                  </h3>
                  <p className="mt-2 text-sm text-faint">
                    {mode === "signin" ? "Your bookings and approvals in one place." : "One account to book any venue on Venuva."}
                  </p>

                  {/* Inline error */}
                  <AnimatePresence>
                    {fieldError && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-wine/40 bg-wine/10 px-4 py-3">
                          <AlertCircle className="size-4 shrink-0 text-wine" />
                          <p className="text-sm text-cream/90">{fieldError}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={submit} className="mt-8 space-y-6">
                    {/* Username */}
                    <label className="flex items-center gap-3 text-faint">
                      <UserIcon className="size-4 shrink-0" />
                      <input data-hover required value={username}
                        onChange={(e) => { setUsername(e.target.value); setFieldError(""); }}
                        placeholder="Username" autoComplete="username" className="field-underline" />
                    </label>

                    {/* Sign-up extras */}
                    <AnimatePresence initial={false}>
                      {mode === "signup" && (
                        <motion.div key="signup-extra"
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden space-y-6">
                          <label className="flex items-center gap-3 text-faint">
                            <Mail className="size-4 shrink-0" />
                            <input data-hover required type="email" value={email}
                              onChange={(e) => { setEmail(e.target.value); setFieldError(""); }}
                              placeholder="Email address" autoComplete="email" className="field-underline" />
                          </label>
                          <p className="text-xs leading-relaxed text-sand">
                            Your account will be created as a customer.
                            You can apply to become a venue host after registration.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Password */}
                    <label className="flex items-center gap-3 text-faint">
                      <Lock className="size-4 shrink-0" />
                      <input data-hover required type="password" value={password}
                        minLength={mode === "signup" ? 8 : 1}
                        onChange={(e) => { setPassword(e.target.value); setFieldError(""); }}
                        placeholder={mode === "signup" ? "Password (min 8 characters)" : "Password"}
                        autoComplete={mode === "signin" ? "current-password" : "new-password"}
                        className="field-underline" />
                    </label>

                    {/* Confirm password — signup only */}
                    <AnimatePresence initial={false}>
                      {mode === "signup" && (
                        <motion.div key="confirm-pw"
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden">
                          <label className="flex items-center gap-3 text-faint">
                            <Lock className="size-4 shrink-0" />
                            <input data-hover required type="password" value={confirmPassword}
                              onChange={(e) => { setConfirmPassword(e.target.value); setFieldError(""); }}
                              placeholder="Confirm password" autoComplete="new-password"
                              className={`field-underline ${confirmPassword && password !== confirmPassword ? "!border-wine/70" : confirmPassword && password === confirmPassword ? "!border-gold/70" : ""}`} />
                          </label>
                          {confirmPassword && password !== confirmPassword && (
                            <p className="mt-1.5 ml-7 text-[11px] text-wine">Passwords do not match</p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit */}
                    <button data-hover disabled={authBusy || (mode === "signup" && password !== confirmPassword && confirmPassword.length > 0)}
                      className="shimmer-btn group mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-gold py-4 text-[13px] font-medium tracking-[0.14em] uppercase text-ink transition-colors hover:bg-champagne disabled:opacity-60">
                      {authBusy ? <Loader2 className="size-4 animate-spin" /> : (
                        <>{mode === "signin" ? "Sign in" : "Create account"}<ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" /></>
                      )}
                    </button>
                  </form>

                  <p className="mt-6 text-center text-[11px] tracking-[0.14em] uppercase text-faint">
                    {USE_MOCK ? "Demo mode — any credentials will do" : "Secured with JWT · Venuva"}
                  </p>
                  <p className="mt-4 text-center text-sm text-sand">
                    {mode === "signin"
                      ? <> Don't have an account?{" "}<button data-hover onClick={() => setMode("signup")} className="text-gold hover:text-champagne transition-colors">Register</button></>
                      : <> Already have an account?{" "}<button data-hover onClick={() => setMode("signin")} className="text-gold hover:text-champagne transition-colors">Sign in</button></>
                    }
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
