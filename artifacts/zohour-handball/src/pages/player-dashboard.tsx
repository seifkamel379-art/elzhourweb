import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { Activity, Dumbbell, Brain, Send } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function PlayerDashboard() {
  const { user, playerData } = useAuth();
  const [ratings, setRatings] = useState<any[]>([]);
  const [teamMessages, setTeamMessages] = useState<any[]>([]);
  const [privateMessages, setPrivateMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeChat, setActiveChat] = useState("team");

  useEffect(() => {
    if (!user) return;

    const qRatings = query(
      collection(db, "ratings"),
      where("playerId", "==", user.uid),
      orderBy("date", "asc")
    );
    const unsubRatings = onSnapshot(qRatings, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRatings(data);
    });

    const qTeam = query(
      collection(db, "chats/team/messages"),
      orderBy("createdAt", "asc")
    );
    const unsubTeam = onSnapshot(qTeam, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeamMessages(data);
    });

    const qPrivate = query(
      collection(db, `chats/coach_${user.uid}/messages`),
      orderBy("createdAt", "asc")
    );
    const unsubPrivate = onSnapshot(qPrivate, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPrivateMessages(data);
    });

    return () => {
      unsubRatings();
      unsubTeam();
      unsubPrivate();
    };
  }, [user]);

  const latestRating = ratings.length > 0 ? ratings[ratings.length - 1] : null;

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !playerData) return;

    const path = activeChat === "team" ? "chats/team/messages" : `chats/coach_${user.uid}/messages`;
    
    await addDoc(collection(db, path), {
      senderId: user.uid,
      senderName: playerData.firstName,
      senderRole: "player",
      text: newMessage,
      createdAt: serverTimestamp(),
    });
    
    setNewMessage("");
  };

  const getInitialAvatar = (name: string) => {
    return name ? name.charAt(0) : "؟";
  };

  return (
    <Layout>
      <Tabs defaultValue="ratings" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 p-1 rounded-2xl h-14">
          <TabsTrigger value="ratings" className="rounded-xl h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">التقييمات</TabsTrigger>
          <TabsTrigger value="chat" className="rounded-xl h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">التواصل</TabsTrigger>
        </TabsList>

        <TabsContent value="ratings" className="space-y-8 focus:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-0 shadow-xl shadow-blue-900/5 bg-gradient-to-br from-white to-blue-50/50 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/20 flex items-center justify-center mb-2">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg text-slate-600">بدني</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-bold text-slate-900">{latestRating?.physical || 0}<span className="text-2xl text-slate-400">/10</span></div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="border-0 shadow-xl shadow-orange-900/5 bg-gradient-to-br from-white to-orange-50/50 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/20 flex items-center justify-center mb-2">
                    <Dumbbell className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg text-slate-600">مهاري</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-bold text-slate-900">{latestRating?.skill || 0}<span className="text-2xl text-slate-400">/10</span></div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-0 shadow-xl shadow-green-900/5 bg-gradient-to-br from-white to-green-50/50 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/20 flex items-center justify-center mb-2">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg text-slate-600">عام</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-bold text-slate-900">{latestRating?.general || 0}<span className="text-2xl text-slate-400">/10</span></div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <Card className="border-0 shadow-xl shadow-slate-900/5">
            <CardHeader>
              <CardTitle>التطور عبر الزمن</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ratings} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickFormatter={(val) => format(new Date(val), "MM/dd")} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 10]} axisLine={false} tickLine={false} />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="physical" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} name="بدني" />
                  <Line type="monotone" dataKey="skill" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} name="مهاري" />
                  <Line type="monotone" dataKey="general" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="عام" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-800">التقييمات السابقة</h3>
            {ratings.slice().reverse().map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                  <div className="text-sm text-slate-500 mb-1">{format(new Date(r.date), "yyyy/MM/dd")}</div>
                  {r.notes && <div className="text-slate-700 bg-slate-50 p-3 rounded-xl mt-2">{r.notes}</div>}
                </div>
                <div className="flex gap-4">
                  <div className="text-center"><div className="text-xs text-slate-400">بدني</div><div className="font-bold text-blue-600">{r.physical}</div></div>
                  <div className="text-center"><div className="text-xs text-slate-400">مهاري</div><div className="font-bold text-orange-600">{r.skill}</div></div>
                  <div className="text-center"><div className="text-xs text-slate-400">عام</div><div className="font-bold text-green-600">{r.general}</div></div>
                </div>
              </motion.div>
            ))}
            {ratings.length === 0 && <div className="text-center text-slate-500 py-8">لا توجد تقييمات بعد</div>}
          </div>
        </TabsContent>

        <TabsContent value="chat" className="focus:outline-none">
          <Card className="border-0 shadow-xl shadow-slate-900/5 h-[600px] flex flex-col overflow-hidden">
            <div className="flex border-b bg-slate-50 p-2 gap-2">
              <Button variant={activeChat === "team" ? "default" : "ghost"} onClick={() => setActiveChat("team")} className={`flex-1 rounded-xl ${activeChat === 'team' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}>
                شات الفريق
              </Button>
              <Button variant={activeChat === "private" ? "default" : "ghost"} onClick={() => setActiveChat("private")} className={`flex-1 rounded-xl ${activeChat === 'private' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}>
                شات المدرب
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 flex flex-col">
              {(activeChat === "team" ? teamMessages : privateMessages).map((msg) => {
                const isMe = msg.senderId === user?.uid;
                return (
                  <div key={msg.id} className={`flex gap-3 max-w-[80%] ${isMe ? "mr-auto flex-row-reverse" : "ml-auto"}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 font-bold ${msg.senderRole === 'coach' ? 'bg-gradient-to-br from-orange-500 to-red-600' : 'bg-gradient-to-br from-blue-400 to-blue-600'}`}>
                      {getInitialAvatar(msg.senderName || "م")}
                    </div>
                    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      <span className="text-xs text-slate-500 mb-1 px-1">{msg.senderName} {msg.senderRole === 'coach' && '(المدرب)'}</span>
                      <div className={`px-4 py-3 rounded-2xl ${isMe ? "bg-blue-600 text-white rounded-tl-none" : "bg-white border text-slate-800 rounded-tr-none shadow-sm"}`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="p-4 border-t bg-white">
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  placeholder="اكتب رسالتك هنا..." 
                  className="flex-1 h-12 bg-slate-50 border-slate-200 focus-visible:ring-blue-500 rounded-xl"
                />
                <Button type="submit" size="icon" className="h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-700 shrink-0">
                  <Send className="w-5 h-5 rtl:-scale-x-100" />
                </Button>
              </form>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
