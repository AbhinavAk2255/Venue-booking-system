import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Search, ServerCrash, SlidersHorizontal, X } from "lucide-react";
import { CAPACITY_META, CATEGORIES, isDateBooked, money } from "../lib/data";
import { USE_MOCK } from "../lib/api";
import { useApp } from "../lib/store";
import { FadeUp, RevealWords } from "../components/ui/Reveal";
import VenueCard from "../components/VenueCard";

const SORTS = [
  { id: "featured",   label: "Featured"           },
  { id: "price-asc",  label: "Price · low to high" },
  { id: "price-desc", label: "Price · high to low" },
  { id: "rating",     label: "Top rated"           },
  { id: "capacity",   label: "Largest first"       },
];

const MAX_RATE = 1200;

export default function Venues() {
  const { venues, venuesLoading: loading, venuesError } = useApp();
  const [params, setParams] = useSearchParams();
  const [query,  setQuery]  = useState(params.get("q")    ?? "");
  const [cat,    setCat]    = useState(params.get("cat")  ?? "all");
  const [minCap, setMinCap] = useState(Number(params.get("guests") ?? 0));
  const [maxRate,setMaxRate]= useState(MAX_RATE);
  const [tier,   setTier]   = useState("all");
  const [sort,   setSort]   = useState("featured");
  const [showFilters, setShowFilters] = useState(false);
  const date = params.get("date") ?? "";

  useEffect(() => {
    setQuery(params.get("q") ?? "");
    setCat(params.get("cat") ?? "all");
    setMinCap(Number(params.get("guests") ?? 0));
  }, [params]);

  const filtered = useMemo(() => {
    let list = [...venues];
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((v) => v.name.toLowerCase().includes(q) || v.location.toLowerCase().includes(q) || v.city.toLowerCase().includes(q) || v.typeLabel.toLowerCase().includes(q));
    if (cat !== "all") list = list.filter((v) => v.type === cat);
    if (tier !== "all") list = list.filter((v) => v.capacityCategory === tier);
    if (minCap > 0) list = list.filter((v) => v.capacity >= minCap);
    list = list.filter((v) => v.pricePerHour <= maxRate);
    if (date && USE_MOCK) list = list.filter((v) => !isDateBooked(v.id, date));
    if (sort === "price-asc")  list.sort((a, b) => a.pricePerHour - b.pricePerHour);
    else if (sort === "price-desc") list.sort((a, b) => b.pricePerHour - a.pricePerHour);
    else if (sort === "rating")  list.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    else if (sort === "capacity") list.sort((a, b) => b.capacity - a.capacity);
    else list.sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false));
    return list;
  }, [venues, query, cat, tier, minCap, maxRate, sort, date]);

  const clearAll = () => { setQuery(""); setCat("all"); setTier("all"); setMinCap(0); setMaxRate(MAX_RATE); setParams({}); };
  const activeFilters = (cat !== "all" ? 1 : 0) + (tier !== "all" ? 1 : 0) + (minCap > 0 ? 1 : 0) + (maxRate < MAX_RATE ? 1 : 0) + (date ? 1 : 0);

  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-28 pt-32 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <FadeUp>
            <div className="flex items-center gap-3 text-[11px] tracking-[0.32em] uppercase text-sand">
              <span className="text-gold">The index</span><span className="h-px w-8 bg-gold/50" />
              <span>{loading ? "—" : filtered.length} spaces</span>
            </div>
          </FadeUp>
          <RevealWords text="The Collection" delay={0.06}
            className="mt-4 block font-display text-[clamp(2.6rem,6.5vw,5.2rem)] font-light leading-none text-cream" />
        </div>
        {date && (
          <FadeUp delay={0.15}>
            <button data-hover onClick={() => setParams({})}
              className="flex items-center gap-2.5 rounded-full border border-gold/40 bg-gold/[0.08] px-5 py-3 text-[12px] tracking-[0.14em] uppercase text-champagne hover:bg-gold/[0.15]">
              <CalendarDays className="size-4" />
              {new Date(date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              <X className="size-3.5" />
            </button>
          </FadeUp>
        )}
      </div>

      {venuesError && (
        <FadeUp className="mt-8">
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-wine/40 bg-wine/[0.08] px-6 py-5">
            <ServerCrash className="size-5 shrink-0 text-wine" />
            <div className="flex-1 text-sm leading-relaxed text-cream/85">
              Can't reach the venue server — {venuesError}. Start Django with <code className="mx-1.5 rounded bg-ink/60 px-2 py-0.5 text-[12px] text-champagne">python manage.py runserver</code> and ensure CORS is enabled.
            </div>
          </div>
        </FadeUp>
      )}

      {/* Filter bar */}
      <FadeUp delay={0.15} className="sticky top-[84px] z-40 mt-10">
        <div className="rounded-2xl border border-cream/10 bg-ink/85 p-3 backdrop-blur-xl sm:rounded-full sm:pl-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex min-w-0 flex-1 items-center gap-2.5">
              <Search className="size-4 shrink-0 text-gold" />
              <input data-hover value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, location or type…"
                className="w-full bg-transparent text-sm text-cream placeholder:text-faint focus:outline-none" />
            </label>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button data-hover onClick={() => setCat("all")}
                className={`shrink-0 rounded-full px-4 py-2 text-[11px] tracking-[0.14em] uppercase transition-colors ${cat === "all" ? "bg-gold text-ink font-medium" : "text-sand hover:text-cream"}`}>All</button>
              {CATEGORIES.map((c) => (
                <button key={c.id} data-hover onClick={() => setCat(c.id === cat ? "all" : c.id)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-[11px] tracking-[0.14em] uppercase transition-all ${cat === c.id ? "border-gold/60 bg-gold/[0.1] text-champagne" : "border-cream/10 text-sand hover:border-cream/25 hover:text-cream"}`}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 sm:pl-2">
              <button data-hover onClick={() => setShowFilters((v) => !v)}
                className={`relative grid size-10 shrink-0 place-items-center rounded-full border transition-colors ${showFilters ? "border-gold/60 text-champagne" : "border-cream/10 text-sand hover:text-cream"}`}
                aria-label="More filters">
                <SlidersHorizontal className="size-4" />
                {activeFilters > 0 && <span className="absolute -right-0.5 -top-0.5 grid size-4.5 place-items-center rounded-full bg-gold text-[9px] font-semibold text-ink">{activeFilters}</span>}
              </button>
              <select data-hover value={sort} onChange={(e) => setSort(e.target.value)}
                className="rounded-full border border-cream/10 bg-transparent px-4 py-2.5 text-[11px] tracking-[0.12em] uppercase text-sand focus:outline-none [&>option]:bg-coal">
                {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                <div className="mt-3 grid gap-6 border-t border-cream/10 px-2 pb-2 pt-5 sm:grid-cols-3">
                  <div>
                    <div className="mb-3 flex items-center justify-between text-[11px] tracking-[0.18em] uppercase">
                      <span className="text-sand">Minimum capacity</span>
                      <span className="text-champagne">{minCap === 0 ? "Any" : `${minCap}+ guests`}</span>
                    </div>
                    <input data-hover type="range" min={0} max={500} step={10} value={minCap}
                      onChange={(e) => setMinCap(Number(e.target.value))} className="slider-gold w-full"
                      style={{ "--fill": `${(minCap / 500) * 100}%` }} />
                  </div>
                  <div>
                    <div className="mb-3 flex items-center justify-between text-[11px] tracking-[0.18em] uppercase">
                      <span className="text-sand">Max hourly rate</span>
                      <span className="text-champagne">{maxRate >= MAX_RATE ? "No limit" : `${money(maxRate)}/hr`}</span>
                    </div>
                    <input data-hover type="range" min={200} max={MAX_RATE} step={25} value={maxRate}
                      onChange={(e) => setMaxRate(Number(e.target.value))} className="slider-gold w-full"
                      style={{ "--fill": `${((maxRate - 200) / (MAX_RATE - 200)) * 100}%` }} />
                  </div>
                  <div>
                    <div className="mb-3 flex items-center justify-between text-[11px] tracking-[0.18em] uppercase">
                      <span className="text-sand">Capacity tier</span>
                      <span className="text-champagne">{tier === "all" ? "Any" : CAPACITY_META[tier]?.label}</span>
                    </div>
                    <div className="flex gap-1.5">
                      {["all", "intimate", "classic", "grand", "elite"].map((t) => (
                        <button key={t} data-hover onClick={() => setTier(t)}
                          className={`flex-1 rounded-full border px-2 py-2 text-[10px] tracking-[0.1em] uppercase transition-all ${tier === t ? "border-gold/60 bg-gold/[0.1] text-champagne" : "border-cream/10 text-sand hover:border-cream/25 hover:text-cream"}`}>
                          {t === "all" ? "Any" : CAPACITY_META[t]?.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </FadeUp>

      {/* Grid */}
      <div className="mt-10">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-soot/70" />)}
          </div>
        ) : filtered.length === 0 ? (
          <FadeUp className="grid place-items-center rounded-3xl border border-dashed border-cream/15 py-28 text-center">
            <div>
              <p className="font-display text-3xl font-light text-cream">Nothing on those terms.</p>
              <p className="mx-auto mt-3 max-w-sm text-sm text-sand">Loosen a filter or two — good rooms rarely hide for long.</p>
              <button data-hover onClick={clearAll}
                className="mt-7 rounded-full border border-gold/50 px-7 py-3 text-[12px] tracking-[0.16em] uppercase text-champagne hover:bg-gold hover:text-ink">
                Clear all filters
              </button>
            </div>
          </FadeUp>
        ) : (
          <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((v, i) => (
                <motion.div key={v.id} layout initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
                  <VenueCard venue={v} index={i} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
