import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { Accessibility, ArrowLeft, ArrowRight, ArrowUpDown, BadgeCheck, BedDouble, Building2, Car, ChefHat, CircleAlert, Clock, DoorOpen, Flower2, Gem, Info, MapPin, Moon, ShieldCheck, Shirt, Snowflake, Sparkles, Speaker, Star, Sun, Users, UtensilsCrossed, Waves, Wifi, Wine, X } from "lucide-react";
import { CAPACITY_META, isDateBooked, money, prettyDate } from "../lib/data";
import { USE_MOCK, fetchVenueReviews, createVenueReview, generateVenueDecorPreview } from "../lib/api";
import { useApp, useLockBody } from "../lib/store";
import { FadeUp, RevealWords } from "../components/ui/Reveal";
import SectionHeading from "../components/ui/SectionHeading";
import VenueCard from "../components/VenueCard";
import BookingPanel from "../components/BookingPanel";

const AMENITY_ICONS = {
  "In-house catering": UtensilsCrossed, "Sommelier & bar": Wine, "Sonos sound": Speaker,
  "Valet parking": Car, "Furniture included": Sun, "Outdoor terrace": Sun,
  "Wheelchair access": Accessibility, "Late license": Moon, "Coat check": Shirt,
  "AV & production": Sparkles, "Chef kitchen": ChefHat, "Green room": DoorOpen,
  "Security team": ShieldCheck, "Fibre wifi": Wifi, "Bridal suite": Gem,
  "Floral studio": Flower2, "Parking on site": Car, "Accommodation": BedDouble,
  "Swimming pool": Waves, "Private lift lobby": ArrowUpDown, "Air conditioning": Snowflake,
};

const DECOR_PROMPT_EXAMPLES = [
  {
    label: "Kerala Wedding",
    prompt:
      "Decorate this venue for a traditional Kerala wedding with natural jasmine flower garlands, elegant brass lamps, subtle golden decorations and warm lighting. Keep the original room structure and architecture as much as possible.",
  },
  {
    label: "Modern Wedding",
    prompt:
      "Create a modern wedding decoration with beautiful white flowers, elegant fabrics, soft lighting and minimal golden accents. Keep the original venue layout and architecture.",
  },
  {
    label: "Corporate Event",
    prompt:
      "Transform this venue into a professional corporate event space with a modern stage, elegant lighting, organized seating and clean decorations. Preserve the original room structure.",
  },
  {
    label: "Birthday Celebration",
    prompt:
      "Decorate this venue for a beautiful birthday celebration with stylish balloons, colorful floral arrangements, an elegant celebration backdrop and warm lighting. Keep the original venue structure.",
  },
];

