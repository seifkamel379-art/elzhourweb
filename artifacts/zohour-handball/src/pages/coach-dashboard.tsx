import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  FirestoreError,
  doc,
  setDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { format } from "date-fns";
import {
  Users,
  ChevronDown,
  ChevronUp,
  Activity,
  Dumbbell,
  Brain,
  Sparkles,
  ClipboardList,
  CalendarCheck,
  List,
  Save,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { registerFcmForUser, broadcastPush } from "@/lib/notifications";
import { BottomTabs } from "@/components/bottom-tabs";
import { UserAvatar } from "@/components/user-avatar";

const ARABIC_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function todayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

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

type AttendanceStatus = "present" | "absent" | null;
type ActiveTab = "players" | "evaluations" | "attendance" | "list";

export default function CoachDashboard() {
  const { user, profile } = useAuth();

  const [players, setPlayers] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});

  const [activeTab, setActiveTab] = useState<ActiveTab>("players");
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);

  const [expandedEval, setExpandedEval] = useState<string | null>(null);
  const [evalForms, setEvalForms] = useState<Record<string, any>>({});
  const [evalSaving, setEvalSaving] = useState<string | null>(null);

  const [sessionDate, setSessionDate] = useState<string>(
    () => localStorage.getItem("zohour_session_date") || todayStr(),
  );
  const [editingDate, setEditingDate] = useState(false);
  const [tempDate, setTempDate] = useState(sessionDate);
  const [attendanceSaving, setAttendanceSaving] = useState<string | null>(null);

  useEffect(() => {
    if (user) registerFcmForUser(user.uid, "coach");
  }, [user]);

  useEffect(() => {
    const unsubPlayers = onSnapshot(
      collection(db, "players"),
      (snap) => setPlayers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err: FirestoreError) => console.warn("Players listener error:", err.code),
    );
    const unsubRatings = onSnapshot(
      collection(db, "ratings"),
      (snap) => {
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as any)
          .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
        setRatings(data);
      },
      (err: FirestoreError) => console.warn("Ratings listener error:", err.code),
    );
    const unsubCoaches = onSnapshot(
      collection(db, "coaches"),
      (snap) => setCoaches(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err: FirestoreError) => console.warn("Coaches listener error:", err.code),
    );
    return () => { unsubPlayers(); unsubRatings(); unsubCoaches(); };
  }, []);

  // Load attendance for current session date
  useEffect(() => {
    if (!sessionDate) return;
    const q = query(collection(db, "attendance"), where("sessionDate", "==", sessionDate));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const map: Record<string, AttendanceStatus> = {};
        snap.docs.forEach((d) => {
          const data = d.data();
          map[data.playerId] = data.status as AttendanceStatus;
        });
        setAttendance(map);
      },
      (err: FirestoreError) => console.warn("Attendance listener error:", err.code),
    );
    return () => unsub();
  }, [sessionDate]);

  const saveSessionDate = () => {
    if (!tempDate) return;
    setSessionDate(tempDate);
    localStorage.setItem("zohour_session_date", tempDate);
    setEditingDate(false);
    toast.success("تم حفظ تاريخ الجلسة");
  };

  const markAttendance = async (player: any, status: AttendanceStatus) => {
    if (!user) return;
    setAttendanceSaving(player.id);
    try {
      const docId = `${sessionDate}_${player.id}`;
      await setDoc(doc(db, "attendance", docId), {
        playerId: player.id,
        playerName: `${player.firstName} ${player.fatherName}`,
        sessionDate,
        status,
        coachId: user.uid,
        markedAt: serverTimestamp(),
      });
    } catch (e: any) {
      toast.error("خطأ في حفظ الحضور", { description: e.message });
    } finally {
      setAttendanceSaving(null);
    }
  };

  const getPlayerRatings = (playerId: string) =>
    ratings.filter((r) => r.playerId === playerId);

  const getPlayerAverages = (playerId: string) => {
    const pr = getPlayerRatings(playerId);
    if (pr.length === 0) return { p: 0, s: 0, m: 0, g: 0, t: 0 };
    const p = Math.round(pr.reduce((a, b) => a + (b.physical || 0), 0) / pr.length);
    const s = Math.round(pr.reduce((a, b) => a + (b.skill || 0), 0) / pr.length);
    const m = Math.round(pr.reduce((a, b) => a + (b.mental || 0), 0) / pr.length);
    const g = Math.round(pr.reduce((a, b) => a + (b.general || 0), 0) / pr.length);
    return { p, s, m, g, t: Math.round((p + s + m + g) / 4) };
  };

  const handleEvalChange = (playerId: string, field: string, value: any) => {
    setEvalForms((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], [field]: value },
    }));
  };

  const initEvalForm = (playerId: string) => {
    if (!evalForms[playerId]) {
      setEvalForms((prev) => ({
        ...prev,
        [playerId]: { physical: 0, skill: 0, mental: 0, general: 0, notes: "" },
      }));
    }
  };

  const toggleEval = (player: any) => {
    const isPresent = attendance[player.id] === "present";
    if (!isPresent) {
      toast.error("لا يمكن تقييم لاعب غائب", {
        description: "سجّل حضور اللاعب أولاً في تبويب الحضور",
      });
      return;
    }
    if (expandedEval === player.id) {
      setExpandedEval(null);
    } else {
      initEvalForm(player.id);
      setExpandedEval(player.id);
    }
  };

  const submitEval = async (playerId: string, playerName: string) => {
    if (!user) return;
    const data = evalForms[playerId];
    if (!data) return;

    if (!data.physical || !data.skill || !data.mental || !data.general) {
      toast.error("الرجاء استكمال جميع التقييمات");
      return;
    }

    setEvalSaving(playerId);
    try {
      await addDoc(collection(db, "ratings"), {
        playerId,
        playerName,
        coachId: user.uid,
        coachName: profile?.name || "المدرب",
        date: sessionDate,
        physical: data.physical,
        skill: data.skill,
        mental: data.mental,
        general: data.general,
        notes: data.notes || "",
        createdAt: serverTimestamp(),
      });

      broadcastPush({
        title: `تقييم جديد من ${profile?.name || "المدرب"}`,
        body: `حصلت على بدني ${data.physical}، مهاري ${data.skill}، عقلي ${data.mental}، عام ${data.general}`,
        recipients: [{ uid: playerId, role: "player" }],
        scope: "user",
      });

      toast.success("تم حفظ التقييم بنجاح");
      setExpandedEval(null);
    } catch (error: any) {
      toast.error("خطأ", { description: error.message });
    } finally {
      setEvalSaving(null);
    }
  };

  const ScoreGrid = ({
    value,
    onChange,
  }: {
    value: number;
    onChange: (v: number) => void;
  }) => (
    <div className="flex gap-1 flex-wrap" dir="ltr">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => onChange(num)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${value === num ? "bg-primary text-primary-foreground scale-110 shadow" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
        >
          {num}
        </button>
      ))}
    </div>
  );

  const DateEditBar = ({ editable = false }: { editable?: boolean }) => (
    <div className={`border rounded-2xl p-3.5 mb-4 ${editable ? "bg-primary/8 border-primary/20" : "bg-card border-border"}`}>
      <div className="text-[10px] text-primary font-extrabold mb-1">تاريخ الجلسة</div>
      {editingDate && editable ? (
        <div className="flex items-center gap-2 mt-1">
          <input
            type="date"
            value={tempDate}
            onChange={(e) => setTempDate(e.target.value)}
            className="flex-1 bg-background rounded-lg px-3 py-1.5 text-sm text-foreground border border-border outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button onClick={saveSessionDate} className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Save className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { setEditingDate(false); setTempDate(sessionDate); }} className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="font-extrabold text-sm text-foreground">
            يوم {getArabicDay(sessionDate)} الموافق {formatDisplayDate(sessionDate)}
          </div>
          {editable && (
            <button
              onClick={() => { setEditingDate(true); setTempDate(sessionDate); }}
              className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/70 transition-colors shrink-0"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Layout withBottomTabs>
      {/* Coach Header */}
      <div className="bg-card border border-border rounded-3xl p-4 mb-5 flex items-center gap-3 shadow-sm">
        <UserAvatar photoURL={profile?.photoURL} name={profile?.name} size={56} ring />
        <div className="flex-1 min-w-0">
          <h2 className="font-extrabold text-base text-foreground truncate">{profile?.name || "المدرب"}</h2>
          <p className="text-xs text-muted-foreground">{players.length} لاعب · {ratings.length} تقييم</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── PLAYERS TAB ── */}
        {activeTab === "players" && (
          <motion.div key="players" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {players.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground text-sm py-12 bg-card rounded-2xl border border-border">لا يوجد لاعبون مسجلون بعد</div>
            )}
            {players.map((player) => {
              const avg = getPlayerAverages(player.id);
              return (
                <Card key={player.id} className="border border-border shadow-none hover:border-primary/40 transition-colors cursor-pointer bg-card" onClick={() => setSelectedPlayer(player)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <UserAvatar photoURL={player.photoURL} name={player.firstName} size={48} />
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-sm text-foreground truncate">{player.firstName} {player.fatherName}</h3>
                        <div className="text-[10px] text-muted-foreground" dir="ltr">{player.phone}</div>
                      </div>
                    </div>
                    <div className="bg-muted/50 p-2.5 rounded-xl flex justify-between items-center">
                      <span className="text-xs font-bold text-muted-foreground">المتوسط العام</span>
                      <div className="font-extrabold text-primary text-sm bg-background px-2.5 py-0.5 rounded-md border border-border">
                        {avg.t}<span className="text-[10px] text-muted-foreground/60 ml-0.5">/10</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        )}

        {/* ── EVALUATIONS TAB ── */}
        {activeTab === "evaluations" && (
          <motion.div key="evaluations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-2.5">
            <DateEditBar editable />

            {players.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-12 bg-card rounded-2xl border border-border">لا يوجد لاعبون لتقييمهم</div>
            )}

            {players.map((player) => {
              const isExpanded = expandedEval === player.id;
              const avg = getPlayerAverages(player.id);
              const formData = evalForms[player.id] || {};
              const status = attendance[player.id];
              const isPresent = status === "present";
              const isAbsent = status === "absent";
              const noRecord = !status;

              return (
                <div
                  key={player.id}
                  className={`bg-card border rounded-2xl overflow-hidden transition-all ${isExpanded ? "border-primary" : "border-border"} ${isAbsent ? "opacity-55" : ""}`}
                >
                  <div
                    className="p-3 flex items-center justify-between cursor-pointer"
                    onClick={() => toggleEval(player)}
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar photoURL={player.photoURL} name={player.firstName} size={40} />
                      <div>
                        <div className="font-extrabold text-sm text-foreground">{player.firstName} {player.fatherName}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">متوسط: {avg.t}/10</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isPresent && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">حاضر</span>}
                      {isAbsent && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">غائب</span>}
                      {noRecord && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">غير محدد</span>}
                      {isPresent && (
                        <div className="w-8 h-8 flex items-center justify-center bg-muted rounded-full text-muted-foreground">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && isPresent && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="p-4 pt-0 border-t border-border bg-muted/20">
                          <div className="mt-4 space-y-5">
                            {[
                              { key: "physical", label: "التقييم البدني", Icon: Activity },
                              { key: "skill", label: "التقييم المهاري", Icon: Dumbbell },
                              { key: "mental", label: "التقييم العقلي", Icon: Brain },
                              { key: "general", label: "التقييم العام", Icon: Sparkles },
                            ].map(({ key, label, Icon }) => (
                              <div key={key} className="space-y-2">
                                <Label className="text-xs font-extrabold flex items-center gap-1.5 text-foreground">
                                  <Icon className="w-3.5 h-3.5" /> {label}
                                </Label>
                                <ScoreGrid
                                  value={formData[key] || 0}
                                  onChange={(v) => handleEvalChange(player.id, key, v)}
                                />
                              </div>
                            ))}
                            <div className="space-y-2">
                              <Label className="text-xs font-extrabold text-foreground">ملاحظات</Label>
                              <Textarea
                                placeholder="اكتب ملاحظاتك هنا..."
                                value={formData.notes || ""}
                                onChange={(e) => handleEvalChange(player.id, "notes", e.target.value)}
                                className="resize-none text-sm min-h-[80px] bg-background"
                                rows={3}
                              />
                            </div>
                            <Button
                              onClick={() => submitEval(player.id, `${player.firstName} ${player.fatherName}`)}
                              disabled={evalSaving === player.id}
                              className="w-full h-10 font-bold text-sm rounded-xl"
                            >
                              {evalSaving === player.id ? "جاري الحفظ..." : "حفظ التقييم"}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* ── ATTENDANCE TAB ── */}
        {activeTab === "attendance" && (
          <motion.div key="attendance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-2.5">
            {/* Session date header */}
            <div className="bg-primary/8 dark:bg-primary/10 border border-primary/25 rounded-2xl p-4 mb-2">
              <div className="text-[10px] text-primary font-extrabold mb-1">حضور وغياب</div>
              {editingDate ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="date"
                    value={tempDate}
                    onChange={(e) => setTempDate(e.target.value)}
                    className="flex-1 bg-background rounded-lg px-3 py-1.5 text-sm text-foreground border border-border outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button onClick={saveSessionDate} className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                    <Save className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { setEditingDate(false); setTempDate(sessionDate); }} className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-base text-foreground">
                    يوم {getArabicDay(sessionDate)} الموافق {formatDisplayDate(sessionDate)}
                  </div>
                  <button
                    onClick={() => { setEditingDate(true); setTempDate(sessionDate); }}
                    className="w-8 h-8 rounded-xl bg-background/50 dark:bg-muted flex items-center justify-center text-primary hover:opacity-80 transition-opacity"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="mt-2 text-[11px] text-muted-foreground">
                {Object.values(attendance).filter((s) => s === "present").length} حاضر ·{" "}
                {Object.values(attendance).filter((s) => s === "absent").length} غائب
              </div>
            </div>

            {players.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-12 bg-card rounded-2xl border border-border">لا يوجد لاعبون مسجلون بعد</div>
            )}

            {players.map((player) => {
              const status = attendance[player.id];
              const isLoading = attendanceSaving === player.id;
              return (
                <div
                  key={player.id}
                  className={`bg-card border rounded-2xl p-3.5 flex items-center gap-3 transition-all ${status === "present" ? "border-green-400/50 dark:border-green-600/40 bg-green-50/40 dark:bg-green-900/5" : status === "absent" ? "border-red-400/50 dark:border-red-600/40 bg-red-50/40 dark:bg-red-900/5" : "border-border"}`}
                >
                  <UserAvatar photoURL={player.photoURL} name={player.firstName} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-sm text-foreground truncate">{player.firstName} {player.fatherName}</div>
                    {status === "present" && <div className="text-[11px] font-bold text-green-600 dark:text-green-400 mt-0.5">✓ حاضر</div>}
                    {status === "absent" && <div className="text-[11px] font-bold text-red-600 dark:text-red-400 mt-0.5">✗ غائب</div>}
                    {!status && <div className="text-[11px] text-muted-foreground mt-0.5">لم يُسجَّل بعد</div>}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => markAttendance(player, "present")}
                      disabled={isLoading}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${status === "present" ? "bg-green-500 text-white shadow-sm" : "bg-muted text-muted-foreground hover:bg-green-100 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400"}`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      حاضر
                    </button>
                    <button
                      onClick={() => markAttendance(player, "absent")}
                      disabled={isLoading}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${status === "absent" ? "bg-red-500 text-white shadow-sm" : "bg-muted text-muted-foreground hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400"}`}
                    >
                      <X className="w-3.5 h-3.5" />
                      غائب
                    </button>
                  </div>
                </div>
              );
            })}
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

      {/* ── PLAYER MODAL ── */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedPlayer(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl border border-border overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center gap-4 bg-muted/30">
              <UserAvatar photoURL={selectedPlayer.photoURL} name={selectedPlayer.firstName} size={64} ring />
              <div>
                <h2 className="text-lg font-extrabold text-foreground">{selectedPlayer.fullName}</h2>
                <div className="text-xs text-muted-foreground mt-1">تاريخ الميلاد: {selectedPlayer.dob} · هاتف: <span dir="ltr">{selectedPlayer.phone}</span></div>
              </div>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-6">
              {getPlayerRatings(selectedPlayer.id).length > 0 ? (
                <>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getPlayerRatings(selectedPlayer.id)} margin={{ top: 5, right: 0, bottom: 0, left: 0 }}>
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
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-extrabold text-foreground">سجل التقييمات</h3>
                    {getPlayerRatings(selectedPlayer.id).slice().reverse().map((r) => (
                      <div key={r.id} className="bg-muted/30 p-3 rounded-xl border border-border text-sm flex justify-between items-start gap-4">
                        <div>
                          <div className="font-extrabold text-xs text-muted-foreground">{format(new Date(r.date), "yyyy/MM/dd")}</div>
                          {r.notes && <div className="mt-1 text-xs">{r.notes}</div>}
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center bg-background p-1.5 rounded-lg shrink-0 border border-border">
                          <div className="px-1"><div className="text-[9px] text-muted-foreground">بدني</div><div className="font-extrabold text-primary">{r.physical || 0}</div></div>
                          <div className="px-1"><div className="text-[9px] text-muted-foreground">مهاري</div><div className="font-extrabold text-primary">{r.skill || 0}</div></div>
                          <div className="px-1"><div className="text-[9px] text-muted-foreground">عقلي</div><div className="font-extrabold text-primary">{r.mental || 0}</div></div>
                          <div className="px-1"><div className="text-[9px] text-muted-foreground">عام</div><div className="font-extrabold text-primary">{r.general || 0}</div></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground text-sm py-10">لا توجد تقييمات مسجلة لهذا اللاعب</div>
              )}
            </div>
            <div className="p-4 border-t border-border bg-muted/30 text-left">
              <Button onClick={() => setSelectedPlayer(null)} variant="outline" className="text-xs h-9 rounded-lg font-bold">إغلاق</Button>
            </div>
          </motion.div>
        </div>
      )}

      <BottomTabs
        active={activeTab}
        onChange={(id) => setActiveTab(id as ActiveTab)}
        tabs={[
          { id: "players", label: "اللاعبون", icon: Users },
          { id: "evaluations", label: "التقييم", icon: ClipboardList },
          { id: "attendance", label: "الحضور", icon: CalendarCheck },
          { id: "list", label: "القائمة", icon: List },
        ]}
      />
    </Layout>
  );
}
