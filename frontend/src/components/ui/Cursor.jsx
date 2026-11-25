import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [pressed, setPressed] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 320, damping: 28, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 320, damping: 28, mass: 0.6 });

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setEnabled(true);
    const move = (e) => {
      x.set(e.clientX); y.set(e.clientY);
      const t = e.target;
      setHovering(!!t.closest("a, button, [data-hover], input, select, label, [role='button']"));
    };
    const down = () => setPressed(true);
    const up   = () => setPressed(false);
    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
    };
  }, [x, y]);

  if (!enabled) return null;
  return (
    <>
      <motion.div aria-hidden className="fixed top-0 left-0 z-[10000] pointer-events-none rounded-full bg-champagne mix-blend-difference"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
        animate={{ width: pressed ? 14 : 8, height: pressed ? 14 : 8 }}
        transition={{ duration: 0.15 }}
      />
      <motion.div aria-hidden className="fixed top-0 left-0 z-[10000] pointer-events-none rounded-full border border-gold/70"
        style={{ x: ringX, y: ringY, translateX: "-50%", translateY: "-50%" }}
        animate={{ width: hovering ? 52 : 34, height: hovering ? 52 : 34, opacity: pressed ? 0.5 : 1, backgroundColor: hovering ? "rgba(201,161,92,0.08)" : "rgba(201,161,92,0)" }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      />
    </>
  );
}
