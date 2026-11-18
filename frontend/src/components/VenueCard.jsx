import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, MapPin, Star, Users } from "lucide-react";
import { CAPACITY_META, money } from "../lib/data";

export default function VenueCard({ venue, index = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-6% 0px" }}
      transition={{ duration: 0.85, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}>
      <Link to={`/venue/${venue.slug}`} data-hover className="group block">
        <div className="relative overflow-hidden rounded-2xl aspect-[4/5] bg-soot">
          <img src={venue.image} alt={venue.name} loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/5 to-ink/10 opacity-90" />

          <div className="absolute left-4 top-4 flex items-center gap-2">
            <span className="rounded-full border border-cream/15 bg-ink/50 px-3.5 py-1.5 text-[10px] tracking-[0.22em] uppercase text-champagne backdrop-blur-md">
              {venue.typeLabel}
            </span>
            <span className="rounded-full border border-gold/25 bg-gold/10 px-3 py-1.5 text-[10px] tracking-[0.18em] uppercase text-champagne backdrop-blur-md">
              {CAPACITY_META[venue.capacityCategory]?.label}
            </span>
          </div>

          <div className="absolute right-4 top-4 grid size-11 translate-y-2 place-items-center rounded-full bg-cream text-ink opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight className="size-4.5" />
          </div>

          <div className="absolute inset-x-0 bottom-0 p-5">
            <div className="flex items-center gap-1.5 text-[11px] tracking-[0.14em] uppercase text-cream/70">
              <MapPin className="size-3.5 shrink-0 text-gold" />
              <span className="truncate">{venue.city}</span>
            </div>
            <h3 className="mt-2 font-display text-[26px] leading-tight font-light text-cream">{venue.name}</h3>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-cream/15 pt-3.5 text-sm">
              <span className="flex items-center gap-4 text-cream/75">
                <span className="flex items-center gap-1.5"><Users className="size-3.5 text-gold/80" />{venue.capacity}</span>
                {venue.rating !== null && <span className="flex items-center gap-1.5"><Star className="size-3.5 fill-gold text-gold" />{venue.rating.toFixed(1)}</span>}
              </span>
              <span>
                <span className="font-display text-lg text-champagne">{money(venue.pricePerHour)}</span>
                <span className="text-[11px] text-cream/50"> /hr</span>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
