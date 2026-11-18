import imgHero from "../assets/hero.jpg";

const imgRooftop =
  "https://images.pexels.com/photos/9584741/pexels-photo-9584741.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";
const imgWarehouse =
  "https://images.pexels.com/photos/17206167/pexels-photo-17206167.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";
const imgOrangery =
  "https://images.pexels.com/photos/34222127/pexels-photo-34222127.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";
const imgGallery =
  "https://images.pexels.com/photos/6727760/pexels-photo-6727760.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";
const imgEstate =
  "https://images.pexels.com/photos/19986483/pexels-photo-19986483.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";
const imgPenthouse =
  "https://images.pexels.com/photos/6970051/pexels-photo-6970051.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";
const imgAbout =
  "https://images.pexels.com/photos/10339485/pexels-photo-10339485.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
const imgCta =
  "https://images.pexels.com/photos/19569865/pexels-photo-19569865.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";

export const IMAGES = { imgHero, imgAbout, imgCta };

export const MOOD_SHOTS = [
  "https://images.pexels.com/photos/8112945/pexels-photo-8112945.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  "https://images.pexels.com/photos/10666399/pexels-photo-10666399.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  "https://images.pexels.com/photos/29811321/pexels-photo-29811321.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  "https://images.pexels.com/photos/21775093/pexels-photo-21775093.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  "https://images.pexels.com/photos/9822760/pexels-photo-9822760.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  "https://images.pexels.com/photos/30142375/pexels-photo-30142375.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
];

export const TYPE_META = {
  wedding_hall: {
    id: "wedding_hall", label: "Wedding halls", blurb: "Vows with a view", image: imgEstate,
    amenities: ["In-house catering", "Sommelier & bar", "Bridal suite", "Floral studio", "Outdoor terrace", "Parking on site", "Furniture included", "Late license"],
    eventTypes: ["Weddings", "Receptions", "Engagements", "Family celebrations"],
  },
  banquet_hall: {
    id: "banquet_hall", label: "Banquet halls", blurb: "Long tables, low light", image: imgHero,
    amenities: ["In-house catering", "Sommelier & bar", "Chef kitchen", "Coat check", "Furniture included", "Sonos sound", "Wheelchair access"],
    eventTypes: ["Gala dinners", "Award nights", "Charity balls", "Anniversaries"],
  },
  auditorium: {
    id: "auditorium", label: "Auditoriums", blurb: "Every seat a front row", image: imgCta,
    amenities: ["AV & production", "Sonos sound", "Green room", "Security team", "Coat check", "Fibre wifi", "Wheelchair access"],
    eventTypes: ["Performances", "Screenings", "Keynotes", "Ceremonies"],
  },
  conference_hall: {
    id: "conference_hall", label: "Conference halls", blurb: "Big-idea energy", image: imgWarehouse,
    amenities: ["AV & production", "Fibre wifi", "Sonos sound", "Furniture included", "Wheelchair access", "Parking on site", "Air conditioning"],
    eventTypes: ["Conferences", "Summits", "Town halls", "Product reveals"],
  },
  meeting_room: {
    id: "meeting_room", label: "Meeting rooms", blurb: "Small rooms, sharp minds", image: imgGallery,
    amenities: ["Fibre wifi", "AV & production", "Air conditioning", "Furniture included", "Wheelchair access"],
    eventTypes: ["Board meetings", "Workshops", "Off-sites", "Interviews"],
  },
  party_hall: {
    id: "party_hall", label: "Party halls", blurb: "Built for the bass", image: imgPenthouse,
    amenities: ["Sonos sound", "Sommelier & bar", "Late license", "Security team", "Coat check", "Furniture included", "In-house catering"],
    eventTypes: ["Birthdays", "After-parties", "New Year's Eve", "Private celebrations"],
  },
  convention_center: {
    id: "convention_center", label: "Convention centers", blurb: "Scale without echo", image: imgWarehouse,
    amenities: ["AV & production", "Fibre wifi", "Security team", "Parking on site", "Wheelchair access", "Air conditioning", "Furniture included"],
    eventTypes: ["Expos", "Trade shows", "Conventions", "Job fairs"],
  },
  rooftop_venue: {
    id: "rooftop_venue", label: "Rooftop venues", blurb: "Skyline on tap", image: imgRooftop,
    amenities: ["Sommelier & bar", "Outdoor terrace", "Sonos sound", "Valet parking", "Late license", "Furniture included", "In-house catering"],
    eventTypes: ["Cocktail receptions", "Sunset ceremonies", "Brand launches", "Fashion week"],
  },
  beach_venue: {
    id: "beach_venue", label: "Beach venues", blurb: "Salt air, bare feet", image: imgOrangery,
    amenities: ["Outdoor terrace", "Sommelier & bar", "In-house catering", "Late license", "Parking on site", "Furniture included"],
    eventTypes: ["Beach weddings", "Sundowners", "Retreats", "Shoots"],
  },
  open_ground: {
    id: "open_ground", label: "Open grounds", blurb: "Sky is the ceiling", image: imgEstate,
    amenities: ["Outdoor terrace", "Parking on site", "Security team", "In-house catering", "Sonos sound", "Furniture included"],
    eventTypes: ["Festivals", "Receptions", "Concerts", "Markets"],
  },
};

