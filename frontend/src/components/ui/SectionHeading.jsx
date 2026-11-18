import { FadeUp, RevealWords } from "./Reveal";

export default function SectionHeading({ index, eyebrow, title, className = "", align = "left" }) {
  return (
    <div className={`${align === "center" ? "text-center" : ""} ${className}`}>
      <FadeUp>
        <div className={`flex items-center gap-3 text-[11px] tracking-[0.32em] uppercase text-sand ${align === "center" ? "justify-center" : ""}`}>
          <span className="text-gold">{index}</span>
          <span className="h-px w-8 bg-gold/50" />
          <span>{eyebrow}</span>
        </div>
      </FadeUp>
      <RevealWords text={title} delay={0.08}
        className="mt-5 block font-display text-[clamp(2.2rem,5.2vw,4.2rem)] leading-[1.02] font-light tracking-[-0.01em] text-cream"
      />
    </div>
  );
}
