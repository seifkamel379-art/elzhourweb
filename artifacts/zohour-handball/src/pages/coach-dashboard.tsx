import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, FirestoreError } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { Users, ChevronDown, ChevronUp, UserCircle2, Activity, Dumbbell, Brain } from "lucide-react";
import { toast } from "sonner";
import { Chat } from "@/components/chat";
import { setActiveChatPath, useNotifications } from "@/lib/notifications";

export default function CoachDashboard() {
  const { user, profile } = useAuth();
  const { notify } = useNotifications();
  
  const [players, setPlayers] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"players" | "evaluations" | "chat">("players");
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  
  // Evaluation State
  const [expandedEval, setExpandedEval] = useState<string | null>(null);
  const [evalForms, setEvalForms] = useState<Record<string, any>>({});
  const [evalSaving, setEvalSaving] = useState<string | null>(null);

  // Chat State
  const [chatType, setChatType] = useState<"team" | string>("team");
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  useEffect(() => {
    const unsubPlayers = onSnapshot(collection(db, "players"), (snap) => {
      setPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err: FirestoreError) => {
      console.warn("Players listener error:", err.code);
    });

    const unsubRatings = onSnapshot(collection(db, "ratings"), (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
      setRatings(data);
    }, (err: FirestoreError) => {
      console.warn("Ratings listener error:", err.code);
    });

    return () => {
      unsubPlayers();
      unsubRatings();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    let path = "chats/team/messages";
    if (chatType !== "team") {
      path = `chats/coach_${user.uid}_player_${chatType}/messages`;
    }

    setActiveChatPath(path);

    const unsubChat = onSnapshot(query(collection(db, path), orderBy("createdAt", "asc")), (snap) => {
      setChatMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      snap.docChanges().forEach((change) => {
        if (change.type === "added") {
          const m = change.doc.data();
          if (m.senderId !== user.uid && m.createdAt && Date.now() - m.createdAt.toMillis() < 10000) {
            notify(`رسالة جديدة من ${m.senderName}`, {
              body: m.text,
              chatPath: path
            });
          }
        }
      });
    }, (err: FirestoreError) => {
      console.warn("Chat listener error:", err.code);
    });
    return () => {
      unsubChat();
      setActiveChatPath(null);
    };
  }, [chatType, user, notify]);

  const getPlayerRatings = (playerId: string) => ratings.filter(r => r.playerId === playerId);
  const getPlayerAverages = (playerId: string) => {
    const pr = getPlayerRatings(playerId);
    if (pr.length === 0) return { p: 0, s: 0, g: 0, t: 0 };
    const p = Math.round(pr.reduce((a, b) => a + b.physical, 0) / pr.length);
    const s = Math.round(pr.reduce((a, b) => a + b.skill, 0) / pr.length);
    const g = Math.round(pr.reduce((a, b) => a + b.general, 0) / pr.length);
    return { p, s, g, t: Math.round((p + s + g) / 3) };
  };

  const getInitialAvatar = (name: string) => name ? name.charAt(0) : "؟";

  const handleEvalChange = (playerId: string, field: string, value: any) => {
    setEvalForms(prev => ({
      ...prev,
      [playerId]: { ...prev[playerId], [field]: value }
    }));
  };

  const initEvalForm = (playerId: string) => {
    if (!evalForms[playerId]) {
      setEvalForms(prev => ({
        ...prev,
        [playerId]: {
          physical: 0, skill: 0, general: 0, notes: "",
          d: format(new Date(), "dd"),
          m: format(new Date(), "MM"),
          y: format(new Date(), "yyyy")
        }
      }));
    }
  };

  const toggleEval = (playerId: string) => {
    if (expandedEval === playerId) {
      setExpandedEval(null);
    } else {
      initEvalForm(playerId);
      setExpandedEval(playerId);
    }
  };

  const submitEval = async (playerId: string, playerName: string) => {
    if (!user) return;
    const data = evalForms[playerId];
    if (!data) return;
    
    if (!data.physical || !data.skill || !data.general) {
      toast.error("الرجاء استكمال جميع التقييمات");
      return;
    }

    setEvalSaving(playerId);
    try {
      const pad = (n: string) => n.padStart(2, '0');
      const date = `${data.y}-${pad(data.m)}-${pad(data.d)}`;

      await addDoc(collection(db, "ratings"), {
        playerId,
        playerName,
        coachId: user.uid,
        coachName: profile?.name || "المدرب",
        date,
        physical: data.physical,
        skill: data.skill,
        general: data.general,
        notes: data.notes || "",
        createdAt: serverTimestamp()
      });
      
      toast.success("تم حفظ التقييم بنجاح");
      setExpandedEval(null);
    } catch (error: any) {
      toast.error("خطأ", { description: error.message });
    } finally {
      setEvalSaving(null);
    }
  };

  const sendMessage = async (text: string) => {
    if (!user) return;
    const path = chatType === "team" ? "chats/team/messages" : `chats/coach_${user.uid}_player_${chatType}/messages`;
    await addDoc(collection(db, path), {
      senderId: user.uid,
      senderName: profile?.name || "المدرب",
      senderRole: "coach",
      text,
      createdAt: serverTimestamp(),
    });
  };

  const ScoreGrid = ({ value, onChange, colorClass }: { value: number, onChange: (v: number) => void, colorClass: string }) => (
    <div className="flex gap-1 flex-wrap" dir="ltr">
      {[1,2,3,4,5,6,7,8,9,10].map(num => (
        <button
          key={num}
          onClick={() => onChange(num)}
          className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-all ${value === num ? colorClass + ' text-white scale-110 shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
        >
          {num}
        </button>
      ))}
    </div>
  );

  return (
    <Layout>
      <div className="flex bg-muted/50 p-1 rounded-2xl mb-6 relative">
        {[
          { id: "players", label: "اللاعبون" },
          { id: "evaluations", label: "التقييم" },
          { id: "chat", label: "التواصل" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl relative z-10 transition-colors ${activeTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="coach-tab-bg" className="absolute inset-0 bg-background rounded-xl shadow-sm -z-10" />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* PLAYERS TAB */}
        {activeTab === "players" && (
          <motion.div key="players" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map((player, i) => {
              const avg = getPlayerAverages(player.id);
              return (
                <Card key={player.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-card" onClick={() => setSelectedPlayer(player)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-lg font-bold">
                        {getInitialAvatar(player.firstName)}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground">{player.firstName} {player.lastName}</h3>
                        <div className="text-[10px] text-muted-foreground" dir="ltr">{player.phone}</div>
                      </div>
                    </div>
                    <div className="bg-muted p-2 rounded-lg flex justify-between items-center mt-2">
                      <span className="text-xs font-semibold text-muted-foreground">المتوسط العام</span>
                      <div className="font-bold text-primary text-sm bg-background px-2 py-0.5 rounded shadow-sm">
                        {avg.t}<span className="text-[10px] text-muted-foreground ml-0.5">/10</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        )}

        {/* EVALUATIONS TAB */}
        {activeTab === "evaluations" && (
          <motion.div key="evaluations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
            {players.map((player) => {
              const isExpanded = expandedEval === player.id;
              const avg = getPlayerAverages(player.id);
              const formData = evalForms[player.id] || {};
              
              return (
                <div key={player.id} className={`bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm transition-colors ${isExpanded ? 'ring-1 ring-primary/20' : ''}`}>
                  <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => toggleEval(player.id)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {getInitialAvatar(player.firstName)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-foreground">{player.firstName} {player.lastName}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">متوسط: {avg.t}/10</div>
                      </div>
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center bg-muted rounded-full text-muted-foreground">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="p-4 pt-0 border-t border-border/50 bg-card/50">
                          <div className="mt-4 space-y-5">
                            
                            <div className="space-y-2">
                              <Label className="text-xs font-bold flex items-center gap-1.5 text-primary"><Activity className="w-3.5 h-3.5"/> التقييم البدني</Label>
                              <ScoreGrid value={formData.physical} onChange={(v) => handleEvalChange(player.id, "physical", v)} colorClass="bg-primary" />
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-xs font-bold flex items-center gap-1.5 text-accent"><Dumbbell className="w-3.5 h-3.5"/> التقييم المهاري</Label>
                              <ScoreGrid value={formData.skill} onChange={(v) => handleEvalChange(player.id, "skill", v)} colorClass="bg-accent" />
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-xs font-bold flex items-center gap-1.5 text-secondary"><Brain className="w-3.5 h-3.5"/> التقييم العام</Label>
                              <ScoreGrid value={formData.general} onChange={(v) => handleEvalChange(player.id, "general", v)} colorClass="bg-secondary" />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                              <div className="space-y-1.5">
                                <Label className="text-xs font-bold">تاريخ التقييم</Label>
                                <div className="grid grid-cols-3 gap-2">
                                  <Input type="number" placeholder="اليوم" value={formData.d} onChange={e => handleEvalChange(player.id, "d", e.target.value)} className="h-9 text-xs text-center bg-muted/50" />
                                  <Input type="number" placeholder="الشهر" value={formData.m} onChange={e => handleEvalChange(player.id, "m", e.target.value)} className="h-9 text-xs text-center bg-muted/50" />
                                  <Input type="number" placeholder="السنة" value={formData.y} onChange={e => handleEvalChange(player.id, "y", e.target.value)} className="h-9 text-xs text-center bg-muted/50" />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-bold">ملاحظات المدرب</Label>
                                <Textarea placeholder="ملاحظات..." value={formData.notes} onChange={e => handleEvalChange(player.id, "notes", e.target.value)} className="h-20 resize-none text-xs bg-muted/50" />
                              </div>
                            </div>

                            <Button onClick={() => submitEval(player.id, player.fullName)} className="w-full bg-primary hover:bg-primary/90 h-10 rounded-xl text-sm font-bold" disabled={evalSaving === player.id}>
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

        {/* CHAT TAB */}
        {activeTab === "chat" && (
          <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-[600px] flex flex-col md:flex-row gap-4">
            
            {/* Sidebar List */}
            <div className="w-full md:w-64 flex flex-col gap-2 shrink-0 md:h-full overflow-y-auto pb-2 md:pb-0 scrollbar-none snap-x md:snap-none">
              <button 
                onClick={() => setChatType("team")}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all text-right shrink-0 snap-start w-64 md:w-full border ${chatType === "team" ? "bg-primary text-primary-foreground border-transparent shadow-md" : "bg-card border-border hover:bg-muted text-foreground"}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${chatType === "team" ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">شات الفريق العام</div>
                </div>
              </button>
              
              <div className="text-[10px] font-bold text-muted-foreground px-2 pt-2 hidden md:block">محادثات اللاعبين</div>
              
              {players.map(p => (
                <button 
                  key={p.id}
                  onClick={() => setChatType(p.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all text-right shrink-0 snap-start w-64 md:w-full border ${chatType === p.id ? "bg-accent text-accent-foreground border-transparent shadow-md" : "bg-card border-border hover:bg-muted text-foreground"}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${chatType === p.id ? "bg-white/20 text-white" : "bg-accent/10 text-accent"}`}>
                    {getInitialAvatar(p.firstName)}
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-sm truncate">{p.firstName} {p.lastName}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Chat Area */}
            <div className="flex-1 min-h-0 bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
              <div className="p-3 md:p-4 border-b border-border bg-muted/30">
                <h3 className="font-bold text-sm text-foreground">
                  {chatType === "team" ? "شات الفريق العام" : players.find(p => p.id === chatType)?.fullName}
                </h3>
              </div>
              <div className="flex-1 min-h-0">
                <Chat messages={chatMessages} currentUserId={user?.uid || ""} onSendMessage={sendMessage} />
              </div>
            </div>
            
          </motion.div>
        )}
      </AnimatePresence>

      {/* PLAYER MODAL FOR PREVIOUS EVALS */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedPlayer(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl border border-border overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border/50 flex items-center gap-4 bg-muted/30">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                {getInitialAvatar(selectedPlayer.firstName)}
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{selectedPlayer.fullName}</h2>
                <div className="text-xs text-muted-foreground mt-1">تاريخ الميلاد: {selectedPlayer.dob} • هاتف: <span dir="ltr">{selectedPlayer.phone}</span></div>
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
                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Line type="monotone" dataKey="physical" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="بدني" />
                        <Line type="monotone" dataKey="skill" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} name="مهاري" />
                        <Line type="monotone" dataKey="general" stroke="hsl(var(--secondary))" strokeWidth={2} dot={{ r: 3 }} name="عام" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-foreground">سجل التقييمات</h3>
                    {getPlayerRatings(selectedPlayer.id).slice().reverse().map(r => (
                      <div key={r.id} className="bg-muted/30 p-3 rounded-xl border border-border/50 text-sm flex justify-between items-start gap-4">
                        <div>
                          <div className="font-bold text-xs text-muted-foreground">{format(new Date(r.date), "yyyy/MM/dd")}</div>
                          {r.notes && <div className="mt-1 text-xs">{r.notes}</div>}
                        </div>
                        <div className="flex gap-2 text-center bg-background p-1.5 rounded-lg shrink-0 border border-border/50">
                          <div className="px-1"><div className="text-[9px] text-muted-foreground">بدني</div><div className="font-bold text-primary">{r.physical}</div></div>
                          <div className="px-1"><div className="text-[9px] text-muted-foreground">مهاري</div><div className="font-bold text-accent">{r.skill}</div></div>
                          <div className="px-1"><div className="text-[9px] text-muted-foreground">عام</div><div className="font-bold text-secondary">{r.general}</div></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground text-sm py-10">لا توجد تقييمات مسجلة لهذا اللاعب</div>
              )}
            </div>
            <div className="p-4 border-t border-border/50 bg-muted/30 text-left">
              <Button onClick={() => setSelectedPlayer(null)} variant="outline" className="text-xs h-9 rounded-lg font-bold">إغلاق</Button>
            </div>
          </motion.div>
        </div>
      )}
    </Layout>
  );
}
