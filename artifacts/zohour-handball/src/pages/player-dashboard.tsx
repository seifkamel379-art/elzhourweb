import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  FirestoreError,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Activity,
  Dumbbell,
  Brain,
  Sparkles,
  BarChart3,
  CalendarCheck,
  List,
} from "lucide-react";
import { format } from "date-fns";
import { registerFcmForUser } from "@/lib/notifications";
import { BottomTabs } from "@/components/bottom-tabs";
import { UserAvatar } from "@/components/user-avatar";

const ARABIC_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function getArabicDay(dateStr: string) {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return ARABIC_DAYS[d.getDay()];
  } catch {
    return "";
  }
}

function formatDisplayDate(dateStr: string) {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

type ActiveTab = "ratings" | "attendance" | "list";

export default function PlayerDashboard() {
  const { user, playerData } = useAuth();
  const [ratings, setRatings] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);

  // All attendance records grouped by session date
  const [attendanceByDate, setAttendanceByDate] = useState<Record<string, Record<string, string>>>({});
  // All sessions (unique dates from attendance)
  const [sessionDates, setSessionDates] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState<ActiveTab>("ratings");

  useEffect(() => {
    if (user) registerFcmForUser(user.uid, "player");
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const qRatings = query(
      collection(db, "ratings"),
      where("playerId", "==", user.uid),
    );
    const unsubRatings = onSnapshot(
      qRatings,
      (snap) => {
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as any)
          .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
        setRatings(data);
      },
      (err: FirestoreError) => console.warn("Ratings listener error:", err.code),
    );
    return () => unsubRatings();
  }, [user]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "coaches"),
      (snap) => setCoaches(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err: FirestoreError) => console.warn("Coaches listener error:", err.code),
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "players"),
      (snap) => setPlayers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err: FirestoreError) => console.warn("Players listener error:", err.code),
    );
    return () => unsub();
  }, []);

  // Listen to all attendance records
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "attendance"),
      (snap) => {
        const grouped: Record<string, Record<string, string>> = {};
        const dates = new Set<string>();
        snap.docs.forEach((d) => {
          const data = d.data();
          const date = data.sessionDate as string;
          if (!grouped[date]) grouped[date] = {};
          grouped[date][data.playerId] = data.status;
          dates.add(date);
        });
        setAttendanceByDate(grouped);
        setSessionDates(Array.from(dates).sort().reverse());
      },
      (err: FirestoreError) => console.warn("Attendance listener error:", err.code),
    );
    return () => unsub();
  }, []);

  const latestRating = ratings.length > 0 ? ratings[ratings.length - 1] : null;

  // Latest session date
  const latestSession = sessionDates[0] || null;
  const latestAttendance = latestSession ? attendanceByDate[latestSession] : null;

  return (
    <Layout withBottomTabs>
      {/* Profile Header */}
      <div className="bg-card border border-border rounded-3xl p-4 mb-4 flex items-center gap-3 shadow-sm">
        <UserAvatar photoURL={playerData?.photoURL} name={playerData?.firstName} size={56} ring />
        <div className="flex-1 min-w-0">
          <h2 className="font-extrabold text-base text-foreground truncate">{playerData?.fullName || "لاعب"}</h2>
          <p className="text-xs text-muted-foreground">مرحباً بك في لوحة التقييم</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── RATINGS TAB ── */}
        {activeTab === "ratings" && (
          <motion.div key="ratings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ScoreCard label="بدني" value={latestRating?.physical} icon={Activity} />
              <ScoreCard label="مهاري" value={latestRating?.skill} icon={Dumbbell} />
              <ScoreCard label="عقلي" value={latestRating?.mental} icon={Brain} />
              <ScoreCard label="عام" value={latestRating?.general} icon={Sparkles} />
            </div>

            <Card className="border border-border shadow-none bg-card">
              <CardHeader className="p-4 border-b border-border">
                <CardTitle className="text-sm font-extrabold">التطور عبر الزمن</CardTitle>
              </CardHeader>
              <CardContent className="p-3 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ratings} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="date" tickFormatter={(val) => format(new Date(val), "MM/dd")} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} dy={10} />
                    <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} dx={-10} width={20} />
                    <RechartsTooltip contentStyle={{ borderRadius: "10px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: "12px" }} />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }} iconType="circle" />
                    <Line type="monotone" dataKey="physical" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} name="بدني" />
                    <Line type="monotone" dataKey="skill" stroke="#1e88e5" strokeWidth={2.5} dot={{ r: 3 }} name="مهاري" />
                    <Line type="monotone" dataKey="mental" stroke="#7b1fa2" strokeWidth={3} dot={{ r: 4, fill: "#7b1fa2" }} activeDot={{ r: 6 }} name="عقلي" />
                    <Line type="monotone" dataKey="general" stroke="hsl(var(--muted-foreground))" strokeWidth={2.5} dot={{ r: 3 }} name="عام" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <h3 className="text-sm font-extrabold text-foreground px-1">سجل التقييمات</h3>
              {ratings.slice().reverse().map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card p-4 rounded-2xl border border-border flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="text-[11px] font-bold bg-muted text-muted-foreground inline-flex px-2 py-1 rounded-md mb-1">
                        {format(new Date(r.date), "yyyy/MM/dd")}
                      </div>
                      {r.coachName && (
                        <div className="text-[11px] text-muted-foreground mt-1">قيّمك المدرب: {r.coachName}</div>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center bg-muted/50 p-2 rounded-xl">
                      <ScorePill label="بدني" value={r.physical} />
                      <ScorePill label="مهاري" value={r.skill} />
                      <ScorePill label="عقلي" value={r.mental} />
                      <ScorePill label="عام" value={r.general} />
                    </div>
                  </div>
                  {r.notes && (
                    <div className="text-xs text-foreground bg-muted/40 p-3 rounded-xl leading-relaxed">{r.notes}</div>
                  )}
                </motion.div>
              ))}
              {ratings.length === 0 && (
                <div className="text-center text-muted-foreground text-xs py-10 bg-card rounded-2xl border border-border">لا توجد تقييمات بعد</div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── ATTENDANCE TAB ── */}
        {activeTab === "attendance" && (
          <motion.div key="attendance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            {sessionDates.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-12 bg-card rounded-2xl border border-border">لا يوجد سجل حضور بعد</div>
            ) : (
              sessionDates.map((date) => {
                const attendanceMap = attendanceByDate[date] || {};
                const presentCount = Object.values(attendanceMap).filter((s) => s === "present").length;
                const absentCount = Object.values(attendanceMap).filter((s) => s === "absent").length;
                return (
                  <div key={date} className="bg-card border border-border rounded-2xl overflow-hidden">
                    {/* Session header */}
                    <div className="bg-muted/30 px-4 py-3 border-b border-border">
                      <div className="font-extrabold text-sm text-foreground">
                        حضور وغياب يوم {getArabicDay(date)} الموافق {formatDisplayDate(date)}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {presentCount} حاضر · {absentCount} غائب
                      </div>
                    </div>
                    {/* Players list */}
                    <div className="p-3 space-y-1.5">
                      {players.map((player) => {
                        const status = attendanceMap[player.id];
                        return (
                          <div key={player.id} className="flex items-center gap-3 py-1.5 px-1">
                            <UserAvatar photoURL={player.photoURL} name={player.firstName} size={32} />
                            <div className="flex-1 font-semibold text-sm text-foreground truncate">
                              {player.firstName} {player.fatherName}
                            </div>
                            <div className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full shrink-0 ${status === "present" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : status === "absent" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-muted text-muted-foreground"}`}>
                              {status === "present" ? "حاضر" : status === "absent" ? "غائب" : "—"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </motion.div>
        )}

        {/* ── LIST TAB ── */}
        {activeTab === "list" && (
          <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
            <div>
              <h3 className="text-sm font-extrabold text-foreground mb-2.5 px-1 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">{coaches.length}</span>
                المدربون
              </h3>
              {coaches.length === 0 && <div className="text-center text-muted-foreground text-xs py-8 bg-card rounded-2xl border border-border">لا يوجد مدربون</div>}
              <div className="space-y-2">
                {coaches.map((coach) => (
                  <div key={coach.id} className="bg-card border border-border rounded-2xl p-3.5 flex items-center gap-3">
                    <UserAvatar photoURL={coach.photoURL} name={coach.name} size={44} />
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-sm text-foreground truncate">{coach.name || "المدرب"}</div>
                      <div className="text-[11px] text-muted-foreground">مدرب</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-foreground mb-2.5 px-1 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">{players.length}</span>
                اللاعبون
              </h3>
              {players.length === 0 && <div className="text-center text-muted-foreground text-xs py-8 bg-card rounded-2xl border border-border">لا يوجد لاعبون</div>}
              <div className="space-y-2">
                {players.map((player, idx) => (
                  <div key={player.id} className="bg-card border border-border rounded-2xl p-3.5 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-extrabold text-muted-foreground shrink-0">{idx + 1}</div>
                    <UserAvatar photoURL={player.photoURL} name={player.firstName} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-sm text-foreground truncate">{player.firstName} {player.fatherName}</div>
                      <div className="text-[11px] text-muted-foreground" dir="ltr">{player.phone}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomTabs
        active={activeTab}
        onChange={(id) => setActiveTab(id as ActiveTab)}
        tabs={[
          { id: "ratings", label: "التقييمات", icon: BarChart3 },
          { id: "attendance", label: "الحضور", icon: CalendarCheck },
          { id: "list", label: "القائمة", icon: List },
        ]}
      />
    </Layout>
  );
}

function ScoreCard({ label, value, icon: Icon }: { label: string; value?: number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card className="border border-border shadow-none bg-card">
      <CardHeader className="pb-2 pt-3 px-3 flex flex-row items-center justify-between">
        <CardTitle className="text-[11px] text-muted-foreground font-bold">{label}</CardTitle>
        <Icon className="w-4 h-4 text-primary" />
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div className="text-2xl font-extrabold">
          {value || 0}
          <span className="text-xs text-muted-foreground/60">/10</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ScorePill({ label, value }: { label: string; value?: number }) {
  return (
    <div className="px-1">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="font-extrabold text-primary text-sm">{value || 0}</div>
    </div>
  );
}
