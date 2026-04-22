import { useEffect } from "react";
import { motion } from "framer-motion";

interface IntroAnimationProps {
  onComplete: () => void;
}

export default function IntroAnimation({ onComplete }: IntroAnimationProps) {
  useEffect(() => {
    const t = setTimeout(onComplete, 1800);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        {/* Soft pulsing halo */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(251,191,36,0.35), transparent 70%)",
          }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />

        <div
          className="relative rounded-full overflow-hidden"
          style={{
            width: 140,
            height: 140,
            boxShadow:
              "0 0 0 3px rgba(251,191,36,0.6), 0 10px 30px rgba(0,0,0,0.4)",
          }}
        >
          <img
            src="/logo.jpg"
            alt="مركز شباب الزهور"
            className="w-full h-full object-cover"
          />
        </div>
      </motion.div>

      <motion.div
        className="mt-6 text-center px-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h1
          className="text-lg font-extrabold text-foreground"
          style={{ fontFamily: "Cairo, sans-serif" }}
        >
          مركز شباب الزهور ببورسعيد
        </h1>
        <p
          className="text-xs mt-1 font-semibold"
          style={{ fontFamily: "Cairo, sans-serif", color: "#fbbf24" }}
        >
          فريق كرة اليد · مواليد 2010
        </p>
      </motion.div>
    </motion.div>
  );
}
