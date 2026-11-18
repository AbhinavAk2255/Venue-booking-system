import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useApp } from "../../lib/store";

export default function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[180] flex flex-col items-center gap-2 pointer-events-none w-full px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} layout
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto flex items-center gap-3 rounded-full border border-cream/10 bg-coal/90 backdrop-blur-md pl-3.5 pr-6 py-3 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.8)]"
          >
            {t.kind === "success" && <CheckCircle2 className="size-4 text-gold" />}
            {t.kind === "info"    && <Info          className="size-4 text-champagne" />}
            {t.kind === "error"   && <XCircle       className="size-4 text-wine" />}
            <span className="text-sm text-cream/90 whitespace-nowrap overflow-hidden text-ellipsis max-w-[80vw]">{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
