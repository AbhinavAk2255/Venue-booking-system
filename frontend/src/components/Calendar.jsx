import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { isDateBooked, toISODate } from "../lib/data";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MAX_MONTHS_AHEAD = 5;

export default function Calendar({ venueId, selected, onSelect, blocked, inventAvailability = false }) {
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [offset, setOffset] = useState(0);
  const view = useMemo(() => new Date(today.getFullYear(), today.getMonth() + offset, 1), [today, offset]);

  const cells = useMemo(() => {
    const year = view.getFullYear(), month = view.getMonth();
    const first = new Date(year, month, 1);
    const startBlank = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const list = [];
    for (let i = 0; i < startBlank; i++) list.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const iso = toISODate(date);
      const past = date < today;
      const booked = (inventAvailability ? isDateBooked(venueId, iso) : false) || (blocked?.has(iso) ?? false);
      list.push({ iso, day: d, disabled: past, booked });
    }
    return list;
  }, [view, today, venueId, blocked, inventAvailability]);

  const monthLabel = view.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const todayIso   = toISODate(new Date());

  return (
    <div className="w-full min-w-0">
      <div className="flex items-center justify-between mb-4">
        <p className="font-display text-lg text-cream">{monthLabel}</p>
        <div className="flex gap-1.5">
          <button data-hover onClick={() => setOffset((o) => Math.max(0, o - 1))} disabled={offset === 0}
            className="grid size-8 place-items-center rounded-full border border-cream/10 text-sand transition-colors hover:border-gold/50 hover:text-champagne disabled:opacity-30"
            aria-label="Previous month"><ChevronLeft className="size-4" /></button>
          <button data-hover onClick={() => setOffset((o) => Math.min(MAX_MONTHS_AHEAD, o + 1))} disabled={offset === MAX_MONTHS_AHEAD}
            className="grid size-8 place-items-center rounded-full border border-cream/10 text-sand transition-colors hover:border-gold/50 hover:text-champagne disabled:opacity-30"
            aria-label="Next month"><ChevronRight className="size-4" /></button>
        </div>
      </div>

      <div className="grid w-full min-w-0 grid-cols-7 gap-0.5 sm:gap-1 text-center">
        {WEEKDAYS.map((w) => <span key={w} className="pb-2 text-[10px] tracking-[0.16em] uppercase text-faint">{w}</span>)}
        {cells.map((c, i) =>
          c === null ? <span key={`b${i}`} /> : (
            <motion.button key={c.iso} data-hover
              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.006 }}
              disabled={c.disabled || c.booked} onClick={() => onSelect(c.iso)}
              className={`relative grid aspect-square place-items-center rounded-full text-xs sm:text-[13px] transition-all duration-200 ${
                selected === c.iso ? "bg-gold text-ink font-semibold scale-105"
                : c.booked    ? "text-faint/50 line-through decoration-wine/60"
                : c.disabled  ? "text-faint/40"
                              : "text-cream/80 hover:bg-cream/10 hover:text-cream"
              } ${c.iso === todayIso && selected !== c.iso ? "ring-1 ring-gold/50" : ""}`}
              title={c.booked ? "Already booked" : undefined}
            >{c.day}</motion.button>
          )
        )}
      </div>

      <div className="mt-4 flex items-center gap-5 border-t border-cream/[0.07] pt-4 text-[11px] text-sand">
        <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-gold" /> Selected</span>
        <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-cream/25" /> Available</span>
        <span className="flex items-center gap-2"><span className="text-faint/70 line-through decoration-wine/70 text-[11px]">28</span> Booked</span>
      </div>
    </div>
  );
}
