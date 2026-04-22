import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { Activity, Dumbbell, Brain, MessageSquare, Users, UserCircle2 } from "lucide-react";
import { format } from "date-fns";
import { Chat } from "@/components/chat";
import { setActiveChatPath, useNotifications } from "@/lib/notifications";

export default function PlayerDashboard() {
  const { user, playerData } = useAuth();
  const { notify } = useNotifications();
  const [ratings, setRatings] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<"ratings" | "chat">("ratings");
  const [chatType, setChatType] = useState<"team" | "coaches" | string>("team");
  
  const [messages, setMessages] = useState<any[]>([]);

  // Fetch ratings
  useEffect(() => {
    if (!user) return;
    const qRatings = query(collection(db, "ratings"), where("playerId", "==", user.uid), orderBy("date", "asc"));
    const unsubRatings = onSnapshot(qRatings, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRatings(data);
      // Notify if new rating comes in (hacky way: checking if latest is recent, but in reality we'd compare lengths)
      // Leaving out the complex logic for new rating notification to keep it simple, 
      // but ideally we check if a doc was ADDED.
      snap.docChanges().forEach((change) => {
        if (change.type === "added") {
          const r = change.doc.data();
          // if within last 10 seconds to avoid old ones
          if (r.createdAt && Date.now() - r.createdAt.toMillis() < 10000) {
            notify(`تم إضافة تقييم جديد من المدرب ${r.coachName || "المدرب"}`);
          }
        }
      });
    });
    return () => unsubRatings();
  }, [user, notify]);

  // Fetch Coaches
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "coaches"), (snap) => {
      setCoaches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Fetch active chat messages
  useEffect(() => {
    if (!user) return;
    let path = "chats/team/messages";
    if (chatType !== "team" && chatType !== "coaches") {
      path = `chats/coach_${chatType}_player_${user.uid}/messages`;
    } else if (chatType === "coaches") {
      // Not a real chat path, just a list
      return;
    }

    setActiveChatPath(path);

    const q = query(collection(db, path), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(data);
      
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
    });

    return () => {
      unsub();
      setActiveChatPath(null);
    };
  }, [user, chatType, notify]);

  const latestRating = ratings.length > 0 ? ratings[ratings.length - 1] : null;

  const sendMessage = async (text: string) => {
    if (!user || !playerData) return;
    const path = chatType === "team" ? "chats/team/messages" : `chats/coach_${chatType}_player_${user.uid}/messages`;
    await addDoc(collection(db, path), {
      senderId: user.uid,
      senderName: playerData.firstName,
      senderRole: "player",
      text,
      createdAt: serverTimestamp(),
    });
  };

  const getInitialAvatar = (name: string) => name ? name.charAt(0) : "؟";

  return (
    <Layout>
      {/* Custom Tabs */}
      <div className="flex bg-muted/50 p-1 rounded-2xl mb-6 relative">
        {["ratings", "chat"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl relative z-10 transition-colors ${activeTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab === "ratings" ? "التقييمات" : "التواصل"}
            {activeTab === tab && (
              <motion.div layoutId="player-tab-bg" className="absolute inset-0 bg-background rounded-xl shadow-sm -z-10" />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "ratings" && (
          <motion.div key="ratings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <Card className="border-0 shadow-sm bg-card overflow-hidden">
                <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs md:text-sm text-muted-foreground font-semibold">بدني</CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-2xl md:text-3xl font-bold">{latestRating?.physical || 0}<span className="text-sm text-muted-foreground/50">/10</span></div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-card overflow-hidden">
                <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs md:text-sm text-muted-foreground font-semibold">مهاري</CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Dumbbell className="w-4 h-4 text-accent" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-2xl md:text-3xl font-bold">{latestRating?.skill || 0}<span className="text-sm text-muted-foreground/50">/10</span></div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-card overflow-hidden">
                <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs md:text-sm text-muted-foreground font-semibold">عام</CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-secondary" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-2xl md:text-3xl font-bold">{latestRating?.general || 0}<span className="text-sm text-muted-foreground/50">/10</span></div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-sm bg-card">
              <CardHeader className="p-4 border-b border-border/50">
                <CardTitle className="text-sm font-bold">التطور عبر الزمن</CardTitle>
              </CardHeader>
              <CardContent className="p-4 h-[250px] md:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ratings} margin={{ top: 5, right: 0, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="date" tickFormatter={(val) => format(new Date(val), "MM/dd")} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} dy={10} />
                    <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} dx={-10} width={20} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="physical" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="بدني" />
                    <Line type="monotone" dataKey="skill" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} name="مهاري" />
                    <Line type="monotone" dataKey="general" stroke="hsl(var(--secondary))" strokeWidth={2} dot={{ r: 3 }} name="عام" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground px-1">سجل التقييمات</h3>
              {ratings.slice().reverse().map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="bg-card p-4 rounded-2xl shadow-sm border border-border/50 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-bold bg-muted text-muted-foreground inline-flex px-2 py-1 rounded-md mb-1">{format(new Date(r.date), "yyyy/MM/dd")}</div>
                      {r.coachName && <div className="text-[10px] text-muted-foreground mt-1">قيّمك المدرب: {r.coachName}</div>}
                    </div>
                    <div className="flex gap-3 text-center bg-muted/30 p-2 rounded-xl">
                      <div><div className="text-[10px] text-muted-foreground">بدني</div><div className="font-bold text-primary text-sm">{r.physical}</div></div>
                      <div><div className="text-[10px] text-muted-foreground">مهاري</div><div className="font-bold text-accent text-sm">{r.skill}</div></div>
                      <div><div className="text-[10px] text-muted-foreground">عام</div><div className="font-bold text-secondary text-sm">{r.general}</div></div>
                    </div>
                  </div>
                  {r.notes && <div className="text-xs text-foreground bg-muted/50 p-3 rounded-xl leading-relaxed">{r.notes}</div>}
                </motion.div>
              ))}
              {ratings.length === 0 && <div className="text-center text-muted-foreground text-xs py-10 bg-card rounded-2xl border border-border/50">لا توجد تقييمات بعد</div>}
            </div>
          </motion.div>
        )}

        {activeTab === "chat" && (
          <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-[600px] flex flex-col">
            
            {/* Chat Selection Header */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
              <button 
                onClick={() => setChatType("team")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-colors ${chatType === "team" ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:bg-muted"}`}
              >
                <Users className="w-4 h-4" />
                شات الفريق
              </button>
              
              {coaches.map(c => (
                <button 
                  key={c.id}
                  onClick={() => setChatType(c.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-colors ${chatType === c.id ? "bg-accent text-accent-foreground" : "bg-card border border-border hover:bg-muted"}`}
                >
                  <UserCircle2 className="w-4 h-4" />
                  {c.name || "المدرب"}
                </button>
              ))}
            </div>

            <div className="flex-1 min-h-0">
              <Chat messages={messages} currentUserId={user?.uid || ""} onSendMessage={sendMessage} />
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
