import { useEffect } from "react";
import { motion } from "framer-motion";

interface IntroAnimationProps {
  onComplete: () => void;
}

export default function IntroAnimation({ onComplete }: IntroAnimationProps) {
  useEffect(() => {
    const t = setTimeout(onComplete, 2400);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background ambient navy glow */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, hsl(216 65% 18% / 0.6), transparent 60%)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />

      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        {/* Outer pulsing navy halo */}
        <motion.div
          className="absolute -inset-16 rounded-full"
          style={{
            background:
              "radial-gradient(circle, hsl(216 80% 35% / 0.55), transparent 65%)",
          }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0.2, 0.7] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Inner navy glow */}
        <motion.div
          className="absolute -inset-6 rounded-full"
          style={{
            background:
              "radial-gradient(circle, hsl(216 90% 50% / 0.45), transparent 70%)",
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.9, 0.5, 0.9] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />

        <div
          className="relative rounded-full overflow-hidden"
          style={{
            width: 160,
            height: 160,
            boxShadow:
              "0 0 0 3px hsl(216 80% 50% / 0.7), 0 0 60px hsl(216 90% 45% / 0.6), 0 20px 50px rgba(0,0,0,0.5)",
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
        className="mt-10 text-center px-6 relative z-10"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <h1
          className="text-xl font-extrabold text-foreground tracking-tight"
          style={{ fontFamily: "Cairo, sans-serif" }}
        >
          مركز شباب الزهور ببورسعيد
        </h1>
        <p
          className="text-xs mt-2 font-bold text-primary/80"
          style={{ fontFamily: "Cairo, sans-serif" }}
        >
          فريق كرة اليد · مواليد 2010
        </p>
      </motion.div>
    </motion.div>
  );
}
