import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { User, Medal } from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/layout";

export default function SelectPortal() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

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
      toast.error("حدث خطأ", { description: error.message });
    }
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center py-10">
        <div className="max-w-2xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-3">
              أهلاً بك في المنصة
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              اختر نوع الحساب للمتابعة
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectRole("player")}
              className="flex flex-col items-center p-8 bg-card rounded-3xl shadow-md border border-border hover:border-primary/50 transition-all group"
            >
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <User className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-extrabold text-card-foreground mb-2">
                بوابة لاعب
              </h2>
              <p className="text-xs text-muted-foreground text-center">
                لمتابعة تقييماتك والتواصل مع المدرب
              </p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectRole("coach")}
              className="flex flex-col items-center p-8 bg-card rounded-3xl shadow-md border border-border hover:border-primary/50 transition-all group"
            >
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Medal className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-extrabold text-card-foreground mb-2">
                بوابة مدرب
              </h2>
              <p className="text-xs text-muted-foreground text-center">
                لتقييم اللاعبين ومتابعة تطور الفريق
              </p>
            </motion.button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
