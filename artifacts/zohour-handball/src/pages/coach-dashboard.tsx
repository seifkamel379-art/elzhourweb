import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { Users, ClipboardList, MessageSquare, Send, Trash2, Activity, Dumbbell, Brain, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CoachDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [players, setPlayers] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("players");
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  
  // Evaluation State
  const [expandedEval, setExpandedEval] = useState<string | null>(null);
  const [evalForms, setEvalForms] = useState<Record<string, any>>({});
  const [evalSaving, setEvalSaving] = useState<string | null>(null);

  // Chat State
  const [activeChat, setActiveChat] = useState("team");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Fetch players and ratings
  useEffect(() => {
    const unsubPlayers = onSnapshot(collection(db, "players"), (snap) => {
      setPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubRatings = onSnapshot(query(collection(db, "ratings"), orderBy("date", "asc")), (snap) => {
      setRatings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubPlayers();
      unsubRatings();
    };
  }, []);

  // Chat Listener
  useEffect(() => {
    const path = activeChat === "team" ? "chats/team/messages" : `chats/coach_${activeChat}/messages`;
    const unsubChat = onSnapshot(query(collection(db, path), orderBy("createdAt", "asc")), (snap) => {
      setChatMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubChat();
  }, [activeChat]);

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
      [playerId]: {
        ...prev[playerId],
        [field]: value
      }
    }));
  };

  const initEvalForm = (playerId: string) => {
    if (!evalForms[playerId]) {
      setEvalForms(prev => ({
        ...prev,
        [playerId]: {
          physical: 5,
          skill: 5,
          general: 5,
          notes: "",
          date: format(new Date(), "yyyy-MM-dd")
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

    setEvalSaving(playerId);
    try {
      await addDoc(collection(db, "ratings"), {
        playerId,
        playerName,
        coachId: user.uid,
        date: data.date || format(new Date(), "yyyy-MM-dd"),
        physical: data.physical || 0,
        skill: data.skill || 0,
        general: data.general || 0,
        notes: data.notes || "",
        createdAt: serverTimestamp()
      });
      
      toast({ title: "تم الحفظ", description: "تم حفظ التقييم بنجاح." });
      setExpandedEval(null);
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } finally {
      setEvalSaving(null);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const path = activeChat === "team" ? "chats/team/messages" : `chats/coach_${activeChat}/messages`;
    
    await addDoc(collection(db, path), {
      senderId: user.uid,
      senderName: "المدرب",
      senderRole: "coach",
      text: newMessage,
      createdAt: serverTimestamp(),
    });
    
    setNewMessage("");
  };

  const deleteMessage = async (msgId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الرسالة؟")) return;
    const path = activeChat === "team" ? "chats/team/messages" : `chats/coach_${activeChat}/messages`;
    try {
      await deleteDoc(doc(db, path, msgId));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  return (
    <Layout>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-100 p-1 rounded-2xl h-14">
          <TabsTrigger value="players" className="rounded-xl h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">اللاعبون</TabsTrigger>
          <TabsTrigger value="evaluations" className="rounded-xl h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">التقييم</TabsTrigger>
          <TabsTrigger value="chat" className="rounded-xl h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">التواصل</TabsTrigger>
        </TabsList>

        {/* PLAYERS TAB */}
        <TabsContent value="players" className="space-y-6 focus:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {players.map((player, i) => {
              const avg = getPlayerAverages(player.id);
              return (
                <motion.div key={player.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="border-0 shadow-xl shadow-blue-900/5 hover:shadow-2xl hover:shadow-blue-900/10 transition-all cursor-pointer group" onClick={() => setSelectedPlayer(player)}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/30 flex items-center justify-center text-white text-2xl font-bold group-hover:scale-105 transition-transform">
                          {getInitialAvatar(player.firstName)}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-800">{player.firstName} {player.lastName}</h3>
                          <div className="text-sm text-slate-500">{player.phone}</div>
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                        <span className="text-slate-600 font-medium">المتوسط العام</span>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center font-bold text-blue-600 text-lg">
                            {avg.t}
                          </div>
                          <span className="text-slate-400 text-sm">/10</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* EVALUATIONS TAB */}
        <TabsContent value="evaluations" className="space-y-4 focus:outline-none">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-100 overflow-hidden">
            {players.map((player, i) => {
              const isExpanded = expandedEval === player.id;
              const avg = getPlayerAverages(player.id);
              const formData = evalForms[player.id] || {};
              
              return (
                <div key={player.id} className={`border-b last:border-0 ${isExpanded ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}>
                  <div 
                    className="p-4 md:p-6 flex items-center justify-between cursor-pointer"
                    onClick={() => toggleEval(player.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-md flex items-center justify-center text-white font-bold">
                        {getInitialAvatar(player.firstName)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{player.firstName} {player.lastName}</div>
                        <div className="text-xs text-slate-500">متوسط: {avg.t}/10</div>
                      </div>
                    </div>
                    <div>
                      {isExpanded ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: "auto", opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 pt-0 border-t border-slate-100 bg-white m-4 mt-0 rounded-2xl shadow-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                            <div className="space-y-6">
                              <div className="space-y-4">
                                <div className="flex justify-between">
                                  <Label className="text-blue-600 font-bold flex items-center gap-2"><Activity className="w-4 h-4"/> تقييم بدني</Label>
                                  <span className="font-bold">{formData.physical || 0}/10</span>
                                </div>
                                <Slider 
                                  value={[formData.physical || 0]} 
                                  max={10} step={1} 
                                  onValueChange={(v) => handleEvalChange(player.id, "physical", v[0])}
                                  className="py-4"
                                />
                              </div>
                              
                              <div className="space-y-4">
                                <div className="flex justify-between">
                                  <Label className="text-orange-600 font-bold flex items-center gap-2"><Dumbbell className="w-4 h-4"/> تقييم مهاري</Label>
                                  <span className="font-bold">{formData.skill || 0}/10</span>
                                </div>
                                <Slider 
                                  value={[formData.skill || 0]} 
                                  max={10} step={1} 
                                  onValueChange={(v) => handleEvalChange(player.id, "skill", v[0])}
                                  className="py-4"
                                />
                              </div>
                              
                              <div className="space-y-4">
                                <div className="flex justify-between">
                                  <Label className="text-green-600 font-bold flex items-center gap-2"><Brain className="w-4 h-4"/> تقييم عام</Label>
                                  <span className="font-bold">{formData.general || 0}/10</span>
                                </div>
                                <Slider 
                                  value={[formData.general || 0]} 
                                  max={10} step={1} 
                                  onValueChange={(v) => handleEvalChange(player.id, "general", v[0])}
                                  className="py-4"
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>تاريخ التقييم</Label>
                                <Input 
                                  type="date" 
                                  value={formData.date || ""} 
                                  onChange={(e) => handleEvalChange(player.id, "date", e.target.value)} 
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>ملاحظات المدرب</Label>
                                <Textarea 
                                  placeholder="ملاحظات حول أداء اللاعب..." 
                                  className="h-32 resize-none"
                                  value={formData.notes || ""}
                                  onChange={(e) => handleEvalChange(player.id, "notes", e.target.value)}
                                />
                              </div>
                              <Button 
                                onClick={() => submitEval(player.id, player.fullName)} 
                                className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl mt-4"
                                disabled={evalSaving === player.id}
                              >
                                {evalSaving === player.id ? "جاري الحفظ..." : "حفظ التقييم"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* CHAT TAB */}
        <TabsContent value="chat" className="focus:outline-none h-[600px]">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-100 flex flex-col md:flex-row h-full overflow-hidden">
            
            {/* Sidebar */}
            <div className="w-full md:w-80 border-l border-slate-100 flex flex-col bg-slate-50/50">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-800">المحادثات</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                <button 
                  onClick={() => setActiveChat("team")}
                  className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition-colors ${activeChat === "team" ? "bg-blue-100 text-blue-800 font-bold" : "hover:bg-slate-100 text-slate-700"}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${activeChat === 'team' ? 'bg-blue-600' : 'bg-slate-400'}`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <span>شات الفريق العام</span>
                </button>
                
                <div className="pt-4 pb-2 px-3 text-xs font-bold text-slate-400">رسائل خاصة</div>
                
                {players.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => setActiveChat(p.id)}
                    className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition-colors ${activeChat === p.id ? "bg-blue-100 text-blue-800 font-bold" : "hover:bg-slate-100 text-slate-700"}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${activeChat === p.id ? 'bg-blue-600' : 'bg-slate-400'}`}>
                      {getInitialAvatar(p.firstName)}
                    </div>
                    <span>{p.firstName} {p.lastName}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
              <div className="p-4 border-b border-slate-100 bg-white">
                <h3 className="font-bold text-slate-800">
                  {activeChat === "team" ? "شات الفريق العام" : players.find(p => p.id === activeChat)?.fullName || "محادثة"}
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {chatMessages.map((msg) => {
                  const isMe = msg.senderId === user?.uid;
                  return (
                    <div key={msg.id} className={`flex gap-3 max-w-[80%] group ${isMe ? "mr-auto flex-row-reverse" : "ml-auto"}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 font-bold ${msg.senderRole === 'coach' ? 'bg-gradient-to-br from-orange-500 to-red-600' : 'bg-gradient-to-br from-blue-400 to-blue-600'}`}>
                        {getInitialAvatar(msg.senderName || "م")}
                      </div>
                      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-xs text-slate-500">{msg.senderName} {msg.senderRole === 'coach' && '(أنا)'}</span>
                          <button onClick={() => deleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className={`px-4 py-3 rounded-2xl ${isMe ? "bg-blue-600 text-white rounded-tl-none shadow-md shadow-blue-500/20" : "bg-white border text-slate-800 rounded-tr-none shadow-sm"}`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {chatMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                    <MessageSquare className="w-16 h-16 mb-4" />
                    <p>لا توجد رسائل حتى الآن</p>
                  </div>
                )}
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
            </div>
            
          </div>
        </TabsContent>
      </Tabs>

      {/* PLAYER DETAILS MODAL */}
      <Dialog open={!!selectedPlayer} onOpenChange={(o) => !o && setSelectedPlayer(null)}>
        <DialogContent className="max-w-3xl">
          {selectedPlayer && (() => {
            const pRatings = getPlayerRatings(selectedPlayer.id);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-4 text-2xl pb-4 border-b">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-md flex items-center justify-center text-white font-bold">
                      {getInitialAvatar(selectedPlayer.firstName)}
                    </div>
                    <div>
                      <div>{selectedPlayer.fullName}</div>
                      <div className="text-sm font-normal text-slate-500 mt-1">تاريخ الميلاد: {selectedPlayer.dob} • هاتف: <span dir="ltr">{selectedPlayer.phone}</span></div>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                
                <div className="py-4 space-y-8">
                  <Card className="border-0 shadow-xl shadow-slate-900/5">
                    <CardHeader>
                      <CardTitle>التطور عبر الزمن</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={pRatings} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
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

                  <div className="space-y-4 max-h-64 overflow-y-auto px-2">
                    <h3 className="font-bold text-slate-800">سجل التقييمات</h3>
                    {pRatings.slice().reverse().map((r, i) => (
                      <div key={r.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col md:flex-row gap-4 justify-between">
                        <div>
                          <div className="text-sm font-bold text-slate-700">{format(new Date(r.date), "yyyy/MM/dd")}</div>
                          {r.notes && <div className="text-sm text-slate-600 mt-1">{r.notes}</div>}
                        </div>
                        <div className="flex gap-4 shrink-0">
                          <div className="text-center"><div className="text-xs text-slate-400">بدني</div><div className="font-bold text-blue-600">{r.physical}</div></div>
                          <div className="text-center"><div className="text-xs text-slate-400">مهاري</div><div className="font-bold text-orange-600">{r.skill}</div></div>
                          <div className="text-center"><div className="text-xs text-slate-400">عام</div><div className="font-bold text-green-600">{r.general}</div></div>
                        </div>
                      </div>
                    ))}
                    {pRatings.length === 0 && <div className="text-center text-slate-500 py-4">لا توجد تقييمات</div>}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
