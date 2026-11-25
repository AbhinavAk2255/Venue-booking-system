
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  User as UserIcon,
  X,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";

import { useApp, useLockBody } from "../lib/store";
import { IMAGES } from "../lib/data";
import {
  USE_MOCK,
  requestPasswordResetOTP,
  resetPasswordWithOTP,
} from "../lib/api";

export default function AuthModal() {
  const {
    authOpen,
    authMode,
    closeAuth,
    signIn,
    signUp,
    authBusy,
  } = useApp();

  const [mode, setMode] = useState(authMode);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fieldError, setFieldError] = useState("");

  // Forgot password states
  const [forgotMode, setForgotMode] = useState(false);
  const [resetStep, setResetStep] = useState("email");

  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [resetBusy, setResetBusy] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  useLockBody(authOpen);

  useEffect(() => {
    setMode(authMode);
    setFieldError("");
    setForgotMode(false);
    setResetStep("email");
    setSuccessMessage("");

    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
  }, [authMode, authOpen]);

  useEffect(() => {
    setFieldError("");
    setSuccessMessage("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [mode]);

  // Existing login and registration
  const submit = async (e) => {
    e.preventDefault();
    setFieldError("");
    setSuccessMessage("");

    if (!username.trim()) {
      setFieldError("Username is required");
      return;
    }

    if (!password) {
      setFieldError("Password is required");
      return;
    }

    if (mode === "signup") {
      if (!email.trim()) {
        setFieldError("Email is required");
        return;
      }

      if (password.length < 8) {
        setFieldError("Password must be at least 8 characters");
        return;
      }

      if (password !== confirmPassword) {
        setFieldError("Passwords do not match");
        return;
      }
    }

    try {
      if (mode === "signin") {
        await signIn(username.trim(), password);
      } else {
        await signUp(username.trim(), email.trim(), password);
      }

      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFieldError("");
    } catch (err) {
      if (err instanceof Error) {
        setFieldError(err.message);
      }
    }
  };

  // Request OTP
  const handleForgotPassword = async (e) => {
    e.preventDefault();

    setFieldError("");
    setResetMessage("");

    if (!resetEmail.trim()) {
      setFieldError("Please enter your email address.");
      return;
    }

    try {
      setResetBusy(true);

      const response = await requestPasswordResetOTP(resetEmail);

      setResetMessage(response.message);
      setResetStep("otp");
    } catch (error) {
      setFieldError(error.message);
    } finally {
      setResetBusy(false);
    }
  };

  // Verify OTP and reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    setFieldError("");
    setResetMessage("");

    if (resetOtp.length !== 6) {
      setFieldError("Please enter the six-digit OTP.");
      return;
    }

    if (newPassword.length < 8) {
      setFieldError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setFieldError("Passwords do not match.");
      return;
    }

    try {
      setResetBusy(true);

      const response = await resetPasswordWithOTP(
        resetEmail,
        resetOtp,
        newPassword
      );

      setForgotMode(false);
      setMode("signin");

      setUsername("");
      setPassword("");
      setConfirmPassword("");

      setResetStep("email");
      setResetOtp("");
      setNewPassword("");
      setConfirmNewPassword("");

      setShowPassword(false);
      setShowConfirmPassword(false);
      setShowNewPassword(false);
      setShowConfirmNewPassword(false);

      setFieldError("");
      setSuccessMessage(
        response.message || "Password reset successfully. Please sign in."
      );
    } catch (error) {
      setFieldError(error.message);
    } finally {
      setResetBusy(false);
    }
  };

  const backToLogin = () => {
    setForgotMode(false);
    setResetStep("email");

    setResetOtp("");
    setNewPassword("");
    setConfirmNewPassword("");

    setShowNewPassword(false);
    setShowConfirmNewPassword(false);

    setFieldError("");
    setResetMessage("");
  };

  return (
    <AnimatePresence>
      {authOpen && (
        <motion.div
          className="fixed inset-0 z-[140] grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-ink/80 backdrop-blur-md"
            onClick={closeAuth}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            initial={{ opacity: 0, y: 48, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.97 }}
            transition={{
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative w-full max-w-4xl grid md:grid-cols-[0.9fr_1.1fr] overflow-hidden rounded-3xl border border-cream/10 bg-coal shadow-[0_60px_120px_-30px_rgba(0,0,0,0.9)]"
          >
            {/* Left image */}
            <div className="relative hidden md:block">
              <img
                src={IMAGES.imgAbout}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-ink/40" />

              <div className="absolute bottom-0 p-8">
                <p className="font-display text-3xl font-light leading-tight text-cream">
                  Find your
                  <br />
                  <span className="italic text-gold">
                    perfect venue.
                  </span>
                </p>
              </div>
            </div>

            {/* Right form */}
            <div className="relative p-7 sm:p-10">
              {/* Close button */}
              <button
                type="button"
                data-hover
                onClick={closeAuth}
                className="absolute right-5 top-5 grid size-9 place-items-center rounded-full border border-cream/10 text-sand hover:text-cream hover:border-cream/30 transition-colors"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>

              {/* Login/Register tabs */}
              {!forgotMode && (
                <div className="flex rounded-full border border-cream/10 p-1 w-fit mb-9">
                  {["signin", "signup"].map((m) => (
                    <button
                      type="button"
                      key={m}
                      data-hover
                      onClick={() => setMode(m)}
                      className={`relative rounded-full px-5 py-2 text-[12px] tracking-[0.14em] uppercase transition-colors ${
                        mode === m
                          ? "text-ink"
                          : "text-sand hover:text-cream"
                      }`}
                    >
                      {mode === m && (
                        <motion.span
                          layoutId="auth-pill"
                          className="absolute inset-0 rounded-full bg-gold"
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 32,
                          }}
                        />
                      )}

                      <span className="relative z-10">
                        {m === "signin" ? "Sign in" : "Register"}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <AnimatePresence mode="wait">
                {forgotMode ? (
                  /* Forgot Password */
                  <motion.div
                    key="forgot-password"
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    transition={{ duration: 0.35 }}
                  >
                    <h3 className="font-display text-3xl font-light text-cream">
                      {resetStep === "email"
                        ? "Forgot password?"
                        : "Reset your password."}
                    </h3>

                    <p className="mt-2 text-sm text-faint">
                      {resetStep === "email"
                        ? "Enter your registered email address. We'll send you a verification code."
                        : "Enter the verification code sent to your email and create a new password."}
                    </p>

                    {/* Error message */}
                    <AnimatePresence>
                      {fieldError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-wine/40 bg-wine/10 px-4 py-3">
                            <AlertCircle className="size-4 shrink-0 text-wine" />
                            <p className="text-sm text-cream/90">
                              {fieldError}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Request OTP */}
                    {resetStep === "email" ? (
                      <form
                        onSubmit={handleForgotPassword}
                        className="mt-8 space-y-6"
                      >
                        <label className="flex items-center gap-3 text-faint">
                          <Mail className="size-4 shrink-0" />

                          <input
                            required
                            type="email"
                            value={resetEmail}
                            onChange={(e) => {
                              setResetEmail(e.target.value);
                              setFieldError("");
                            }}
                            placeholder="Registered email address"
                            autoComplete="email"
                            className="field-underline"
                          />
                        </label>

                        <button
                          type="submit"
                          disabled={resetBusy}
                          className="shimmer-btn group flex w-full items-center justify-center gap-2 rounded-full bg-gold py-4 text-[13px] font-medium tracking-[0.14em] uppercase text-ink hover:bg-champagne disabled:opacity-60"
                        >
                          {resetBusy ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <>
                              Send verification code
                              <ArrowRight className="size-4" />
                            </>
                          )}
                        </button>
                      </form>
                    ) : (
                      /* Verify OTP and new password */
                      <form
                        onSubmit={handleResetPassword}
                        className="mt-8 space-y-6"
                      >
                        <label className="flex items-center gap-3 text-faint">
                          <Mail className="size-4 shrink-0" />

                          <input
                            type="email"
                            value={resetEmail}
                            disabled
                            className="field-underline opacity-60"
                          />
                        </label>

                        <label className="flex items-center gap-3 text-faint">
                          <Lock className="size-4 shrink-0" />

                          <input
                            required
                            inputMode="numeric"
                            maxLength={6}
                            value={resetOtp}
                            onChange={(e) => {
                              setResetOtp(
                                e.target.value.replace(/\D/g, "")
                              );
                              setFieldError("");
                            }}
                            placeholder="Six-digit verification code"
                            className="field-underline tracking-[0.3em]"
                          />
                        </label>

                        {/* New password */}
                        <div className="flex items-center gap-3 text-faint">
                          <Lock className="size-4 shrink-0" />

                          <input
                            required
                            type={showNewPassword ? "text" : "password"}
                            minLength={8}
                            value={newPassword}
                            onChange={(e) => {
                              setNewPassword(e.target.value);
                              setFieldError("");
                            }}
                            placeholder="New password"
                            autoComplete="new-password"
                            className="field-underline min-w-0 flex-1"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowNewPassword(!showNewPassword)
                            }
                            className="shrink-0 text-sand hover:text-gold transition-colors"
                            aria-label={
                              showNewPassword
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {showNewPassword ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </button>
                        </div>

                        {/* Confirm new password */}
                        <div className="flex items-center gap-3 text-faint">
                          <Lock className="size-4 shrink-0" />

                          <input
                            required
                            type={
                              showConfirmNewPassword ? "text" : "password"
                            }
                            value={confirmNewPassword}
                            onChange={(e) => {
                              setConfirmNewPassword(e.target.value);
                              setFieldError("");
                            }}
                            placeholder="Confirm new password"
                            autoComplete="new-password"
                            className="field-underline min-w-0 flex-1"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmNewPassword(
                                !showConfirmNewPassword
                              )
                            }
                            className="shrink-0 text-sand hover:text-gold transition-colors"
                            aria-label={
                              showConfirmNewPassword
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {showConfirmNewPassword ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </button>
                        </div>

                        {confirmNewPassword &&
                          newPassword !== confirmNewPassword && (
                            <p className="text-xs text-wine">
                              Passwords do not match.
                            </p>
                          )}

                        <button
                          type="submit"
                          disabled={
                            resetBusy ||
                            resetOtp.length !== 6 ||
                            newPassword !== confirmNewPassword
                          }
                          className="shimmer-btn group flex w-full items-center justify-center gap-2 rounded-full bg-gold py-4 text-[13px] font-medium tracking-[0.14em] uppercase text-ink hover:bg-champagne disabled:opacity-60"
                        >
                          {resetBusy ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <>
                              Reset password
                              <ArrowRight className="size-4" />
                            </>
                          )}
                        </button>
                      </form>
                    )}

                    {/* Back to login */}
                    <button
                      type="button"
                      onClick={backToLogin}
                      className="mt-6 w-full text-center text-sm text-sand hover:text-gold transition-colors"
                    >
                      ← Back to sign in
                    </button>
                  </motion.div>
                ) : (
                  /* Existing Login and Registration */
                  <motion.div
                    key={mode}
                    initial={{
                      opacity: 0,
                      x: mode === "signin" ? -18 : 18,
                    }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{
                      opacity: 0,
                      x: mode === "signin" ? 18 : -18,
                    }}
                    transition={{
                      duration: 0.35,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <h3 className="font-display text-3xl font-light text-cream">
                      {mode === "signin"
                        ? "Welcome back."
                        : "Create your account."}
                    </h3>

                    <p className="mt-2 text-sm text-faint">
                      {mode === "signin"
                        ? "Your bookings and approvals in one place."
                        : "One account to book any venue on Venuva."}
                    </p>

                    {/* Success message */}
                    {successMessage && (
                      <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3">
                        <CheckCircle2 className="size-4 shrink-0 text-gold" />
                        <p className="text-sm text-cream/90">
                          {successMessage}
                        </p>
                      </div>
                    )}

                    {/* Inline error */}
                    <AnimatePresence>
                      {fieldError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-wine/40 bg-wine/10 px-4 py-3">
                            <AlertCircle className="size-4 shrink-0 text-wine" />
                            <p className="text-sm text-cream/90">
                              {fieldError}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <form onSubmit={submit} className="mt-8 space-y-6">
                      {/* Username */}
                      <label className="flex items-center gap-3 text-faint">
                        <UserIcon className="size-4 shrink-0" />

                        <input
                          data-hover
                          required
                          value={username}
                          onChange={(e) => {
                            setUsername(e.target.value);
                            setFieldError("");
                          }}
                          placeholder="Username"
                          autoComplete="username"
                          className="field-underline"
                        />
                      </label>

                      {/* Sign-up email */}
                      <AnimatePresence initial={false}>
                        {mode === "signup" && (
                          <motion.div
                            key="signup-extra"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden space-y-6"
                          >
                            <label className="flex items-center gap-3 text-faint">
                              <Mail className="size-4 shrink-0" />

                              <input
                                data-hover
                                required
                                type="email"
                                value={email}
                                onChange={(e) => {
                                  setEmail(e.target.value);
                                  setFieldError("");
                                }}
                                placeholder="Email address"
                                autoComplete="email"
                                className="field-underline"
                              />
                            </label>

                            <p className="text-xs leading-relaxed text-sand">
                              Your account will be created as a customer.
                              You can apply to become a venue host after registration.
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Password */}
                      <div className="flex items-center gap-3 text-faint">
                        <Lock className="size-4 shrink-0" />

                        <input
                          data-hover
                          required
                          type={showPassword ? "text" : "password"}
                          value={password}
                          minLength={mode === "signup" ? 8 : 1}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setFieldError("");
                          }}
                          placeholder={
                            mode === "signup"
                              ? "Password (min 8 characters)"
                              : "Password"
                          }
                          autoComplete={
                            mode === "signin"
                              ? "current-password"
                              : "new-password"
                          }
                          className="field-underline min-w-0 flex-1"
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="shrink-0 text-sand hover:text-gold transition-colors"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>

                      {/* Confirm password */}
                      <AnimatePresence initial={false}>
                        {mode === "signup" && (
                          <motion.div
                            key="confirm-pw"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="flex items-center gap-3 text-faint">
                              <Lock className="size-4 shrink-0" />

                              <input
                                data-hover
                                required
                                type={
                                  showConfirmPassword ? "text" : "password"
                                }
                                value={confirmPassword}
                                onChange={(e) => {
                                  setConfirmPassword(e.target.value);
                                  setFieldError("");
                                }}
                                placeholder="Confirm password"
                                autoComplete="new-password"
                                className={`field-underline min-w-0 flex-1 ${
                                  confirmPassword &&
                                  password !== confirmPassword
                                    ? "!border-wine/70"
                                    : confirmPassword &&
                                      password === confirmPassword
                                    ? "!border-gold/70"
                                    : ""
                                }`}
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  setShowConfirmPassword(
                                    !showConfirmPassword
                                  )
                                }
                                className="shrink-0 text-sand hover:text-gold transition-colors"
                                aria-label={
                                  showConfirmPassword
                                    ? "Hide password"
                                    : "Show password"
                                }
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="size-4" />
                                ) : (
                                  <Eye className="size-4" />
                                )}
                              </button>
                            </div>

                            {confirmPassword &&
                              password !== confirmPassword && (
                                <p className="mt-1.5 ml-7 text-[11px] text-wine">
                                  Passwords do not match
                                </p>
                              )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Submit */}
                      <button
                        type="submit"
                        data-hover
                        disabled={
                          authBusy ||
                          (mode === "signup" &&
                            password !== confirmPassword &&
                            confirmPassword.length > 0)
                        }
                        className="shimmer-btn group mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-gold py-4 text-[13px] font-medium tracking-[0.14em] uppercase text-ink transition-colors hover:bg-champagne disabled:opacity-60"
                      >
                        {authBusy ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <>
                            {mode === "signin"
                              ? "Sign in"
                              : "Create account"}

                            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                          </>
                        )}
                      </button>
                    </form>

                    {/* Forgot password link */}
                    {mode === "signin" && (
                      <button
                        type="button"
                        onClick={() => {
                          setForgotMode(true);
                          setResetStep("email");
                          setResetEmail("");
                          setResetOtp("");
                          setFieldError("");
                          setResetMessage("");
                          setSuccessMessage("");
                        }}
                        className="mt-4 w-full text-right text-sm text-gold hover:text-champagne transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}

                    <p className="mt-6 text-center text-[11px] tracking-[0.14em] uppercase text-faint">
                      {USE_MOCK
                        ? "Demo mode — any credentials will do"
                        : "Secured with JWT · Venuva"}
                    </p>

                    <p className="mt-4 text-center text-sm text-sand">
                      {mode === "signin" ? (
                        <>
                          Don't have an account?{" "}
                          <button
                            type="button"
                            data-hover
                            onClick={() => setMode("signup")}
                            className="text-gold hover:text-champagne transition-colors"
                          >
                            Register
                          </button>
                        </>
                      ) : (
                        <>
                          Already have an account?{" "}
                          <button
                            type="button"
                            data-hover
                            onClick={() => setMode("signin")}
                            className="text-gold hover:text-champagne transition-colors"
                          >
                            Sign in
                          </button>
                        </>
                      )}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