export default function VenueDetail() {
  const { slug } = useParams();
  const {venues, venuesLoading, bookedDatesFor, user, bookings, bookingsLoaded, openAuth, toast } = useApp();
  const [sheetOpen, setSheetOpen] = useState(false);
  useLockBody(sheetOpen);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);

  const venue   = useMemo(() => venues.find((v) => v.slug === slug) ?? null, [venues, slug]);
  const similar = useMemo(() => {
    if (!venue) return [];
    const same = venues.filter((v) => v.id !== venue.id && v.type === venue.type);
    const rest = venues.filter((v) => v.id !== venue.id && v.type !== venue.type);
    return [...same, ...rest].slice(0, 3);
  }, [venues, venue]);



  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const [decorPrompt, setDecorPrompt] = useState("");
  const [decorPreview, setDecorPreview] = useState(null);
  const [generatingDecor, setGeneratingDecor] = useState(false);

  const nextFreeDate = useMemo(() => {
    if (!venue || !USE_MOCK) return null;
    const blocked = bookedDatesFor(venue.id);
    const d = new Date();
    for (let i = 0; i < 120; i++) {
      const iso = d.toISOString().slice(0, 10);
      if (!isDateBooked(venue.id, iso) && !blocked.has(iso)) return iso;
      d.setDate(d.getDate() + 1);
    }
    return null;
  }, [venue, bookedDatesFor]);

  useEffect(() => {
    if (!venue) return;

    let active = true;

    setReviewsLoading(true);

    fetchVenueReviews(venue.id)
      .then((data) => {
        if (active) {
          setReviews(Array.isArray(data) ? data : data.results ?? []);
        }
      })
      .catch((error) => {
        if (active) {
          toast(error.message || "Could not load reviews", "error");
        }
      })
      .finally(() => {
        if (active) setReviewsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [venue?.id, toast]);

  const today = new Date().toLocaleDateString("en-CA");

  const eligibleBookings = bookings.filter(
    (booking) =>
      Number(booking.venueId) === Number(venue?.id) &&
      booking.status === "approved" &&
      // booking.date < today &&
      !reviews.some(
        (review) => Number(review.booking) === Number(booking.apiId)
      )
  );

  const handleSubmitReview = async (event) => {
    event.preventDefault();

    if (!user) {
      openAuth("signin");
      return;
    }

    if (user.role !== "customer") {
      toast("Only customers can submit reviews.", "error");
      return;
    }

    if (!eligibleBookings.length) {
      toast("You don't have an eligible booking to review.", "error");
      return;
    }

    if (!comment.trim()) {
      toast("Please write a review comment.", "error");
      return;
    }

    try {
      setSubmittingReview(true);

      await createVenueReview({
        booking: eligibleBookings[0].apiId,
        rating,
        comment: comment.trim(),
      });

      const updatedReviews = await fetchVenueReviews(venue.id);

      setReviews(
        Array.isArray(updatedReviews)
          ? updatedReviews
          : updatedReviews.results ?? []
      );

      setComment("");
      setRating(5);

      toast("Your review was submitted successfully.");
    } catch (error) {
      toast(error.message || "Could not submit review.", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleGenerateDecor = async () => {
    if (!user) {
      openAuth("signin");
      return;
    }

    if (USE_MOCK) {
      toast("Please enable live API mode to use AI decoration.", "error");
      return;
    }

    if (!decorPrompt.trim()) {
      toast("Please describe your decoration idea.", "error");
      return;
    }

    if (decorPrompt.trim().length > 2000) {
      toast("Your prompt cannot exceed 2000 characters.", "error");
      return;
    }

    try {
      setGeneratingDecor(true);
      setDecorPreview(null);

      const response = await generateVenueDecorPreview(
        venue.id,
        decorPrompt.trim()
      );

      if (!response?.preview_url) {
        throw new Error("Preview image was not received.");
      }

      setDecorPreview(response.preview_url);
      toast("Your decoration preview is ready!");
    } catch (error) {
      toast(
        error.message || "Could not generate decoration preview.",
        "error"
      );
    } finally {
      setGeneratingDecor(false);
    }
  };

  if (venuesLoading) return (
    <div className="pt-32 pb-20">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
        <div className="h-[62vh] animate-pulse rounded-3xl bg-soot/70" />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_420px]">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className={`h-4 animate-pulse rounded-full bg-soot/70 ${i === 1 ? "w-1/3" : i === 2 ? "w-2/3" : "w-1/2"}`} />)}
          </div>
          <div className="h-[480px] animate-pulse rounded-3xl bg-soot/70" />
        </div>
      </div>
    </div>
  );

  if (!venue) return (
    <div className="grid min-h-[70vh] place-items-center px-5 pt-24 text-center">
      <div>
        <p className="font-display text-4xl font-light text-cream">That room has checked out.</p>
        <p className="mt-3 text-sm text-sand">The venue isn't in the collection.</p>
        <Link to="/venues" data-hover className="mt-8 inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3.5 text-[12px] font-medium tracking-[0.14em] uppercase text-ink hover:bg-champagne">
          Back to the collection <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="pb-28">
      {/* HERO */}
      <section ref={heroRef} className="relative h-[72vh] min-h-[540px] overflow-hidden">
        <motion.img src={venue.image} alt={venue.name} style={{ y: imgY, scale: 1.08 }} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-ink/50" />
        <div className="absolute inset-x-0 top-0 pt-24">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
            <Link to="/venues" data-hover className="group inline-flex items-center gap-2 rounded-full border border-cream/15 bg-ink/40 px-4 py-2 text-[11px] tracking-[0.18em] uppercase text-cream/80 backdrop-blur-md hover:border-gold/50 hover:text-champagne">
              <ArrowLeft className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" /> All venues
            </Link>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-[1440px] px-5 pb-10 sm:px-8">
            <FadeUp>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-gold/40 bg-ink/50 px-4 py-1.5 text-[10px] tracking-[0.24em] uppercase text-champagne backdrop-blur-md">{venue.typeLabel}</span>
                <span className="rounded-full border border-cream/15 bg-ink/50 px-4 py-1.5 text-[10px] tracking-[0.2em] uppercase text-cream/80 backdrop-blur-md">{CAPACITY_META[venue.capacityCategory]?.label} · {CAPACITY_META[venue.capacityCategory]?.hint}</span>
                {venue.rating !== null && (
                  <span className="flex items-center gap-1.5 rounded-full border border-cream/15 bg-ink/50 px-4 py-1.5 text-[11px] text-cream/85 backdrop-blur-md">
                    <Star className="size-3.5 fill-gold text-gold" /> {venue.rating.toFixed(1)} <span className="text-cream/50">· {venue.reviews} reviews</span>
                  </span>
                )}
              </div>
            </FadeUp>
            <RevealWords text={venue.name} delay={0.1} className="mt-4 block max-w-4xl font-display text-[clamp(2.6rem,6.6vw,5.6rem)] font-light leading-[0.98] text-cream" />
            <FadeUp delay={0.25}><p className="mt-4 flex items-center gap-2 text-sm text-cream/75"><MapPin className="size-4 shrink-0 text-gold" />{venue.location}</p></FadeUp>
          </div>
        </div>
      </section>

      {/* BODY */}
      <div className="mx-auto mt-12 grid max-w-[1440px] gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_420px]">
        <div>
          {/* Quick stats */}
          <FadeUp>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Users,     label: "Capacity",  value: `${venue.capacity} guests` },
                { icon: BadgeCheck,label: "Category",  value: CAPACITY_META[venue.capacityCategory]?.label },
                { icon: Clock,     label: "Hire rate", value: `${money(venue.pricePerHour)}/hr` },
                { icon: Sun,       label: "Sessions",  value: "Day · eve · full" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-2xl border border-cream/[0.08] bg-coal/60 p-4">
                  <Icon className="size-4 text-gold" />
                  <p className="mt-3 text-sm text-cream">{value}</p>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-faint">{label}</p>
                </div>
              ))}
            </div>
          </FadeUp>

          {/* Description */}
          <FadeUp delay={0.05}>
            <p className="mt-12 text-[11px] tracking-[0.3em] uppercase text-gold">The space</p>
            {venue.description.map((p, i) => (
              <p key={i} className={`mt-5 leading-[1.85] text-sand ${i === 0 ? "text-[17px] text-cream/80" : "text-[15px]"}`}>{p}</p>
            ))}
          </FadeUp>

          {/* Gallery */}
          <div className="mt-10 grid grid-cols-3 gap-3">
            {venue.gallery.map((src, i) => (
              <FadeUp key={i} delay={i * 0.08}>
                <div className="group aspect-[4/5] overflow-hidden rounded-2xl">
                  <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105" />
                </div>
              </FadeUp>
            ))}
          </div>


            {/* AI VENUE DECOR SIMULATOR */}
            <section className="px-4 py-16 md:px-8 lg:px-12">
              <div className="mx-auto max-w-6xl">

                <div className="mb-8">
                  <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#c9a15c]">
                    AI Experience
                  </span>

                  <h2 className="mt-3 font-serif text-3xl text-[#f4ead8] md:text-4xl">
                    Visualize Your Event
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[#b5aa98]">
                    Imagine your celebration in this venue. Describe your decoration
                    ideas and let AI create a visual preview.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#c9a15c]/20 bg-[#15130f] p-5 md:p-8">

                  {/* Example prompts */}
                  <div className="mb-5">
                    <h3 className="mb-3 text-sm font-medium text-[#f4ead8]">
                      Need some inspiration?
                    </h3>

                    <div className="flex flex-wrap gap-2">
                      {DECOR_PROMPT_EXAMPLES.map((example) => (
                        <button
                          key={example.label}
                          type="button"
                          onClick={() => setDecorPrompt(example.prompt)}
                          className="rounded-full border border-[#c9a15c]/30 px-4 py-2 text-xs text-[#d8c6a5] transition hover:border-[#c9a15c] hover:bg-[#c9a15c]/10"
                        >
                          {example.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Customer prompt */}
                  <div>
                    <label className="mb-3 block text-sm font-medium text-[#f4ead8]">
                      Describe your decoration idea
                    </label>

                    <textarea
                      value={decorPrompt}
                      onChange={(e) => setDecorPrompt(e.target.value)}
                      placeholder="Example: Decorate this venue with beautiful white jasmine flowers, traditional Kerala lamps, elegant golden decorations and warm lighting..."
                      rows={5}
                      maxLength={2000}
                      className="w-full resize-y rounded-xl border border-[#c9a15c]/20 bg-[#0d0c09] p-4 text-sm leading-7 text-[#f4ead8] outline-none placeholder:text-[#777064] focus:border-[#c9a15c]"
                    />

                    <div className="mt-2 flex justify-end">
                      <span className="text-xs text-[#918879]">
                        {decorPrompt.length}/2000 characters
                      </span>
                    </div>
                  </div>

                  {/* Generate button */}
                  <button
                    type="button"
                    onClick={handleGenerateDecor}
                    disabled={generatingDecor || !decorPrompt.trim()}
                    className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl bg-[#c9a15c] px-6 py-4 text-sm font-semibold text-[#17120b] transition hover:bg-[#d8b778] disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                  >
                    {generatingDecor ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#17120b] border-t-transparent" />
                        Creating Your Preview...
                      </>
                    ) : (
                      "Generate My Venue Preview"
                    )}
                  </button>

                  <p className="mt-3 text-xs leading-6 text-[#918879]">
                    AI-generated previews are conceptual visualizations. Actual
                    decorations and venue appearance may vary.
                  </p>

                  {/* Generated preview */}
                  {decorPreview && (
                    <div className="mt-10 border-t border-[#c9a15c]/20 pt-8">
                      <h3 className="mb-6 font-serif text-2xl text-[#f4ead8]">
                        Your Decorated Venue
                      </h3>

                      <div className="grid gap-6 md:grid-cols-2">

                        <div>
                          <p className="mb-3 text-sm text-[#b5aa98]">
                            Original Venue
                          </p>
                          <img
                            src={venue.image}
                            alt="Original venue"
                            className="h-64 w-full rounded-xl object-cover"
                          />
                        </div>

                        <div>
                          <p className="mb-3 text-sm text-[#c9a15c]">
                            AI Decoration Preview
                          </p>
                          <img
                            src={decorPreview}
                            alt="AI decorated venue preview"
                            className="h-64 w-full rounded-xl object-cover"
                          />
                        </div>

                      </div>

                      <a
                        href={decorPreview}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 inline-block text-sm text-[#c9a15c] underline underline-offset-4"
                      >
                        Open Generated Image
                      </a>
                    </div>
                  )}

                </div>
              </div>
            </section>


          {/* Amenities */}
          <FadeUp className="mt-14">
            <p className="text-[11px] tracking-[0.3em] uppercase text-gold">Everything included</p>
            <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {venue.amenities.map((a) => {
                const Icon = AMENITY_ICONS[a] ?? Sparkles;
                return (
                  <div key={a} className="flex items-center gap-3.5 rounded-xl border border-cream/[0.08] px-4 py-3.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold/[0.08] text-gold"><Icon className="size-4" /></span>
                    <span className="text-sm text-cream/85">{a}</span>
                  </div>
                );
              })}
            </div>
          </FadeUp>

          {/* Event types */}
          <FadeUp className="mt-12">
            <p className="text-[11px] tracking-[0.3em] uppercase text-gold">Made for</p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {venue.eventTypes.map((t) => (
                <span key={t} className="rounded-full border border-cream/12 px-4.5 py-2 text-[12px] tracking-wide text-cream/80">{t}</span>
              ))}
            </div>
          </FadeUp>

          {/* Host + policies */}
          <div className="mt-14 grid gap-4 sm:grid-cols-2">
            <FadeUp>
              <div className="h-full rounded-2xl border border-cream/[0.08] bg-coal/60 p-6">
                <div className="flex items-center gap-4">
                  {venue.host ? (
                    <>
                      <span className="grid size-13 place-items-center rounded-full bg-gold font-display text-lg text-ink">{venue.host.name.split(" ").map((p) => p[0]).join("")}</span>
                      <div><p className="text-cream">{venue.host.name}</p><p className="text-xs text-faint">{venue.host.role} · since {venue.host.since}</p></div>
                    </>
                  ) : (
                    <>
                      <span className="grid size-13 place-items-center rounded-full bg-gold/[0.1] text-gold"><Building2 className="size-5" /></span>
                      <div><p className="text-cream">Hosted venue</p><p className="text-xs text-faint">Listed & approved by the owner</p></div>
                    </>
                  )}
                </div>
                <p className="mt-5 text-sm leading-relaxed text-sand">"We keep the calendar honest and the lights warm. Send a request — I usually answer within the hour."</p>
              </div>
            </FadeUp>
            <FadeUp delay={0.08}>
              <div className="h-full rounded-2xl border border-cream/[0.08] bg-coal/60 p-6">
                <p className="flex items-center gap-2 text-[11px] tracking-[0.24em] uppercase text-sand"><Info className="size-4 text-gold" /> Good to know</p>
                <ul className="mt-4 space-y-3 text-sm text-sand">
                  <li className="flex gap-2.5"><BadgeCheck className="mt-0.5 size-4 shrink-0 text-gold/80" /> Requests are free — status starts as Pending</li>
                  <li className="flex gap-2.5"><BadgeCheck className="mt-0.5 size-4 shrink-0 text-gold/80" /> Total = session hours × hourly rate</li>
                  <li className="flex gap-2.5"><CircleAlert className="mt-0.5 size-4 shrink-0 text-gold/80" /> Approved or declined by the venue owner directly</li>
                </ul>
              </div>
            </FadeUp>
          </div>

          {nextFreeDate && (
            <FadeUp className="mt-10">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gold/25 bg-gold/[0.05] px-6 py-5">
                <p className="text-sm text-champagne">Next available: <span className="font-display text-lg">{prettyDate(nextFreeDate)}</span></p>
                <p className="text-xs text-faint">Live calendar · owner-approved</p>
              </div>
            </FadeUp>
          )}
        </div>

        {/* Sticky booking column (desktop) */}
        <div className="hidden lg:block">
          <div className="sticky top-24">
            <FadeUp delay={0.15}><BookingPanel venue={venue} /></FadeUp>
          </div>
        </div>
      </div>

      {/* Similar venues */}
      {similar.length > 0 && (
        <section className="mx-auto mt-28 max-w-[1440px] px-5 sm:px-8">
          <SectionHeading index="·" eyebrow="Keep looking" title="More rooms in this mood" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((v, i) => <VenueCard key={v.id} venue={v} index={i} />)}
          </div>
        </section>
      )}


      {/* Compact Reviews Section */}
      <FadeUp className="mt-10 mx-auto w-full max-w-6xl">
        <div className="w-full border-t border-white/10 pt-7">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Guest Reviews
              </h2>
              <p className="text-xs text-white/40 mt-1">
                What customers say about this venue
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold text-white">
                {reviews.length
                  ? (
                      reviews.reduce(
                        (sum, review) => sum + Number(review.rating),
                        0
                      ) / reviews.length
                    ).toFixed(1)
                  : "—"}
              </span>
              <span className="text-xs text-white/40">
                ({reviews.length})
              </span>
            </div>
          </div>

          {/* Review List */}
          {reviewsLoading ? (
            <p className="text-xs text-white/40">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-white/40 py-3">
              No reviews yet. Be the first to review this venue.
            </p>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-lg border border-white/10 bg-white/[0.02] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-white">
                      {review.customer_name || "Customer"}
                    </span>

                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= Number(review.rating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-white/20"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-white/60 mt-2 leading-relaxed">
                    {review.comment}
                  </p>

                  <p className="text-[10px] text-white/30 mt-2">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}



          {/* Compact Review Form */}
          <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <h3 className="text-sm font-medium text-white mb-3">
              Write a Review
            </h3>

            <form onSubmit={handleSubmitReview} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">Your rating:</span>

                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      aria-label={`Rate ${star} out of 5`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-white/20 hover:text-amber-400"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={2}
                maxLength={1000}
                placeholder="Share your experience..."
                className="w-full rounded-md border border-white/10 bg-black/20 p-2.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-amber-400/50 resize-none"
              />

              {!user ? (
                <p className="text-xs text-white/40">
                  Please sign in to submit your review.
                </p>
              ) : user.role !== "customer" ? (
                <p className="text-xs text-white/40">
                  Only customers can submit reviews.
                </p>
              ) : !bookingsLoaded ? (
                <p className="text-xs text-white/40">
                  Checking your booking eligibility...
                </p>
              ) : eligibleBookings.length === 0 ? (
                <p className="text-xs text-white/40">
                  An approved past booking is required to submit a review.
                </p>
              ) : null}

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/30">
                  {comment.length}/1000 characters
                </span>

                <button
                  type="submit"
                  disabled={
                    submittingReview ||
                    !user ||
                    user.role !== "customer" ||
                    !bookingsLoaded ||
                    eligibleBookings.length === 0 ||
                    !comment.trim()
                  }
                  className="rounded-md bg-amber-400 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>

            {!user && (
              <button
                type="button"
                onClick={() => openAuth("signin")}
                className="mt-2 text-xs text-amber-400 hover:underline"
              >
                Sign in to review
              </button>
            )}
          </div>
        </div>
      </FadeUp>


      {/* Mobile sticky CTA */}
      <div className="fixed bottom-4 left-4 right-4 z-[9999] lg:hidden">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-cream/10 bg-coal/95 px-5 py-4 backdrop-blur-xl shadow-[0_-12px_48px_rgba(0,0,0,0.55)]">
          <div>
            <p className="text-[10px] tracking-[0.22em] uppercase text-faint">Hire rate</p>
            <p className="font-display text-xl text-cream">{money(venue.pricePerHour)}<span className="text-xs text-sand"> /hr</span></p>
          </div>
          {!sheetOpen && (
          <button
            type="button"
            data-hover
            onClick={() => setSheetOpen(true)}
            className="shimmer-btn flex-1 cursor-pointer rounded-full bg-gold py-3.5 text-[12px] font-medium tracking-[0.16em] uppercase text-ink hover:bg-champagne"
          >
            Request date
          </button>
          )}
        </div>
      </div>
      
      {/* Mobile sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[130] bg-ink/70 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSheetOpen(false)}
            />

            <motion.div
              className="fixed inset-x-0 bottom-0 z-[135] flex h-[88dvh] max-h-[88dvh] flex-col overflow-hidden rounded-t-[28px] bg-coal lg:hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 34 }}
            >
              {/* Sticky header */}
              <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-cream/10 bg-coal px-5 py-4">
                <span className="absolute left-1/2 top-2.5 h-1 w-10 -translate-x-1/2 rounded-full bg-cream/20" />

                <p className="text-[11px] tracking-[0.26em] uppercase text-sand">
                  Reserve {venue.name}
                </p>

                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="grid size-9 cursor-pointer place-items-center rounded-full border border-cream/10 text-sand"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Scrollable booking content */}
              <div
                data-lenis-prevent
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-12"
                style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
                
              >
                <BookingPanel
                  venue={venue}
                  onBooked={() => setSheetOpen(false)}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