export const CATEGORIES = Object.values(TYPE_META);

export const CAPACITY_META = {
  intimate: { label: "Intimate", hint: "up to 200 guests" },
  classic:  { label: "Classic",  hint: "up to 500 guests" },
  grand:    { label: "Grand",    hint: "up to 1,000 guests" },
  elite:    { label: "Elite",    hint: "1,000+ guests" },
};

export const SESSIONS = [
  { id: "day",     label: "Day session",     time: "09:00 — 17:00", start: "09:00", end: "17:00", hours: 8  },
  { id: "evening", label: "Evening session", time: "18:00 — 23:00", start: "18:00", end: "23:00", hours: 5  },
  { id: "full",    label: "Full day",        time: "09:00 — 23:00", start: "09:00", end: "23:00", hours: 14 },
];

export const ADDONS = [
  { id: "catering", name: "Catering by Maison",     desc: "Three-course seated menu, wine pairing optional",       price: 78,   per: "guest" },
  { id: "bar",      name: "Cocktail & bar service", desc: "Two resident bartenders, full back bar",                 price: 44,   per: "guest" },
  { id: "av",       name: "AV & production",        desc: "Line-array sound, intelligent lighting, technician",     price: 1200, per: "flat"  },
  { id: "florals",  name: "Florals & styling",      desc: "Tablescapes and installations by our studio",            price: 940,  per: "flat"  },
  { id: "security", name: "Security & door staff",  desc: "Discreet licensed team for the full hire",               price: 480,  per: "flat"  },
];

