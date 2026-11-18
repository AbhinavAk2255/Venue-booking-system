import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Hourglass, Minus, Plus, Star, Users } from "lucide-react";
import { ADDONS, SESSIONS, money, prettyDate } from "../lib/data";
import { useApp } from "../lib/store";
import { USE_MOCK } from "../lib/api";
import Calendar from "./Calendar";
import CheckoutModal from "./CheckoutModal";

export default function BookingPanel({ venue, onBooked }) {
  const { user, openAuth, afterAuth, toast, bookedDatesFor } = useApp();
  const [date,      setDate]      = useState(null);
  const [sessionId, setSessionId] = useState("evening");
  const [guests,    setGuests]    = useState(Math.min(60, venue.capacity));
  const [addons,    setAddons]    = useState(new Set());
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const session   = SESSIONS.find((s) => s.id === sessionId);
  const hireTotal = session.hours * venue.pricePerHour;
  const extras = useMemo(() =>
    ADDONS.filter((a) => addons.has(a.id)).map((a) => ({ ...a, amount: a.per === "guest" ? a.price * guests : a.price })),
  [addons, guests]);

  const toggleAddon = (id) => setAddons((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const proceed = () => {
    if (!date) { toast("Choose your date on the calendar first", "info"); return; }
    if (user && user.role === "owner") { toast("Owner accounts can't book venues — use a customer account", "error"); return; }
    if (!user) {
      afterAuth.current = () => setCheckoutOpen(true);
      openAuth("signin");
      toast("Sign in to request your date", "info");
      return;
    }
    setCheckoutOpen(true);
  };

  return (
    <div className="rounded-3xl border border-cream/10 bg-coal/80 backdrop-blur-sm overflow-hidden">
      <div className="flex items-end justify-between border-b border-cream/[0.07] px-6 py-5">
        <div>
          <p className="text-[10px] tracking-[0.26em] uppercase text-faint">Hire rate</p>
          <p className="mt-1 font-display text-[28px] leading-none font-light text-cream">
            {money(venue.pricePerHour)}<span className="ml-1.5 text-sm text-sand">/ hour</span>
          </p>
        </div>
        {venue.rating !== null
          ? <div className="flex items-center gap-1.5 text-sm text-cream/85"><Star className="size-4 fill-gold text-gold" />{venue.rating.toFixed(1)}<span className="text-faint">({venue.reviews})</span></div>
          : <div className="rounded-full border border-cream/10 px-3 py-1.5 text-[10px] tracking-[0.18em] uppercase text-sand">Host-verified</div>
        }
      </div>

      <div className="min-w-0 px-3 py-5 space-y-7 sm:px-6 sm:py-6">
        <Calendar venueId={venue.id} selected={date} onSelect={(iso) => setDate(iso === date ? null : iso)}
          blocked={bookedDatesFor(venue.id)} inventAvailability={USE_MOCK} />

        {/* Session picker */}
        <div>
          <p className="mb-3 text-[11px] tracking-[0.24em] uppercase text-faint">Session</p>
          <div className="grid grid-cols-3 gap-2">
            {SESSIONS.map((s) => (
              <button key={s.id} data-hover onClick={() => setSessionId(s.id)}
                className={`relative rounded-xl border px-2 py-3 text-center transition-all duration-300 ${sessionId === s.id ? "border-gold/70 bg-gold/[0.08]" : "border-cream/10 hover:border-cream/25"}`}>
                <span className={`block text-[12px] ${sessionId === s.id ? "text-champagne" : "text-cream/80"}`}>{s.label.replace(" session", "")}</span>
                <span className="mt-1 block text-[10px] tracking-wide text-faint">{s.time}</span>
                <span className={`mt-1.5 inline-flex items-center gap-1 text-[10px] ${sessionId === s.id ? "text-champagne/90" : "text-faint"}`}>
                  <Hourglass className="size-2.5" /> {s.hours}h
                </span>
                {sessionId === s.id && <motion.span layoutId="session-dot" className="absolute right-2 top-2 size-1.5 rounded-full bg-gold" />}
              </button>
            ))}
          </div>
        </div>

        {/* Guest count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-cream/85">
            <Users className="size-4 text-gold/80" /> Guests <span className="text-[11px] text-faint">(cap {venue.capacity})</span>
          </div>
          <div className="flex items-center gap-3">
            <button data-hover onClick={() => setGuests((g) => Math.max(10, g - 10))}
              className="grid size-8 place-items-center rounded-full border border-cream/15 text-cream/80 hover:border-gold/60 hover:text-champagne"><Minus className="size-3.5" /></button>
            <span className="w-10 text-center font-display text-xl text-cream tabular-nums">{guests}</span>
            <button data-hover onClick={() => setGuests((g) => Math.min(venue.capacity, g + 10))}
              className="grid size-8 place-items-center rounded-full border border-cream/15 text-cream/80 hover:border-gold/60 hover:text-champagne"><Plus className="size-3.5" /></button>
          </div>
        </div>

        {/* Add-ons */}
        <div>
          <p className="mb-3 text-[11px] tracking-[0.24em] uppercase text-faint">Request with host <span className="normal-case tracking-normal text-faint/70">— arranged after approval</span></p>
          <div className="space-y-2">
            {ADDONS.map((a) => {
              const active = addons.has(a.id);
              return (
                <button key={a.id} data-hover onClick={() => toggleAddon(a.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-300 ${active ? "border-gold/60 bg-gold/[0.07]" : "border-cream/10 hover:border-cream/25"}`}>
                  <span className="flex items-center gap-3">
                    <span className={`grid size-5 shrink-0 place-items-center rounded-full border transition-colors ${active ? "border-gold bg-gold text-ink" : "border-cream/25 text-transparent"}`}>
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    <span>
                      <span className={`block text-[13px] ${active ? "text-cream" : "text-cream/80"}`}>{a.name}</span>
                      <span className="block text-[11px] text-faint">{a.desc}</span>
                    </span>
                  </span>
                  <span className={`shrink-0 text-[13px] ${active ? "text-champagne" : "text-sand"}`}>{money(a.price)}{a.per === "guest" ? "/guest" : ""}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Price summary */}
        {date && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            className="space-y-2 overflow-hidden border-t border-cream/[0.07] pt-5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-sand">Venue hire — {session.hours}h × {money(venue.pricePerHour)}/hr</span>
              <span className="text-cream/85 tabular-nums">{money(hireTotal)}</span>
            </div>
            {extras.length > 0 && (
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-faint">Extras (settled with host)</span>
                <span className="text-faint tabular-nums">{money(extras.reduce((s, a) => s + a.amount, 0))}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-cream/10 pt-3">
              <span className="text-sm text-cream">Booking total</span>
              <span className="font-display text-2xl text-champagne tabular-nums">{money(hireTotal)}</span>
            </div>
          </motion.div>
        )}

        <button data-hover onClick={proceed}
          className="shimmer-btn group flex w-full items-center justify-center gap-2 rounded-full bg-gold py-4 text-[13px] font-medium tracking-[0.14em] uppercase text-ink hover:bg-champagne">
          {date ? `Request ${prettyDate(date)}` : "Select a date"}
          <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
        <p className="text-center text-[11px] leading-relaxed text-faint">
          Nothing is charged now — status starts as <span className="text-sand">Pending</span> and the owner approves it.
        </p>
      </div>

      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)}
        venue={venue} date={date} sessionId={sessionId} guests={guests} extras={extras} onBooked={onBooked} />
    </div>
  );
}
