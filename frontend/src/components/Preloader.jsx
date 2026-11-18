import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Preloader({ onDone }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const dur = 1500;
    let raf = 0;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      setCount(Math.round(p * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setTimeout(onDone, 350);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <motion.div className="fixed inset-0 z-[150] bg-ink flex flex-col items-center justify-center"
      exit={{ clipPath: "inset(0 0 100% 0)" }}
      transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="overflow-hidden">
        <motion.div initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-[clamp(2.6rem,8vw,5.5rem)] font-light tracking-[0.08em] text-cream"
        >
          Ven<span className="italic text-gold">u</span>va
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="mt-3 text-[10px] tracking-[0.5em] uppercase text-sand"
      >
        Find your perfect venue
      </motion.div>
      <div className="absolute bottom-8 right-8 font-display text-5xl font-light text-cream/25 tabular-nums">
        {String(count).padStart(3, "0")}
      </div>
      <div className="absolute bottom-0 left-0 h-px bg-gold" style={{ width: `${count}%` }} />
    </motion.div>
  );
}
