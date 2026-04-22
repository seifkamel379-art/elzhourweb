import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { User, Medal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SelectPortal() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSelectRole = async (role: "player" | "coach") => {
    if (!user) return;
    
    try {
      await updateDoc(doc(db, "users", user.uid), { role });
      
      if (role === "player") {
        setLocation("/player-setup");
      } else {
        setLocation("/coach-auth");
      }
    } catch (error: any) {
      toast({
        title: "حدث خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-4">أهلاً بك في المنصة</h1>
          <p className="text-slate-600">الرجاء اختيار نوع الحساب الخاص بك للمتابعة</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.button
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectRole("player")}
            className="flex flex-col items-center p-10 bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-blue-100 hover:border-blue-300 transition-colors group"
          >
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <User className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">بوابة لاعب</h2>
            <p className="text-slate-500 text-center">لمتابعة تقييماتك والتواصل مع المدرب</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectRole("coach")}
            className="flex flex-col items-center p-10 bg-white rounded-3xl shadow-xl shadow-orange-900/5 border border-orange-100 hover:border-orange-300 transition-colors group"
          >
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Medal className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">بوابة مدرب</h2>
            <p className="text-slate-500 text-center">لتقييم اللاعبين ومتابعة تطور الفريق</p>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
