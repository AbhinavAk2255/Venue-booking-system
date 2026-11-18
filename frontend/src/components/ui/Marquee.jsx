import { Asterisk } from "lucide-react";

export default function Marquee({ items, className = "", itemClassName = "" }) {
  const row = (
    <div className="flex shrink-0 items-center">
      {items.map((item, i) => (
        <span key={i} className="flex items-center">
          <span className={`whitespace-nowrap px-8 ${itemClassName}`}>{item}</span>
          <Asterisk className="size-5 text-gold/70 shrink-0" strokeWidth={1.5} />
        </span>
      ))}
    </div>
  );
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="flex w-max animate-marquee">{row}{row}</div>
    </div>
  );
}
