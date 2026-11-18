import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useInView, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowRight, ArrowUpRight, BadgeCheck, CalendarCheck, CalendarDays, Eye, KeyRound, MapPin, Quote, Users } from "lucide-react";
import { CATEGORIES, IMAGES, TESTIMONIALS, money } from "../lib/data";
import { useApp } from "../lib/store";
import { FadeUp, RevealWords, EASE } from "../components/ui/Reveal";
import Magnetic from "../components/ui/Magnetic";
import Marquee from "../components/ui/Marquee";
import SectionHeading from "../components/ui/SectionHeading";
import VenueCard from "../components/VenueCard";

const ROTATING = ["weddings", "conferences", "parties", "celebrations"];

function useCountUp(target, duration = 1.6) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    let raf = 0;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / (duration * 1000));
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);
  return { ref, value };
}

function Stat({ value, suffix, label }) {
  const { ref, value: v } = useCountUp(value);
  return (
    <div>
      <p className="font-display text-[clamp(1.8rem,3.4vw,2.9rem)] font-light text-cream tabular-nums">
        <span ref={ref}>{v.toLocaleString()}</span>
        <span className="text-gold">{suffix}</span>
      </p>
      <p className="mt-1 text-[11px] tracking-[0.24em] uppercase text-sand">{label}</p>
    </div>
  );
}

function SearchDock() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [date,  setDate]  = useState("");
  const [guests,setGuests]= useState(100);

  const search = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (date) params.set("date", date);
    if (guests !== 100) params.set("guests", String(guests));
    navigate(`/venues${params.size ? `?${params.toString()}` : ""}`);
  };

  return (
    <FadeUp delay={0.55} className="relative z-20">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 rounded-3xl border border-cream/10 bg-coal/70 p-3 backdrop-blur-xl sm:flex-row sm:items-center sm:rounded-full sm:pl-7 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)]">
        <label className="flex flex-1 items-center gap-3 border-b border-cream/10 px-2 py-3 sm:border-b-0 sm:border-r sm:px-0 sm:py-1.5 sm:pr-5">
          <MapPin className="size-4 shrink-0 text-gold" />
          <span className="flex w-full flex-col">
            <span className="text-[9px] tracking-[0.26em] uppercase text-faint">Where</span>
            <input data-hover value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="City, venue or mood…" className="w-full bg-transparent text-sm text-cream placeholder:text-faint focus:outline-none" />
          </span>
        </label>
        <label className="flex flex-1 items-center gap-3 border-b border-cream/10 px-2 py-3 sm:border-b-0 sm:border-r sm:px-0 sm:py-1.5 sm:pr-5">
          <CalendarDays className="size-4 shrink-0 text-gold" />
          <span className="flex w-full flex-col">
            <span className="text-[9px] tracking-[0.26em] uppercase text-faint">When</span>
            <input data-hover type="date" value={date} min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)} className="w-full bg-transparent text-sm text-cream focus:outline-none" />
          </span>
        </label>
        <label className="flex flex-1 items-center gap-3 px-2 py-3 sm:px-0 sm:py-1.5">
          <Users className="size-4 shrink-0 text-gold" />
          <span className="flex w-full flex-col">
            <span className="text-[9px] tracking-[0.26em] uppercase text-faint">Who</span>
            <select data-hover value={guests} onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full bg-transparent text-sm text-cream focus:outline-none [&>option]:bg-coal">
              {[50, 100, 150, 250, 400].map((g) => <option key={g} value={g}>Up to {g} guests</option>)}
            </select>
          </span>
        </label>
        <Magnetic strength={0.25}>
          <button data-hover onClick={search}
            className="shimmer-btn group flex items-center justify-center gap-2 rounded-full bg-gold px-7 py-4 text-[12px] font-medium tracking-[0.16em] uppercase text-ink hover:bg-champagne">
            Search <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </Magnetic>
      </div>
    </FadeUp>
  );
}

