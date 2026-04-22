import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface IntroAnimationProps {
  onComplete: () => void;
}

export default function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [phase, setPhase] = useState<"scene" | "flash" | "logo">("scene");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("flash"), 3200);
    const t2 = setTimeout(() => setPhase("logo"), 3450);
    const t3 = setTimeout(() => onComplete(), 6000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at center, #102a52 0%, #061229 60%, #02060f 100%)",
      }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Stadium light spots */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 20% 10%, rgba(255,200,80,0.2) 0%, transparent 35%), radial-gradient(circle at 80% 15%, rgba(120,180,255,0.18) 0%, transparent 35%)",
        }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Static SVG scene (court + goal) */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a1a3a" stopOpacity="0" />
            <stop offset="100%" stopColor="#0a1a3a" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Court floor */}
        <rect x="0" y="500" width="1200" height="300" fill="url(#floor)" />

        {/* 6m semicircle (goal area) */}
        <motion.path
          d="M 720 700 A 180 90 0 0 1 1080 700"
          stroke="#3b82f6"
          strokeWidth="2"
          fill="none"
          opacity="0.45"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        />

        {/* 9m dashed line */}
        <motion.path
          d="M 540 700 A 320 160 0 0 1 1180 700"
          stroke="#f59e0b"
          strokeWidth="3"
          strokeDasharray="14 10"
          fill="none"
          opacity="0.75"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, delay: 0.4 }}
        />

        {/* Goal frame */}
        <motion.g
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <rect x="980" y="380" width="8" height="320" fill="#ffffff" />
          <rect x="980" y="380" width="180" height="8" fill="#ffffff" />
          <rect x="1160" y="380" width="8" height="320" fill="#ffffff" />

          <g stroke="#cbd5e1" strokeWidth="1" opacity="0.55">
            {[...Array(10)].map((_, i) => (
              <line
                key={`v${i}`}
                x1={988 + i * 18}
                y1={388}
                x2={988 + i * 18}
                y2={700}
              />
            ))}
            {[...Array(11)].map((_, i) => (
              <line
                key={`h${i}`}
                x1={988}
                y1={388 + i * 30}
                x2={1160}
                y2={388 + i * 30}
              />
            ))}
          </g>

          {/* Net ripple on hit */}
          <motion.circle
            cx={1074}
            cy={520}
            r={20}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="3"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 4, 6], opacity: [0, 0.8, 0] }}
            transition={{ duration: 0.7, delay: 3.05 }}
            style={{ transformOrigin: "1074px 520px" }}
          />
          <motion.circle
            cx={1074}
            cy={520}
            r={12}
            fill="#fde68a"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 3, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 0.5, delay: 3.05 }}
            style={{ transformOrigin: "1074px 520px" }}
          />
        </motion.g>
      </svg>

      {/* Player — animated div (CSS transforms work reliably) */}
      <motion.div
        className="absolute"
        style={{
          left: "0%",
          top: "50%",
          width: 110,
          height: 200,
        }}
        initial={{ x: -150, y: 80 }}
        animate={{
          x: ["-15vw", "20vw", "45vw", "60vw", "60vw"],
          y: [80, 80, -60, -110, 80],
          rotate: [0, 0, -8, -12, 0],
        }}
        transition={{
          duration: 3,
          times: [0, 0.4, 0.7, 0.85, 1],
          ease: "easeOut",
        }}
      >
        <svg viewBox="0 0 110 200" className="w-full h-full">
          <defs>
            <linearGradient id="jersey2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="100%" stopColor="#0b1d5a" />
            </linearGradient>
            <linearGradient id="shorts2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>

          {/* Shadow on ground */}
          <ellipse cx="55" cy="195" rx="35" ry="5" fill="#000" opacity="0.4" />

          {/* Legs */}
          <line
            x1="48"
            y1="140"
            x2="38"
            y2="190"
            stroke="url(#jersey2)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <line
            x1="62"
            y1="140"
            x2="78"
            y2="185"
            stroke="url(#jersey2)"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Shorts */}
          <rect
            x="38"
            y="115"
            width="34"
            height="32"
            rx="5"
            fill="url(#shorts2)"
          />

          {/* Torso (jersey) */}
          <rect
            x="34"
            y="55"
            width="42"
            height="65"
            rx="7"
            fill="url(#jersey2)"
          />
          <text
            x="55"
            y="92"
            textAnchor="middle"
            fill="#fbbf24"
            fontSize="18"
            fontWeight="900"
            fontFamily="Cairo, sans-serif"
          >
            10
          </text>

          {/* Throwing arm raised */}
          <line
            x1="55"
            y1="65"
            x2="92"
            y2="30"
            stroke="url(#jersey2)"
            strokeWidth="9"
            strokeLinecap="round"
          />
          {/* Other arm */}
          <line
            x1="55"
            y1="65"
            x2="22"
            y2="100"
            stroke="url(#jersey2)"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Head */}
          <circle cx="55" cy="38" r="18" fill="#f3d3a8" />
          <path
            d="M 38 30 Q 55 18 72 30 L 70 26 Q 55 12 40 26 Z"
            fill="#1f2937"
          />
        </svg>
      </motion.div>

      {/* Ball — animated div with arc */}
      <motion.div
        className="absolute"
        style={{
          left: 0,
          top: "50%",
          width: 36,
          height: 36,
        }}
        initial={{ x: "-15vw", y: 100, opacity: 0 }}
        animate={{
          opacity: [0, 0, 1, 1, 0],
          x: ["-5vw", "30vw", "55vw", "85vw", "85vw"],
          y: [100, -20, -180, -100, -100],
          rotate: [0, 360, 720, 1080, 1080],
        }}
        transition={{
          duration: 3.1,
          times: [0, 0.55, 0.7, 0.97, 1],
          ease: "easeOut",
        }}
      >
        <svg viewBox="0 0 36 36" className="w-full h-full drop-shadow-[0_0_12px_rgba(251,191,36,0.7)]">
          <defs>
            <radialGradient id="ballGrad2" cx="0.35" cy="0.35" r="0.7">
              <stop offset="0%" stopColor="#ffe5a8" />
              <stop offset="40%" stopColor="#f7a93a" />
              <stop offset="100%" stopColor="#b76a0d" />
            </radialGradient>
          </defs>
          <circle cx="18" cy="18" r="16" fill="url(#ballGrad2)" />
          <path
            d="M 4 18 Q 18 10 32 18 Q 18 26 4 18"
            stroke="#7a3d0d"
            strokeWidth="1.5"
            fill="none"
          />
          <line
            x1="4"
            y1="18"
            x2="32"
            y2="18"
            stroke="#7a3d0d"
            strokeWidth="1.2"
          />
          <path
            d="M 18 2 Q 12 18 18 34"
            stroke="#7a3d0d"
            strokeWidth="1.2"
            fill="none"
          />
          <path
            d="M 18 2 Q 24 18 18 34"
            stroke="#7a3d0d"
            strokeWidth="1.2"
            fill="none"
          />
        </svg>
      </motion.div>

      {/* Flash on goal */}
      <AnimatePresence>
        {phase === "flash" && (
          <motion.div
            className="absolute inset-0 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.95, 0.5] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>

      {/* GOAL! text burst */}
      <AnimatePresence>
        {phase === "flash" && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: [0.6, 1.2, 1] }}
            exit={{ opacity: 0, scale: 1.4 }}
            transition={{ duration: 0.4 }}
          >
            <span
              className="text-6xl md:text-8xl font-black tracking-wider"
              style={{
                color: "#1e3a8a",
                textShadow:
                  "0 0 30px rgba(251,191,36,0.9), 0 0 60px rgba(251,191,36,0.6)",
                fontFamily: "Cairo, sans-serif",
              }}
            >
              GOAL!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logo reveal */}
      <AnimatePresence>
        {phase === "logo" && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Glow halo */}
            <motion.div
              className="absolute"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 2.5, 2], opacity: [0, 0.6, 0.4] }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              style={{
                width: 280,
                height: 280,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(251,191,36,0.5), rgba(251,191,36,0) 70%)",
              }}
            />

            <motion.div
              initial={{ scale: 0.2, opacity: 0, rotate: -30 }}
              animate={{ scale: [0.2, 1.15, 1], opacity: 1, rotate: 0 }}
              transition={{
                duration: 1.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative"
            >
              <div
                className="rounded-full overflow-hidden"
                style={{
                  width: "min(40vw, 240px)",
                  height: "min(40vw, 240px)",
                  boxShadow:
                    "0 0 60px rgba(251,191,36,0.55), 0 0 120px rgba(59,130,246,0.35), inset 0 0 0 4px rgba(251,191,36,0.6)",
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
              className="mt-8 text-center px-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
            >
              <h1
                className="text-2xl md:text-4xl font-extrabold text-white"
                style={{
                  fontFamily: "Cairo, sans-serif",
                  textShadow: "0 4px 20px rgba(0,0,0,0.5)",
                  letterSpacing: "0.02em",
                }}
              >
                مركز شباب الزهور ببورسعيد
              </h1>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 1 }}
                className="h-[2px] mx-auto mt-3 mb-3"
                style={{
                  width: 140,
                  background:
                    "linear-gradient(90deg, transparent, #fbbf24, transparent)",
                }}
              />
              <p
                className="text-base md:text-xl font-semibold"
                style={{
                  fontFamily: "Cairo, sans-serif",
                  color: "#fbbf24",
                  letterSpacing: "0.05em",
                }}
              >
                فريق كرة اليد · مواليد 2010
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
