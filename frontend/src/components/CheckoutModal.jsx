import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CalendarDays, Clock, Loader2, MapPin, Users, X } from "lucide-react";
import { createBooking } from "../lib/api";
import { SESSIONS, money, prettyDate } from "../lib/data";
import { useApp, useLockBody } from "../lib/store";
import { createPortal } from "react-dom";

export default function CheckoutModal({ open, onClose, venue, date, sessionId, guests, extras, onBooked }) {
  const { addBooking, toast } = useApp();
  const navigate = useNavigate();
  const [phase, setPhase] = useState("review");
  const [booking, setBooking] = useState(null);
  useLockBody(open);

  useEffect(() => { if (open) { setPhase("review"); setBooking(null); } }, [open]);

  const session  = SESSIONS.find((s) => s.id === sessionId) ?? SESSIONS[1];
  const hireTotal = session.hours * venue.pricePerHour;

  // const confirm = async () => {

  //   console.log("BOOKING CONFIRM CLICKED");

  //   if (!date) return;
  //   setPhase("processing");
  //   try {
  //     const b = await createBooking({ venue, date, sessionId, guests });
  //     addBooking(b);
  //     setBooking(b);
  //     setPhase("done");
  //     toast(`Request sent — ${prettyDate(b.date)} at ${b.venueName}`);
  //     onBooked?.();
  //   } catch (e) {
  //     setPhase("review");
  //     toast(e instanceof Error ? e.message : "Booking failed — try again", "error");
  //   }
  // };

  const confirm = async () => {
    console.log("BOOKING BUTTON CLICKED");
    console.log("Booking details:", {
      venueId: venue.id,
      date,
      sessionId,
      guests,
    });

    if (!date) {
      console.log("Booking stopped: date is missing");
      return;
    }

    setPhase("processing");

    try {
      console.log("Calling createBooking API...");

      const b = await createBooking({ venue, date, sessionId, guests });

      console.log("Booking API successful:", b);

      addBooking(b);
      setBooking(b);
      setPhase("done");
      toast(`Request sent — ${prettyDate(b.date)} at ${b.venueName}`);
      onBooked?.();
    } catch (e) {
      console.error("BOOKING FAILED:", e);

      setPhase("review");
      toast(e instanceof Error ? e.message : "Booking failed — try again", "error");
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && date && (
        // <motion.div className="fixed inset-0 z-[145] grid place-items-center p-4"
        //   initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div
          className="fixed inset-0 z-[145] isolate grid place-items-center p-4 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* <div className="absolute inset-0 bg-ink/85 backdrop-blur-md" onClick={phase === "processing" ? undefined : onClose} /> */}
          <div
            className="absolute inset-0 z-0 pointer-events-auto bg-ink/85 backdrop-blur-md"
            onClick={phase === "processing" ? undefined : onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 44, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 pointer-events-auto w-full max-w-lg overflow-hidden rounded-3xl border border-cream/10 bg-coal shadow-[0_60px_120px_-30px_rgba(0,0,0,0.9)]"
          >
            <AnimatePresence mode="wait">
              {phase !== "done" ? (
                <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}>
                  <div className="relative h-40">
                    <img src={venue.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-coal via-ink/40 to-ink/20" />
                    <button data-hover onClick={onClose}
                      className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-ink/60 text-cream backdrop-blur-md hover:bg-ink/90"
                      aria-label="Close"><X className="size-4" /></button>
                    <div className="absolute bottom-4 left-6 right-6">
                      <p className="text-[10px] tracking-[0.26em] uppercase text-champagne">Review your request</p>
                      <h3 className="mt-1 font-display text-2xl font-light text-cream">{venue.name}</h3>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {[
                        { icon: CalendarDays, label: prettyDate(date) },
                        { icon: Clock,        label: session.time },
                        { icon: MapPin,       label: venue.city },
                        { icon: Users,        label: `${guests} guests` },
                      ].map(({ icon: Icon, label }) => (
                        <div key={label} className="flex items-center gap-2.5 rounded-xl border border-cream/10 px-3.5 py-3 text-cream/85">
                          <Icon className="size-4 shrink-0 text-gold" /><span className="truncate">{label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 space-y-2 border-t border-cream/[0.07] pt-5">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-sand">Venue hire — {session.hours}h × {money(venue.pricePerHour)}/hr</span>
                        <span className="text-cream/90 tabular-nums">{money(hireTotal)}</span>
                      </div>
                      {(extras ?? []).map((x) => (
                        <div key={x.id} className="flex items-center justify-between text-[13px]">
                          <span className="text-faint">{x.name} (via host)</span>
                          <span className="text-faint tabular-nums">{money(x.amount)}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between border-t border-cream/10 pt-3">
                        <span className="text-sm text-cream">Total on approval</span>
                        <span className="font-display text-[26px] text-champagne tabular-nums">{money(hireTotal)}</span>
                      </div>
                    </div>

                    {/* <button 
                      data-hover 
                      onClick={() => {
                        console.log("SEND BOOKING BUTTON CLICKED");
                        confirm();
                      }}
                      disabled={phase === "processing"}
                      className="shimmer-btn group mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-gold py-4 text-[13px] font-medium tracking-[0.14em] uppercase text-ink hover:bg-champagne disabled:opacity-70">
                      {phase === "processing"
                        ? <><Loader2 className="size-4 animate-spin" /> Sending request…</>
                        : <>Send booking request <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" /></>
                      }
                    </button> */}

                    <button
                      type="button"
                      data-hover
                      onClick={confirm}
                      disabled={phase === "processing"}
                      className="shimmer-btn group flex w-full items-center justify-center gap-2 rounded-full bg-gold py-4 text-[13px] font-medium tracking-[0.14em] uppercase text-ink hover:bg-champagne disabled:opacity-60"
                    >
                      {phase === "processing" ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Sending request…
                        </>
                      ) : (
                        <>
                          Send booking request
                          <ArrowRight className="size-4" />
                        </>
                      )}
                    </button>
                    <p className="mt-4 text-center text-[11px] leading-relaxed text-faint">
                      Status starts as Pending. The venue owner reviews every request.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="p-8 pb-7 text-center">
                  <div className="mx-auto grid size-24 place-items-center">
                    <motion.svg viewBox="0 0 100 100" className="size-24">
                      <motion.circle cx="50" cy="50" r="46" fill="none" stroke="#c9a15c" strokeWidth="1.5"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
                      <motion.path d="M32 51 L45 64 L70 38" fill="none" stroke="#e8d2a0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.55, delay: 0.55, ease: "easeOut" }} />
                    </motion.svg>
                  </div>
                  <h3 className="mt-5 font-display text-3xl font-light text-cream">Request <span className="italic text-gold">sent.</span></h3>
                  <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-sand">
                    {booking?.venueName} · {booking ? prettyDate(booking.date) : ""} · {booking?.startTime} — {booking?.endTime}
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-2.5">
                    <span className="rounded-full border border-cream/20 bg-cream/[0.06] px-4 py-2 text-[11px] tracking-[0.2em] uppercase text-cream/80">Status · Pending</span>
                    <span className="rounded-full border border-gold/30 bg-gold/[0.07] px-4 py-2 text-[11px] tracking-[0.2em] text-champagne">REF · {booking?.id}</span>
                  </div>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <button data-hover onClick={() => { onClose(); navigate("/dashboard"); }}
                      className="shimmer-btn flex-1 rounded-full bg-gold py-3.5 text-[12px] font-medium tracking-[0.14em] uppercase text-ink hover:bg-champagne">
                      Track in my bookings
                    </button>
                    <button data-hover onClick={onClose}
                      className="flex-1 rounded-full border border-cream/15 py-3.5 text-[12px] tracking-[0.14em] uppercase text-cream/85 hover:border-cream/40">
                      Keep browsing
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