export const DEMO_VENUES = [
  {
    id: 1, slug: "the-meridian-rooftop-1", name: "The Meridian Rooftop",
    type: "rooftop_venue", typeLabel: "Rooftop venue", capacityCategory: "classic",
    location: "41 W 57th St, Manhattan, New York", city: "New York",
    description: [
      "Perched on the 32nd floor above Midtown, The Meridian wraps around a corner of the skyline that most New Yorkers have only seen in photographs. Glass balustrades dissolve the edge between your guests and the city.",
      "The terrace flows into a climate-controlled lounge for year-round hires, with a dedicated service kitchen, green room, and freight elevator access for production.",
    ],
    capacity: 220, pricePerHour: 850, rating: 4.9, reviews: 187, image: imgRooftop,
    gallery: [MOOD_SHOTS[1], MOOD_SHOTS[2], MOOD_SHOTS[5]],
    amenities: TYPE_META.rooftop_venue.amenities, eventTypes: TYPE_META.rooftop_venue.eventTypes,
    host: { name: "Marisol Vega", role: "Venue Director", since: 2019 }, featured: true,
  },
  {
    id: 2, slug: "foundry-no-9-2", name: "Foundry No. 9",
    type: "convention_center", typeLabel: "Convention center", capacityCategory: "classic",
    location: "9 Orsman Rd, Hackney, London", city: "London",
    description: [
      "A nineteenth-century iron foundry on the Regent's Canal, stripped back to brick, beam and shadow. 14-metre ceilings, gantry cranes intact, and light that behaves exactly how your photographer hopes.",
      "The main hall holds 400 standing with a mezzanine overlooking the floor. Drive-in access makes it one of the most production-friendly raw spaces in the city.",
    ],
    capacity: 400, pricePerHour: 560, rating: 4.8, reviews: 243, image: imgWarehouse,
    gallery: [MOOD_SHOTS[0], MOOD_SHOTS[4], MOOD_SHOTS[2]],
    amenities: TYPE_META.convention_center.amenities, eventTypes: TYPE_META.convention_center.eventTypes,
    host: { name: "Tomás Okafor", role: "Head of Spaces", since: 2017 }, featured: true,
  },
  {
    id: 3, slug: "the-orangery-hallow-hall-3", name: "The Orangery, Hallow Hall",
    type: "wedding_hall", typeLabel: "Wedding hall", capacityCategory: "intimate",
    location: "Hallow Hall Estate, Gloucestershire, Cotswolds", city: "Cotswolds",
    description: [
      "A Victorian glasshouse restored pane by pane, where dinner happens under olive trees and the weather is always a rumour.",
      "Hires include the adjoining walled garden for ceremonies and the stone bothy as a bridal suite.",
    ],
    capacity: 160, pricePerHour: 720, rating: 5.0, reviews: 98, image: imgOrangery,
    gallery: [MOOD_SHOTS[3], MOOD_SHOTS[1], MOOD_SHOTS[4]],
    amenities: TYPE_META.wedding_hall.amenities, eventTypes: TYPE_META.wedding_hall.eventTypes,
    host: { name: "Eleanor Whitfield", role: "Estate Manager", since: 2021 }, featured: true,
  },
  {
    id: 4, slug: "concrete-poem-4", name: "Concrete Poem",
    type: "conference_hall", typeLabel: "Conference hall", capacityCategory: "intimate",
    location: "Refshalevej 167A, Refshaleøen, Copenhagen", city: "Copenhagen",
    description: [
      "A former shipyard warehouse reimagined as a gallery of almost aggressive calm: raw concrete, a seven-metre ceiling, and a floor polished to a black mirror.",
      "Track lighting covers every square metre, the acoustics were tuned for both string quartets and sound systems.",
    ],
    capacity: 180, pricePerHour: 480, rating: 4.7, reviews: 134, image: imgGallery,
    gallery: [MOOD_SHOTS[4], MOOD_SHOTS[0], MOOD_SHOTS[3]],
    amenities: TYPE_META.conference_hall.amenities, eventTypes: TYPE_META.conference_hall.eventTypes,
    host: { name: "Freja Lindqvist", role: "Gallery Director", since: 2020 },
  },
  {
    id: 5, slug: "terra-doro-estate-5", name: "Terra d'Oro Estate",
    type: "open_ground", typeLabel: "Open ground", capacityCategory: "classic",
    location: "Strada di Casole 12, Greve in Chianti, Tuscany", city: "Chianti",
    description: [
      "A working vineyard estate where the courtyard does most of the decorating for you. Stone walls four centuries deep, strings of light overhead.",
      "The estate's own Chianti Classico is poured from magnums and a catering team cooks out of the old farmhouse kitchen.",
    ],
    capacity: 240, pricePerHour: 980, rating: 4.9, reviews: 156, image: imgEstate,
    gallery: [MOOD_SHOTS[2], MOOD_SHOTS[3], MOOD_SHOTS[0]],
    amenities: [...TYPE_META.open_ground.amenities, "Bridal suite", "Accommodation", "Swimming pool"],
    eventTypes: ["Destination weddings", "Harvest dinners", "Retreats", "Family reunions"],
    host: { name: "Giulia Romano", role: "Proprietor", since: 2015 }, featured: true,
  },
  {
    id: 6, slug: "aurora-penthouse-6", name: "Aurora Penthouse",
    type: "party_hall", typeLabel: "Party hall", capacityCategory: "intimate",
    location: "Marina Gate Tower, Level 58, Dubai Marina, Dubai", city: "Dubai",
    description: [
      "Fifty-eight floors up, with the Marina laid out below like circuitry. A double-height salon, a wrap-around terrace, and a private lift lobby.",
      "The building's concierge partners with our team for valet, security and late-night licensing.",
    ],
    capacity: 120, pricePerHour: 920, rating: 4.8, reviews: 92, image: imgPenthouse,
    gallery: [MOOD_SHOTS[5], MOOD_SHOTS[4], MOOD_SHOTS[1]],
    amenities: [...TYPE_META.party_hall.amenities, "Private lift lobby", "Valet parking"],
    eventTypes: ["Private celebrations", "Board dinners", "After-parties", "Product reveals"],
    host: { name: "Adil Rahman", role: "Private Events Lead", since: 2022 },
  },
];

export const TESTIMONIALS = [
  {
    quote: "We booked Foundry No. 9 on a Tuesday afternoon and launched to four hundred people that Friday. Nothing about it felt like the usual venue-email ping-pong.",
    name: "Anya Rostova", role: "Brand Director, launching a fragrance in London",
  },
  {
    quote: "The Orangery at dusk is the closest thing to a cheat code for a beautiful wedding. Our planner asked for the booking reference twice.",
    name: "James & Catarina Oduya", role: "Married at Hallow Hall, 140 guests",
  },
  {
    quote: "Aurora's team flagged our lift-load schedule before we'd even thought about it. That's the difference between renting a space and hiring a venue.",
    name: "Laila Haddad", role: "Events Lead, regional fashion house",
  },
];

export const BOOKINGS_CHANGED_EVENT = "venuva:bookings-changed";

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function isDateBooked(venueId, isoDate) {
  return hashString(`${venueId}::${isoDate}`) % 100 < 24;
}

export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function prettyDate(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export function money(n) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function slugify(name, id) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + id;
}

export function formatTime(t) {
  return t.length >= 5 ? t.slice(0, 5) : t;
}
