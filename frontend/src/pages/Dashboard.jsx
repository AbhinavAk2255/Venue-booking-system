import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Building2, CalendarDays, Clock, Hourglass, LogIn, MapPin, MoonStar, Receipt, Sparkles, X } from "lucide-react";
import { money, prettyDate } from "../lib/data";
import { USE_MOCK, createPaymentOrder, verifyPayment, fetchPaymentReceipt } from "../lib/api";
import { useApp } from "../lib/store";
import { FadeUp, RevealWords } from "../components/ui/Reveal";
import HostApplicationSection from "../components/HostApplicationSection";

import { CreditCard, LoaderCircle } from "lucide-react";

import { downloadBookingPdf } from "../lib/bookingPdf";

const STATUS_STYLES = {
  pending:  "border-cream/20 bg-cream/[0.06] text-cream/80",
  approved: "border-gold/40 bg-gold/10 text-champagne",
  rejected: "border-wine/40 bg-wine/10 text-wine",
};


function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");

    script.src = "https://checkout.razorpay.com/v1/checkout.js";

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}


function BookingCard({ booking, index, user }) {
  const { cancelBooking, refreshBookings, toast } = useApp();
  const [confirming, setConfirming] = useState(false);
  const [busy,       setBusy]       = useState(false);
  const [paying, setPaying] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const doCancel = async () => {
    setBusy(true);
    try { await cancelBooking(booking.apiId ?? booking.id); }
    catch (e) { toast(e instanceof Error ? e.message : "Couldn't update", "error"); }
    setBusy(false);
    setConfirming(false);
  };

  const handleViewReceipt = async () => {
    if (receiptLoading) return;

    setReceiptLoading(true);

    try {
      const data = await fetchPaymentReceipt(booking.apiId);
      setReceipt(data);
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : "Unable to load payment receipt.",
        "error"
      );
    } finally {
      setReceiptLoading(false);
    }
  };

  const handleDownloadBooking = async () => {
    let payment = null;

    try {
      // Fetch payment details only if the booking is paid.
      if (booking.paymentStatus === "paid" && !USE_MOCK) {
        payment = await fetchPaymentReceipt(booking.apiId);
      }

      downloadBookingPdf(booking, user, payment);

      toast("Booking confirmation downloaded.", "success");
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : "Unable to download booking confirmation.",
        "error"
      );
    }
  };

  const handlePayment = async () => {
    if (paying) return;

    setPaying(true);

    try {
      // Load Razorpay Checkout.
      const loaded = await loadRazorpayScript();

      if (!loaded) {
        throw new Error("Unable to load Razorpay Checkout.");
      }

      // Ask Django to create a Razorpay order.
      const order = await createPaymentOrder(booking.apiId);

      const options = {
        key: order.razorpay_key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Venuva",
        description: `Booking payment - ${booking.id}`,
        order_id: order.razorpay_order_id,

        handler: async function (response) {
          try {
            // Verify payment through Django.
            await verifyPayment(response);

            // Reload bookings to get the latest payment status.
            await refreshBookings();

            toast("Payment successful! Your booking is paid.", "success");
          } catch (error) {
            toast(
              error instanceof Error
                ? error.message
                : "Payment verification failed. Please contact support.",
              "error"
            );

            // A webhook may still confirm the payment.
            await refreshBookings();
          } finally {
            setPaying(false);
          }
        },

        prefill: {
          name: "",
          email: "",
        },

        theme: {
          color: "#C6A15B",
        },

        modal: {
          ondismiss: function () {
            setPaying(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function (response) {
        toast(
          response.error?.description || "Payment failed. Please try again.",
          "error"
        );

        setPaying(false);
      });

      razorpay.open();

    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : "Unable to start payment.",
        "error"
      );

      setPaying(false);
    }
  };


return (
  <>
    <motion.article layout
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.6, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className={`group grid gap-0 overflow-hidden rounded-3xl border border-cream/[0.08] bg-coal/70 sm:grid-cols-[200px_1fr] ${booking.status === "rejected" ? "opacity-70" : ""}`}
    >
      <div className="relative h-44 overflow-hidden sm:h-full">
        <img
          src={booking.venueImage}
          alt={booking.venueName}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-coal/40" />
      </div>

      <div className="flex flex-col justify-between gap-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[10px] tracking-[0.24em] uppercase text-faint">
              <Receipt className="size-3.5" /> {booking.id}
            </div>

            <h3 className="mt-1.5 font-display text-2xl font-light text-cream">
              {booking.venueName}
            </h3>

            {booking.location && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-sand">
                <MapPin className="size-3.5 text-gold/70" />
                {booking.location}
              </p>
            )}
          </div>

          <span className={`rounded-full border px-3.5 py-1.5 text-[10px] tracking-[0.2em] uppercase ${STATUS_STYLES[booking.status]}`}>
            {booking.status}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-7 gap-y-2 text-sm text-cream/80">
          <span className="flex items-center gap-2">
            <CalendarDays className="size-4 text-gold/80" />
            {prettyDate(booking.date)}
          </span>

          <span className="flex items-center gap-2">
            <Clock className="size-4 text-gold/80" />
            {booking.startTime} — {booking.endTime}
          </span>

          {booking.hours > 0 && (
            <span className="flex items-center gap-2">
              <Hourglass className="size-4 text-gold/80" />
              {booking.hours}h
            </span>
          )}

          <span className="ml-auto font-display text-xl text-champagne tabular-nums">
            {money(booking.total)}
          </span>
        </div>

        {booking.status !== "rejected" && (
          <div className="flex items-center gap-3 border-t border-cream/[0.07] pt-4">
            {booking.venueSlug && (
              <Link
                to={`/venue/${booking.venueSlug}`}
                data-hover
                className="flex items-center gap-1.5 text-[11px] tracking-[0.16em] uppercase text-sand hover:text-champagne"
              >
                View venue <ArrowUpRight className="size-3.5" />
              </Link>
            )}

            <div className="ml-auto flex items-center gap-2">
              <button
                data-hover
                onClick={handleDownloadBooking}
                className="rounded-full border border-gold/40 px-4 py-2 text-[11px] uppercase tracking-wider text-champagne hover:bg-gold/10"
              >
                Download Confirmation
              </button>
              {booking.status === "pending" && (
                <AnimatePresence mode="wait">
                  {confirming ? (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="flex items-center gap-2"
                    >
                      <button
                        data-hover
                        onClick={doCancel}
                        disabled={busy}
                        className="rounded-full bg-wine/80 px-4 py-2 text-[11px] tracking-[0.14em] uppercase text-cream hover:bg-wine disabled:opacity-60"
                      >
                        {busy ? "Cancelling…" : "Yes, release it"}
                      </button>

                      <button
                        data-hover
                        onClick={() => setConfirming(false)}
                        className="grid size-8 place-items-center rounded-full border border-cream/15 text-sand hover:text-cream"
                        aria-label="Keep"
                      >
                        <X className="size-3.5" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="cancel"
                      data-hover
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setConfirming(true)}
                      className="text-[11px] tracking-[0.16em] uppercase text-faint hover:text-wine"
                    >
                      Cancel booking
                    </motion.button>
                  )}
                </AnimatePresence>
              )}

              {/* Pay Now button for approved bookings */}
              {booking.status === "approved" && (
                booking.paymentStatus === "paid" ? (
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-[11px] uppercase tracking-wider text-green-400">
                      Paid
                    </span>

                    <button
                      data-hover
                      onClick={handleViewReceipt}
                      disabled={receiptLoading}
                      className="rounded-full border border-gold/40 px-4 py-2 text-[11px] uppercase tracking-wider text-champagne hover:bg-gold/10 disabled:opacity-60"
                    >
                      {receiptLoading ? "Loading..." : "View Receipt"}
                    </button>
                  </div>
                ) : (
                  <button
                    data-hover
                    onClick={handlePayment}
                    disabled={paying || USE_MOCK}
                    className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-ink hover:bg-champagne disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {paying ? (
                      <>
                        <LoaderCircle className="size-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="size-4" />
                        Pay Now
                      </>
                    )}
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </motion.article>

    {/* Payment Receipt Modal */}
    {receipt && (
      <div className="receipt-overlay fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 p-4">
        <div className="receipt-content relative my-auto w-full max-w-lg rounded-2xl border border-cream/15 bg-coal p-7 text-cream">

          <button
            onClick={() => setReceipt(null)}
            className="absolute right-5 top-5 text-sand hover:text-cream print:hidden"
            aria-label="Close receipt"
          >
            <X className="size-5" />
          </button>

          <div className="text-center">
            <Receipt className="mx-auto size-9 text-gold" />
            <h2 className="mt-3 font-display text-3xl">Venuva</h2>
            <p className="mt-1 text-xs uppercase tracking-widest text-sand">
              Payment Receipt
            </p>
          </div>

          <div className="my-6 border-t border-dashed border-cream/20" />

          <div className="space-y-4 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-sand">Receipt Number</span>
              <span>{receipt.receipt_number}</span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-sand">Booking ID</span>
              <span>{receipt.booking_id}</span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-sand">Payment ID</span>
              <span className="break-all text-right">
                {receipt.razorpay_payment_id}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-sand">Order ID</span>
              <span className="break-all text-right">
                {receipt.razorpay_order_id}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-sand">Payment Date</span>
              <span>
                {receipt.paid_at
                  ? new Date(receipt.paid_at).toLocaleString()
                  : "—"}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-sand">Status</span>
              <span className="uppercase text-green-400">
                {receipt.payment_status}
              </span>
            </div>
          </div>

          <div className="my-6 border-t border-dashed border-cream/20" />

          <div className="flex items-center justify-between">
            <span className="text-sand">Total Paid</span>
            <span className="font-display text-3xl text-champagne">
              {money(Number(receipt.amount))}
            </span>
          </div>

          <p className="mt-5 text-center text-xs text-sand">
            Thank you for booking with Venuva.
          </p>

          <button
            onClick={() => window.print()}
            className="mt-6 w-full rounded-full bg-gold px-5 py-3 text-xs font-medium uppercase tracking-widest text-ink hover:bg-champagne print:hidden"
          >
            Download / Print Receipt
          </button>
        </div>
      </div>
    )}
  </>
);
}

export default function Dashboard() {
  const { user, openAuth, bookings, bookingsLoaded } = useApp();

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const active = bookings.filter((b) => b.status !== "rejected");
    return {
      upcoming: active.filter((b) => b.status === "approved" && b.date >= today).length,
      pending:  active.filter((b) => b.status === "pending").length,
      spend:    active.filter((b) => b.status === "approved").reduce((s, b) => s + b.total, 0),
    };
  }, [bookings]);

  if (!user) return (
    <div className="mx-auto grid min-h-[80vh] max-w-[1440px] place-items-center px-5 pt-24 sm:px-8">
      <FadeUp className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full border border-gold/30 bg-gold/[0.06]"><MoonStar className="size-6 text-gold" /></span>
        <RevealWords text="Your bookings live here." className="mt-7 block font-display text-[clamp(2rem,5vw,3.6rem)] font-light text-cream" />
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-sand">Sign in to track requests, approvals and references.</p>
        <button data-hover onClick={() => openAuth("signin")}
          className="shimmer-btn mt-8 inline-flex items-center gap-2 rounded-full bg-gold px-8 py-4 text-[12px] font-medium tracking-[0.16em] uppercase text-ink hover:bg-champagne">
          <LogIn className="size-4" /> Sign in
        </button>
      </FadeUp>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-28 pt-32 sm:px-8">
      <FadeUp>
        <div className="flex flex-wrap items-center gap-3 text-[11px] tracking-[0.32em] uppercase text-sand">
          <span className="text-gold">The diary</span><span className="h-px w-8 bg-gold/50" /><span>{user.email}</span>
          <span className="rounded-full border border-gold/30 bg-gold/[0.07] px-3 py-1 text-[9px] tracking-[0.2em] text-champagne">{user.role}</span>
        </div>
      </FadeUp>
      <RevealWords text={`Good evening, ${user.username}.`} delay={0.06}
        className="mt-4 block font-display text-[clamp(2.4rem,6vw,4.8rem)] font-light leading-tight text-cream" />

      {user.role === "owner" && (
        <FadeUp delay={0.1}>
          <div className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl border border-gold/25 bg-gold/[0.05] px-6 py-5">
            <Building2 className="size-5 shrink-0 text-gold" />
            <p className="flex-1 text-sm leading-relaxed text-sand">
              You're signed in as a venue <span className="text-cream">owner</span>. Venue management runs through the Django admin & owner APIs.
            </p>
          </div>
        </FadeUp>
      )}
      {user.role === "customer" && (
        <FadeUp delay={0.12}>
          <HostApplicationSection />
        </FadeUp>
      )}

      {/* Stats */}
      <FadeUp delay={0.15}>
        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: CalendarDays, label: "Approved evenings", value: String(stats.upcoming), hint: "dates locked to your name" },
            { icon: Hourglass,    label: "Pending requests",  value: String(stats.pending),  hint: "waiting on the owner's word" },
            { icon: Sparkles,     label: "Approved total",    value: money(stats.spend),     hint: "hours × rate, summed"        },
          ].map(({ icon: Icon, label, value, hint }) => (
            <div key={label} className="group rounded-3xl border border-cream/[0.08] bg-coal/70 p-6 hover:border-gold/30 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] tracking-[0.26em] uppercase text-faint">{label}</span>
                <Icon className="size-4 text-gold/70 transition-transform duration-500 group-hover:rotate-12" />
              </div>
              <p className="mt-4 font-display text-4xl font-light text-cream tabular-nums">{value}</p>
              <p className="mt-1 text-xs text-faint">{hint}</p>
            </div>
          ))}
        </div>
      </FadeUp>

      {/* Bookings list */}
      <div className="mt-14">
        <FadeUp>
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-light text-cream">Your requests</h2>
            <Link to="/venues" data-hover className="group flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase text-sand hover:text-champagne">
              New request <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </FadeUp>

        {!bookingsLoaded ? (
          <div className="mt-6 space-y-4">{[0, 1].map((i) => <div key={i} className="h-48 animate-pulse rounded-3xl bg-soot/70" />)}</div>
        ) : bookings.length === 0 ? (
          <FadeUp delay={0.1} className="mt-6 grid place-items-center rounded-3xl border border-dashed border-cream/15 py-24 text-center">
            <div>
              <MoonStar className="mx-auto size-8 text-gold/60" strokeWidth={1.2} />
              <p className="mt-5 font-display text-2xl font-light text-cream">No requests yet.</p>
              <p className="mx-auto mt-2 max-w-xs text-sm text-sand">The diary is empty and full of possibility. Go find a room.</p>
              <Link to="/venues" data-hover className="shimmer-btn mt-7 inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3.5 text-[12px] font-medium tracking-[0.16em] uppercase text-ink hover:bg-champagne">
                Browse the collection <ArrowRight className="size-4" />
              </Link>
            </div>
          </FadeUp>
        ) : (
          <motion.div layout className="mt-6 space-y-4">
            <AnimatePresence>
              {bookings.map((b, i) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  index={i}
                  user={user}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
