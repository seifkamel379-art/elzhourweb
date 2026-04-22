import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface IntroAnimationProps {
  onComplete: () => void;
}

export default function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [phase, setPhase] = useState<"build" | "burst" | "logo" | "outro">(
    "build",
  );

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("burst"), 1700);
    const t2 = setTimeout(() => setPhase("logo"), 2150);
    const t3 = setTimeout(() => setPhase("outro"), 5300);
    const t4 = setTimeout(() => onComplete(), 5900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  // Pre-compute particle positions once
  const sparks = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        angle: (i / 36) * Math.PI * 2,
        dist: 180 + Math.random() * 220,
        size: 2 + Math.random() * 4,
        delay: Math.random() * 0.15,
        hue: i % 3 === 0 ? "#fbbf24" : i % 3 === 1 ? "#60a5fa" : "#ffffff",
      })),
    [],
  );

  const orbitRings = [
    { size: 140, duration: 14, dir: 1, opacity: 0.5, dash: "2 8" },
    { size: 200, duration: 22, dir: -1, opacity: 0.35, dash: "1 12" },
    { size: 280, duration: 32, dir: 1, opacity: 0.25, dash: "3 18" },
  ];

  const dustParticles = useMemo(
    () =>
      Array.from({ length: 50 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 2.5,
        delay: Math.random() * 4,
        duration: 8 + Math.random() * 8,
        opacity: 0.15 + Math.random() * 0.45,
      })),
    [],
  );

  return (
    <motion.div
      className="fixed inset-0 z-[100] overflow-hidden flex items-center justify-center"
      style={{
        background:
          "radial-gradient(ellipse at center, #102a52 0%, #061229 55%, #02060f 100%)",
      }}
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === "outro" ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* ====== ANIMATED BACKGROUND LAYERS ====== */}

      {/* Slowly drifting nebula blobs */}
      <motion.div
        className="absolute -inset-[20%] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 25% 30%, rgba(59,130,246,0.35) 0%, transparent 40%), radial-gradient(circle at 75% 70%, rgba(251,191,36,0.22) 0%, transparent 45%), radial-gradient(circle at 50% 50%, rgba(14,165,233,0.18) 0%, transparent 50%)",
          filter: "blur(40px)",
        }}
        animate={{
          rotate: [0, 360],
          scale: [1, 1.15, 1],
        }}
        transition={{
          rotate: { duration: 60, repeat: Infinity, ease: "linear" },
          scale: { duration: 12, repeat: Infinity, ease: "easeInOut" },
        }}
      />

      {/* Stadium light cones (top) */}
      <motion.div
        className="absolute top-0 left-1/4 w-[60vw] h-[80vh] pointer-events-none"
        style={{
          background:
            "conic-gradient(from 200deg at 50% 0%, transparent 0deg, rgba(251,191,36,0.18) 12deg, transparent 24deg)",
          transformOrigin: "50% 0%",
        }}
        animate={{ rotate: [-8, 8, -8] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-0 right-1/4 w-[60vw] h-[80vh] pointer-events-none"
        style={{
          background:
            "conic-gradient(from 160deg at 50% 0%, transparent 0deg, rgba(96,165,250,0.18) 12deg, transparent 24deg)",
          transformOrigin: "50% 0%",
        }}
        animate={{ rotate: [8, -8, 8] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating dust particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {dustParticles.map((p, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              background: "white",
              boxShadow: "0 0 4px rgba(255,255,255,0.8)",
              opacity: p.opacity,
            }}
            animate={{
              y: [0, -40, 0],
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
      </div>

      {/* Subtle grid floor for depth */}
      <div
        className="absolute inset-x-0 bottom-0 h-[50vh] pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(11, 29, 90, 0.55) 0%, transparent 100%)",
          maskImage:
            "linear-gradient(to top, black 0%, transparent 100%)",
        }}
      >
        <svg
          className="absolute inset-0 w-full h-full opacity-40"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <defs>
            <linearGradient id="lineFade" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Perspective horizontal lines */}
          {[...Array(10)].map((_, i) => {
            const y = 100 - i * 9 - i * i * 0.4;
            return (
              <line
                key={`h${i}`}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="url(#lineFade)"
                strokeWidth="0.15"
              />
            );
          })}
          {/* Perspective vertical lines converging to center */}
          {[...Array(13)].map((_, i) => {
            const x = i * (100 / 12);
            return (
              <line
                key={`v${i}`}
                x1={x}
                y1="100"
                x2="50"
                y2="40"
                stroke="url(#lineFade)"
                strokeWidth="0.15"
              />
            );
          })}
        </svg>
      </div>

      {/* ====== CENTRAL LOGO STAGE ====== */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Build phase: rotating energy rings */}
        <AnimatePresence>
          {phase === "build" && (
            <motion.div
              key="build"
              className="absolute inset-0 flex items-center justify-center"
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.4 }}
            >
              <svg
                width="500"
                height="500"
                viewBox="-250 -250 500 500"
                className="absolute"
              >
                {/* Forming circles */}
                <motion.circle
                  cx="0"
                  cy="0"
                  r="120"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  strokeDasharray="6 8"
                  initial={{ pathLength: 0, opacity: 0, rotate: -90 }}
                  animate={{ pathLength: 1, opacity: 1, rotate: 270 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
                <motion.circle
                  cx="0"
                  cy="0"
                  r="80"
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="1.5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.6 }}
                  transition={{ duration: 1.2, delay: 0.2 }}
                />
                {/* Cross-hair lines */}
                {[0, 60, 120, 180, 240, 300].map((deg) => (
                  <motion.line
                    key={deg}
                    x1="0"
                    y1="0"
                    x2={Math.cos((deg * Math.PI) / 180) * 200}
                    y2={Math.sin((deg * Math.PI) / 180) * 200}
                    stroke="#fbbf24"
                    strokeWidth="1"
                    strokeDasharray="2 6"
                    initial={{ opacity: 0, pathLength: 0 }}
                    animate={{ opacity: [0, 0.5, 0.2], pathLength: 1 }}
                    transition={{ duration: 1.2, delay: 0.1 + deg / 1800 }}
                  />
                ))}
                {/* Charging core glow */}
                <motion.circle
                  cx="0"
                  cy="0"
                  r="30"
                  fill="#fbbf24"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [0, 1.2, 1, 1.4],
                    opacity: [0, 0.9, 0.7, 1],
                  }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  style={{
                    filter: "blur(8px)",
                    transformOrigin: "0px 0px",
                  }}
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Burst: shock-wave + sparks + flash */}
        <AnimatePresence>
          {(phase === "burst" || phase === "logo") && (
            <>
              {/* White flash */}
              <motion.div
                key="flash"
                className="absolute inset-[-100vh] bg-white pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.85, 0] }}
                transition={{ duration: 0.5 }}
              />
              {/* Expanding shock-wave ring */}
              <motion.div
                key="shock"
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 60,
                  height: 60,
                  border: "3px solid #fbbf24",
                  boxShadow:
                    "0 0 40px rgba(251,191,36,0.8), inset 0 0 40px rgba(251,191,36,0.4)",
                }}
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: [0, 14, 22], opacity: [1, 0.5, 0] }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
              <motion.div
                key="shock2"
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 60,
                  height: 60,
                  border: "2px solid #60a5fa",
                }}
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: [0, 10, 18], opacity: [1, 0.4, 0] }}
                transition={{ duration: 1.0, ease: "easeOut", delay: 0.1 }}
              />
              {/* Sparks shooting outward */}
              {sparks.map((s, i) => (
                <motion.span
                  key={`spark${i}`}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: s.size,
                    height: s.size,
                    background: s.hue,
                    boxShadow: `0 0 ${s.size * 3}px ${s.hue}`,
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos(s.angle) * s.dist,
                    y: Math.sin(s.angle) * s.dist,
                    opacity: [1, 1, 0],
                    scale: [1, 1.2, 0],
                  }}
                  transition={{
                    duration: 1.1,
                    delay: s.delay,
                    ease: "easeOut",
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* LOGO REVEAL */}
        <AnimatePresence>
          {phase === "logo" && (
            <motion.div
              key="logo"
              className="relative flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
            >
              {/* Orbit rings around logo */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {orbitRings.map((r, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full border"
                    style={{
                      width: r.size,
                      height: r.size,
                      borderColor: "rgba(251,191,36,0.5)",
                      borderStyle: "dashed",
                      borderWidth: 1,
                      opacity: r.opacity,
                    }}
                    animate={{ rotate: 360 * r.dir }}
                    transition={{
                      duration: r.duration,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    {/* Tiny ball orbiting */}
                    <span
                      className="absolute rounded-full"
                      style={{
                        width: 6,
                        height: 6,
                        background: "#fbbf24",
                        boxShadow: "0 0 12px #fbbf24",
                        top: -3,
                        left: r.size / 2 - 3,
                      }}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Pulsing halos (heartbeat) */}
              {[0, 0.6, 1.2].map((delay, i) => (
                <motion.div
                  key={`pulse${i}`}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: "min(44vw, 260px)",
                    height: "min(44vw, 260px)",
                    border: "2px solid rgba(251,191,36,0.55)",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                  animate={{
                    scale: [1, 1.6],
                    opacity: [0.7, 0],
                  }}
                  transition={{
                    duration: 1.8,
                    delay,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
              ))}

              {/* Outer glow halo */}
              <div
                className="absolute"
                style={{
                  width: "min(60vw, 360px)",
                  height: "min(60vw, 360px)",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(251,191,36,0.45) 0%, rgba(59,130,246,0.25) 40%, transparent 70%)",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  filter: "blur(20px)",
                }}
              />

              {/* Light rays from behind logo */}
              <motion.div
                className="absolute pointer-events-none"
                style={{
                  width: "min(80vw, 600px)",
                  height: "min(80vw, 600px)",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  background:
                    "conic-gradient(from 0deg, transparent 0deg, rgba(251,191,36,0.18) 12deg, transparent 24deg, transparent 60deg, rgba(96,165,250,0.15) 72deg, transparent 84deg, transparent 120deg, rgba(251,191,36,0.18) 132deg, transparent 144deg, transparent 180deg, rgba(96,165,250,0.15) 192deg, transparent 204deg, transparent 240deg, rgba(251,191,36,0.18) 252deg, transparent 264deg, transparent 300deg, rgba(96,165,250,0.15) 312deg, transparent 324deg)",
                  borderRadius: "50%",
                }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 28,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              {/* Logo with 3D-ish entrance */}
              <motion.div
                initial={{ scale: 0.1, opacity: 0, rotateY: -120 }}
                animate={{
                  scale: [0.1, 1.2, 1, 1.04, 1],
                  opacity: 1,
                  rotateY: 0,
                }}
                transition={{
                  duration: 1.4,
                  ease: [0.16, 1, 0.3, 1],
                  times: [0, 0.4, 0.6, 0.8, 1],
                }}
                className="relative"
                style={{ perspective: 1000 }}
              >
                {/* Heartbeat scale on logo (subtle) */}
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1, 1.03, 1],
                  }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1.4,
                  }}
                  className="rounded-full overflow-hidden relative"
                  style={{
                    width: "min(42vw, 240px)",
                    height: "min(42vw, 240px)",
                    boxShadow: [
                      "0 0 0 4px rgba(251,191,36,0.7)",
                      "0 0 60px rgba(251,191,36,0.55)",
                      "0 0 120px rgba(59,130,246,0.45)",
                      "0 25px 50px rgba(0,0,0,0.6)",
                    ].join(", "),
                  }}
                >
                  <img
                    src="/logo.jpg"
                    alt="مركز شباب الزهور"
                    className="w-full h-full object-cover"
                  />
                  {/* Glossy sweep */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.45) 48%, transparent 65%)",
                    }}
                    initial={{ x: "-120%" }}
                    animate={{ x: "120%" }}
                    transition={{
                      duration: 1.4,
                      delay: 1.6,
                      ease: "easeInOut",
                    }}
                  />
                  {/* Inner ring overlay */}
                  <div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                      boxShadow: "inset 0 0 0 3px rgba(251,191,36,0.55)",
                    }}
                  />
                </motion.div>
              </motion.div>

              {/* Title */}
              <motion.div
                className="mt-10 text-center px-6 relative z-10"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                <motion.h1
                  className="text-2xl md:text-4xl font-extrabold text-white"
                  style={{
                    fontFamily: "Cairo, sans-serif",
                    textShadow:
                      "0 0 20px rgba(251,191,36,0.6), 0 4px 20px rgba(0,0,0,0.7)",
                    letterSpacing: "0.02em",
                  }}
                  animate={{
                    textShadow: [
                      "0 0 20px rgba(251,191,36,0.6), 0 4px 20px rgba(0,0,0,0.7)",
                      "0 0 35px rgba(251,191,36,0.9), 0 4px 20px rgba(0,0,0,0.7)",
                      "0 0 20px rgba(251,191,36,0.6), 0 4px 20px rgba(0,0,0,0.7)",
                    ],
                  }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1.5,
                  }}
                >
                  مركز شباب الزهور ببورسعيد
                </motion.h1>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.7, delay: 1.1 }}
                  className="h-[2px] mx-auto mt-3 mb-3"
                  style={{
                    width: 160,
                    background:
                      "linear-gradient(90deg, transparent, #fbbf24, transparent)",
                  }}
                />
                <p
                  className="text-base md:text-xl font-semibold"
                  style={{
                    fontFamily: "Cairo, sans-serif",
                    color: "#fbbf24",
                    letterSpacing: "0.08em",
                  }}
                >
                  فريق كرة اليد · مواليد 2010
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
