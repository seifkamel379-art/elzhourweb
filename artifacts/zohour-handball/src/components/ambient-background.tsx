import { motion } from "framer-motion";
import { useMemo } from "react";

export function AmbientBackground() {
  const particles = useMemo(
    () =>
      Array.from({ length: 28 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 2,
        delay: Math.random() * 6,
        duration: 10 + Math.random() * 12,
        opacity: 0.15 + Math.random() * 0.35,
      })),
    [],
  );

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Slow drifting gradient blobs */}
      <motion.div
        className="absolute -inset-[15%]"
        style={{
          background:
            "radial-gradient(circle at 22% 28%, rgba(59,130,246,0.18) 0%, transparent 38%), radial-gradient(circle at 78% 72%, rgba(251,191,36,0.10) 0%, transparent 42%), radial-gradient(circle at 50% 90%, rgba(14,165,233,0.10) 0%, transparent 50%)",
          filter: "blur(40px)",
        }}
        animate={{
          rotate: [0, 360],
          scale: [1, 1.08, 1],
        }}
        transition={{
          rotate: { duration: 90, repeat: Infinity, ease: "linear" },
          scale: { duration: 18, repeat: Infinity, ease: "easeInOut" },
        }}
      />

      {/* Floating dust */}
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            background: "currentColor",
            color: "rgba(251,191,36,0.6)",
            boxShadow: "0 0 6px currentColor",
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [p.opacity, p.opacity * 1.6, p.opacity],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Faint vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.35) 100%)",
        }}
      />
    </div>
  );
}
