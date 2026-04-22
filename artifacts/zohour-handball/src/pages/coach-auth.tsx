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
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout";

export default function CoachAuth() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== COACH_PASSWORD) {
      toast({
        title: "كلمة المرور غير صحيحة",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;
    setIsLoading(true);
    
    try {
      await setDoc(doc(db, "coaches", user.uid), {
        email: user.email,
        createdAt: serverTimestamp(),
      });
      
      setLocation("/coach");
    } catch (error: any) {
      toast({
        title: "حدث خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-xl shadow-orange-900/5 border border-slate-100 text-center"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/30 flex items-center justify-center mb-6">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-2">صلاحية المدرب</h2>
          <p className="text-slate-500 mb-8">أدخل كلمة المرور الإدارية للوصول إلى لوحة المدرب</p>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2 text-right">
              <Label>كلمة المرور الإدارية</Label>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-50 h-12 text-center text-xl tracking-widest" 
                dir="ltr"
              />
            </div>

            <Button type="submit" className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-md rounded-xl" disabled={isLoading}>
              {isLoading ? "جاري التحقق..." : "دخول كمدرب"}
            </Button>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
}
