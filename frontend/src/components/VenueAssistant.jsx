
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Bot,
  MapPin,
  MessageCircle,
  Minus,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { API_BASE_URL, getToken } from "../lib/api";

const SUGGESTIONS = [
  "Find a wedding venue for 300 guests",
  "Show me affordable venues",
  "Help me choose a venue",
];

function VenueResults({ venues = [] }) {
  if (!venues.length) return null;

  return (
    <div className="mt-4 space-y-3">
      <p className="text-[10px] uppercase tracking-widest text-gold">
        Recommended venues
      </p>

      {venues.slice(0, 4).map((venue, index) => (
        <div
          key={venue.id || index}
          className="overflow-hidden rounded-xl border border-cream/10 bg-ink"
        >
          {venue.image && (
            <img
              src={
                venue.image.startsWith("http")
                  ? venue.image
                  : `${API_BASE_URL.replace(/\/api\/?$/, "")}${venue.image}`
              }
              alt={venue.venue_name || "Venue"}
              className="h-32 w-full object-cover"
            />
          )}

          <div className="p-3">
            <h4 className="font-display text-base text-cream">
              {venue.venue_name || venue.name}
            </h4>

            {venue.location && (
              <p className="mt-2 flex items-center gap-2 text-xs text-sand">
                <MapPin className="size-3 text-gold" />
                {venue.location}
              </p>
            )}

            <div className="mt-2 flex flex-wrap gap-4 text-xs text-sand">
              {venue.capacity && (
                <span className="flex items-center gap-1">
                  <Users className="size-3 text-gold" />
                  {venue.capacity} guests
                </span>
              )}

              {venue.price_per_hour && (
                <span>
                  ₹{Number(venue.price_per_hour).toLocaleString("en-IN")} / hour
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function VenueAssistant() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: "Welcome to Venuva! I'm your venue planning assistant. I can help you find venues, check availability and plan your event. How can I help you today?",
    },
  ]);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });

      inputRef.current?.focus();
    }
  }, [open, messages, sending]);

  const sendMessage = async (text = message) => {
    const cleanMessage = text.trim();

    if (!cleanMessage || sending) return;

    setMessage("");

    setMessages((previous) => [
      ...previous,
      {
        id: `${Date.now()}-user`,
        role: "user",
        text: cleanMessage,
      },
    ]);

    setSending(true);

    try {
      const token = getToken();

      const response = await fetch(
        `${API_BASE_URL}/ai/assistant/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
          body: JSON.stringify({
            message: cleanMessage,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.detail || "Something went wrong."
        );
      }

      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          text: data.answer || "I couldn't find an answer.",
          venues: Array.isArray(data.venues) ? data.venues : [],
        },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-error`,
          role: "assistant",
          text:
            error.message ||
            "The assistant is temporarily unavailable. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[90] font-sans">

      <AnimatePresence>
        {open && (
          <motion.section
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="mb-4 flex h-[min(650px,calc(100dvh-110px))] w-[min(390px,calc(100vw-40px))] flex-col overflow-hidden rounded-2xl border border-gold/25 bg-coal shadow-2xl"
            aria-label="Venuva AI assistant"
          >

            {/* Header */}
            <header className="flex items-center justify-between border-b border-cream/10 bg-ink px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-full border border-gold/30 bg-gold/10 text-gold">
                  <Sparkles className="size-5" />
                </div>

                <div>
                  <h2 className="font-display text-lg text-cream">
                    Venuva Assistant
                  </h2>

                  <p className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-widest text-sand">
                    <span className="size-1.5 rounded-full bg-gold" />
                    Here to help you plan
                  </p>
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                aria-label="Minimize chatbot"
                className="grid size-9 place-items-center rounded-full text-sand transition hover:bg-cream/10 hover:text-cream"
              >
                <Minus className="size-4" />
              </button>
            </header>

            {/* Chat messages */}
            <div
                ref={scrollRef}
                data-lenis-prevent
                className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5"
                style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(201, 161, 92, 0.5) transparent",
                }}
            >
              {messages.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-2 ${
                    item.role === "user" ? "justify-end" : ""
                  }`}
                >
                  {item.role === "assistant" && (
                    <div className="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-gold/10 text-gold">
                      <Bot className="size-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-3 text-[13px] leading-6 ${
                      item.role === "user"
                        ? "rounded-tr-sm bg-gold text-ink"
                        : "rounded-tl-sm border border-cream/10 bg-ink/80 text-cream"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{item.text}</p>

                    {item.venues?.length > 0 && (
                      <VenueResults venues={item.venues} />
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {sending && (
                <div className="flex items-center gap-2">
                  <div className="grid size-7 place-items-center rounded-full bg-gold/10 text-gold">
                    <Bot className="size-4" />
                  </div>

                  <div className="rounded-xl border border-cream/10 bg-ink px-4 py-3 text-xs text-sand">
                    Venuva is thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Suggested questions */}
            {messages.length === 1 && (
              <div className="border-t border-cream/10 px-4 py-3">
                <p className="mb-3 text-[10px] uppercase tracking-widest text-faint">
                  Try asking
                </p>

                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      disabled={sending}
                      onClick={() => sendMessage(suggestion)}
                      className="rounded-full border border-gold/25 px-3 py-2 text-left text-[11px] text-sand transition hover:border-gold hover:text-champagne disabled:opacity-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message input */}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
              className="flex items-center gap-2 border-t border-cream/10 bg-ink p-3"
            >
              <input
                ref={inputRef}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Ask about venues or events..."
                className="min-w-0 flex-1 rounded-full border border-cream/10 bg-coal px-4 py-3 text-[13px] text-cream outline-none placeholder:text-faint focus:border-gold/60"
              />

              <button
                type="submit"
                disabled={!message.trim() || sending}
                className="grid size-11 shrink-0 place-items-center rounded-full bg-gold text-ink transition hover:bg-champagne disabled:opacity-40"
                aria-label="Send message"
              >
                <ArrowUp className="size-5" />
              </button>
            </form>

            <p className="bg-ink pb-2 text-center text-[9px] tracking-wide text-faint">
              Venuva AI · Responses may need confirmation
            </p>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Floating chatbot button */}
      <div className="flex justify-end">
        <button
          onClick={() => setOpen((previous) => !previous)}
          className="flex items-center gap-3 rounded-full border border-gold/40 bg-gold px-5 py-3.5 text-ink shadow-lg transition hover:bg-champagne"
          aria-label="Open Venuva assistant"
        >
          {open ? (
            <X className="size-5" />
          ) : (
            <MessageCircle className="size-5" />
          )}

          <span className="text-[11px] font-semibold uppercase tracking-widest">
            {open ? "Close" : "Ask Venuva"}
          </span>
        </button>
      </div>

    </div>
  );
}
