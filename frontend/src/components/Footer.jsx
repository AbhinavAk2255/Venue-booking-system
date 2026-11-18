import { Link } from "react-router-dom";
import { ArrowUpRight, AtSign, Camera, Globe } from "lucide-react";
import { useApp } from "../lib/store";
import Magnetic from "./ui/Magnetic";

export default function Footer() {
  const { user, openAuth } = useApp();
  return (
    <footer className="relative border-t border-cream/[0.07] bg-coal/60 overflow-hidden">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 pt-20 pb-8">
        <div className="grid gap-14 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <p className="font-display text-3xl font-light text-cream leading-snug">
              Find the venue<br />
              <span className="italic text-gold">your event deserves.</span>
            </p>
            {!user && (
              <button data-hover onClick={() => openAuth("signup")}
                className="mt-7 group inline-flex items-center gap-2 text-[13px] tracking-[0.14em] uppercase text-sand hover:text-champagne transition-colors">
                Create an account <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:rotate-45" />
              </button>
            )}
          </div>

          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-faint mb-5">Explore</p>
            <ul className="space-y-3 text-sm text-sand">
              <li><Link data-hover to="/"          className="hover:text-cream transition-colors">Discover</Link></li>
              <li><Link data-hover to="/venues"    className="hover:text-cream transition-colors">The Collection</Link></li>
              <li><Link data-hover to="/dashboard" className="hover:text-cream transition-colors">My bookings</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-faint mb-5">Categories</p>
            <ul className="space-y-3 text-sm text-sand">
              {["wedding_hall", "banquet_hall", "rooftop_venue", "conference_hall", "party_hall", "auditorium"].map((c) => (
                <li key={c}>
                  <Link data-hover to={`/venues?cat=${c}`} className="hover:text-cream transition-colors capitalize">
                    {c.replace(/_/g, " ")}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-faint mb-5">Stay in touch</p>
            <form className="flex items-end gap-3 border-b border-cream/15 focus-within:border-gold/70 transition-colors pb-2" onSubmit={(e) => e.preventDefault()}>
              <input data-hover type="email" placeholder="your@email.com"
                className="w-full bg-transparent text-sm text-cream placeholder:text-faint focus:outline-none" />
              <button data-hover aria-label="Subscribe" className="text-gold hover:text-champagne transition-colors">
                <ArrowUpRight className="size-5" />
              </button>
            </form>
            <div className="mt-6 flex gap-3">
              {[Camera, AtSign, Globe].map((Icon, i) => (
                <Magnetic key={i} strength={0.4}>
                  <button data-hover className="grid size-10 place-items-center rounded-full border border-cream/10 text-sand hover:text-gold hover:border-gold/40 transition-colors">
                    <Icon className="size-4" />
                  </button>
                </Magnetic>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-20 select-none overflow-hidden">
          <p className="font-display text-[clamp(4rem,14vw,13rem)] leading-[0.85] text-center text-stroke-cream tracking-[0.04em] whitespace-nowrap">
            VENUVA
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-cream/[0.07] pt-6 text-[11px] tracking-[0.18em] uppercase text-faint">
          <span>© {new Date().getFullYear()} Venuva. All rights reserved.</span>
          <span>Powered by Venuva</span>
        </div>
      </div>
    </footer>
  );
}