export default function Home() {
  const { venues, venuesLoading } = useApp();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY       = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const heroScale   = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const [wordIndex,  setWordIndex]  = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setWordIndex((i) => (i + 1) % ROTATING.length), 2600);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    const id = window.setInterval(() => setQuoteIndex((i) => (i + 1) % TESTIMONIALS.length), 6200);
    return () => window.clearInterval(id);
  }, []);

  const featured = venues.filter((v) => v.featured);
  const picks    = featured.length >= 4 ? featured.slice(0, 4) : venues.slice(0, 4);

  const steps = [
    { icon: Eye,          n: "01", title: "Discover",         body: "Browse rooms the way you'd browse a magazine — honest photography, real capacities, live hourly rates." },
    { icon: CalendarCheck,n: "02", title: "Request the date", body: "Pick a session, send the request. Your booking starts as Pending and the venue owner approves it — usually within hours." },
    { icon: KeyRound,     n: "03", title: "Take the keys",    body: "Approved means the date is locked to your name. One reference, one total — hours times the listed rate." },
  ];

  return (
    <div>
      {/* HERO */}
      <section ref={heroRef} className="relative flex min-h-[100svh] flex-col overflow-hidden">
        <motion.div style={{ y: heroY, scale: heroScale }} className="absolute inset-0">
          <img src={IMAGES.imgHero} alt="Grand event hall" className="h-full w-full object-cover animate-kenburns" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/25 to-ink" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/60 via-transparent to-transparent" />
        </motion.div>
        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-end px-5 pb-12 pt-36 sm:px-8">
          <FadeUp delay={0.15}>
            <div className="mb-7 flex items-center gap-3 text-[11px] tracking-[0.32em] uppercase text-champagne/90">
              <span className="size-1.5 rounded-full bg-gold animate-pulse-dot" />
              {venuesLoading ? "Opening the collection…" : `${venues.length} venues open for requests`}
            </div>
          </FadeUp>
          <h1 className="max-w-5xl font-display font-light leading-[0.98] tracking-[-0.015em] text-cream text-[clamp(3rem,8.4vw,7.6rem)]">
            <RevealWords text="Rooms that make" delay={0.25} />
            <span className="block">
              <RevealWords text="the night" delay={0.5} className="italic text-gold" />
              <span className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]">
                <motion.span className="ml-4 inline-flex h-[0.95em] items-center"
                  initial={{ width: 0, opacity: 0 }} animate={{ width: "auto", opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.8, ease: EASE }}>
                  <span className="relative inline-flex items-center rounded-full border border-gold/40 bg-ink/50 px-[0.45em] text-[0.32em] tracking-[0.2em] uppercase text-champagne backdrop-blur-sm">
                    <AnimatePresence mode="wait">
                      <motion.span key={wordIndex} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: 0.45, ease: EASE }}>
                        for {ROTATING[wordIndex]}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </motion.span>
              </span>
            </span>
            <RevealWords text="unforgettable." delay={0.62} />
          </h1>
          <FadeUp delay={0.45} className="mt-7 max-w-md">
            <p className="text-[15px] leading-relaxed text-cream/70">
              A hand-picked collection of halls, rooftops and open grounds — with live calendars, hourly rates and owner-approved booking requests.
            </p>
          </FadeUp>
          <div className="mt-10"><SearchDock /></div>
          <div className="mt-12 flex items-end justify-between gap-8 border-t border-cream/10 pt-7">
            <div className="grid grid-cols-3 gap-8 sm:gap-14">
              <Stat value={Math.max(venues.length, 6)} suffix="+" label="Listed venues" />
              <Stat value={10} suffix="" label="Venue types" />
              <Stat value={12400} suffix="" label="Hours hosted" />
            </div>
            <div className="hidden sm:flex flex-col items-center gap-2 text-faint">
              <span className="text-[10px] tracking-[0.3em] uppercase [writing-mode:vertical-lr]">Scroll</span>
              <motion.span animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}>
                <ArrowDown className="size-4" />
              </motion.span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* MARQUEE */}
      <Marquee className="border-y border-cream/[0.07] bg-coal/60 py-5"
        itemClassName="font-display text-2xl sm:text-3xl font-light italic text-cream/80"
        items={["Wedding halls", "Banquet halls", "Rooftops", "Auditoriums", "Party halls", "Open grounds", "Conference halls", "Beach venues"]} />

      {/* FEATURED */}
      <section className="mx-auto max-w-[1440px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading index="01" eyebrow="The collection" title="Floors worth dressing up for" />
          <FadeUp delay={0.2}>
            <Link to="/venues" data-hover className="group mb-2 inline-flex items-center gap-2 text-[12px] tracking-[0.2em] uppercase text-sand hover:text-champagne">
              View all {venues.length} venues
              <span className="grid size-9 place-items-center rounded-full border border-cream/15 transition-all duration-300 group-hover:border-gold group-hover:bg-gold group-hover:text-ink">
                <ArrowUpRight className="size-4" />
              </span>
            </Link>
          </FadeUp>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(() => {
            const offsets = ["lg:mt-0", "lg:mt-16", "lg:mt-6", "lg:mt-24"];
            return venuesLoading
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className={`aspect-[4/5] animate-pulse rounded-2xl bg-soot/70 ${i % 2 ? "lg:mt-16" : ""}`} />)
              : picks.map((v, i) => <div key={v.id} className={offsets[i % 4]}><VenueCard venue={v} index={i} /></div>);
          })()}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="border-y border-cream/[0.07] bg-coal/40">
        <div className="mx-auto max-w-[1440px] px-5 py-24 sm:px-8">
          <SectionHeading index="02" eyebrow="Moods" title="Pick your kind of room" align="center" />
          <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4">
            {CATEGORIES.slice(0, 6).map((c, i) => (
              <FadeUp key={c.id} delay={i * 0.06}>
                <Link to={`/venues?cat=${c.id}`} data-hover className="group relative block overflow-hidden rounded-2xl">
                  <div className="aspect-[3/4]">
                    <img src={c.image} alt={c.label} loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-ink/30 group-hover:from-ink/70 transition-opacity duration-500" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="font-display text-lg font-light text-cream">{c.label}</p>
                    <p className="text-[11px] text-cream/60">{c.blurb}</p>
                  </div>
                </Link>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-[1440px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading index="03" eyebrow="The process" title="Three steps to the keys" />
            <FadeUp delay={0.2} className="mt-10 overflow-hidden rounded-3xl">
              <div className="group relative aspect-[4/5] max-w-md overflow-hidden rounded-3xl">
                <img src={IMAGES.imgAbout} alt="Venue interior" loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-full border border-cream/15 bg-ink/50 px-4 py-2 text-[11px] tracking-[0.18em] uppercase text-champagne backdrop-blur-md">
                  <BadgeCheck className="size-4" /> Every venue owner-vetted
                </div>
              </div>
            </FadeUp>
          </div>
          <div className="flex flex-col justify-center">
            {steps.map((s, i) => (
              <FadeUp key={s.n} delay={i * 0.1} className="group border-b border-cream/[0.08] last:border-b-0">
                <div className="flex gap-6 py-10 transition-transform duration-500 sm:gap-10 sm:py-12 group-hover:translate-x-2">
                  <span className="font-display text-sm text-gold">{s.n}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-display text-[clamp(1.6rem,3vw,2.4rem)] font-light text-cream">{s.title}</h3>
                      <span className="grid size-12 shrink-0 place-items-center rounded-full border border-cream/10 text-sand transition-all duration-500 group-hover:border-gold/60 group-hover:text-gold">
                        <s.icon className="size-5" strokeWidth={1.5} />
                      </span>
                    </div>
                    <p className="mt-3 max-w-md text-[15px] leading-relaxed text-sand">{s.body}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="border-y border-cream/[0.07] bg-coal/40 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <FadeUp><span className="mx-auto grid size-14 place-items-center rounded-full border border-gold/30 bg-gold/[0.06]"><Quote className="size-5 text-gold" /></span></FadeUp>
          <div className="relative mt-10 min-h-[220px] sm:min-h-[190px]">
            <AnimatePresence mode="wait">
              <motion.blockquote key={quoteIndex}
                initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
                transition={{ duration: 0.7, ease: EASE }}>
                <p className="font-display text-[clamp(1.35rem,2.8vw,2.1rem)] font-light leading-snug text-cream/95">"{TESTIMONIALS[quoteIndex].quote}"</p>
                <footer className="mt-7">
                  <p className="text-sm tracking-[0.12em] uppercase text-champagne">{TESTIMONIALS[quoteIndex].name}</p>
                  <p className="mt-1 text-[12px] text-faint">{TESTIMONIALS[quoteIndex].role}</p>
                </footer>
              </motion.blockquote>
            </AnimatePresence>
          </div>
          <div className="mt-8 flex justify-center gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button key={i} data-hover aria-label={`Testimonial ${i + 1}`} onClick={() => setQuoteIndex(i)}
                className={`h-1 rounded-full transition-all duration-500 ${i === quoteIndex ? "w-10 bg-gold" : "w-4 bg-cream/15 hover:bg-cream/30"}`} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={IMAGES.imgCta} alt="Ballroom" loading="lazy" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-ink/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink via-transparent to-ink" />
        </div>
        <div className="relative z-10 mx-auto max-w-[1440px] px-5 py-36 text-center sm:px-8 sm:py-44">
          <FadeUp><p className="text-[11px] tracking-[0.34em] uppercase text-champagne">Requests are free — owners approve by hand</p></FadeUp>
          <RevealWords text="Your date is waiting." delay={0.1}
            className="mx-auto mt-6 block max-w-3xl font-display text-[clamp(2.6rem,6.5vw,5.4rem)] font-light leading-[1.02] text-cream" />
          <FadeUp delay={0.25} className="mt-10 flex flex-col items-center gap-4">
            <Magnetic>
              <Link to="/venues" data-hover className="shimmer-btn group inline-flex items-center gap-3 rounded-full bg-gold px-10 py-5 text-[13px] font-medium tracking-[0.16em] uppercase text-ink hover:bg-champagne">
                Browse the collection <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1.5" />
              </Link>
            </Magnetic>
            {venues.length > 0 && (
              <span className="text-[11px] text-cream/50">
                From {money(Math.min(...venues.map((v) => v.pricePerHour)))}/hr · Total = hours × rate, nothing hidden
              </span>
            )}
          </FadeUp>
        </div>
      </section>
    </div>
  );
}
