import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, COACH_PASSWORD } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/layout";

export default function CoachAuth() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [coachName, setCoachName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== COACH_PASSWORD) {
      toast.error("كلمة المرور غير صحيحة");
      return;
    }
    
    if (!coachName.trim()) {
      toast.error("الرجاء إدخال اسم المدرب");
      return;
    }

    if (!user) return;
    setIsLoading(true);
    
    try {
      await setDoc(doc(db, "coaches", user.uid), {
        email: user.email,
        name: coachName.trim(),
        createdAt: serverTimestamp(),
      });
      
      setLocation("/coach");
    } catch (error: any) {
      toast.error("حدث خطأ", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-sm mx-auto mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card p-6 md:p-8 rounded-2xl shadow-xl shadow-accent/5 border border-border text-center"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-accent" />
          </div>
          
          <h2 className="text-xl font-bold text-card-foreground mb-1">صلاحية المدرب</h2>
          <p className="text-xs text-muted-foreground mb-6">أدخل اسمك وكلمة المرور الإدارية</p>

          <form onSubmit={onSubmit} className="space-y-5 text-right">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">اسم المدرب</Label>
              <Input 
                type="text" 
                value={coachName} 
                onChange={(e) => setCoachName(e.target.value)}
                className="bg-muted/50 h-11 rounded-xl text-sm" 
                placeholder="مثال: كابتن أحمد"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">كلمة المرور الإدارية</Label>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="bg-muted/50 h-11 text-center tracking-widest rounded-xl text-sm" 
                dir="ltr"
              />
            </div>

            <Button type="submit" className="w-full h-11 bg-accent hover:bg-accent/90 text-accent-foreground text-sm font-bold rounded-xl mt-2" disabled={isLoading}>
              {isLoading ? "جاري التحقق..." : "دخول كمدرب"}
            </Button>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
}
