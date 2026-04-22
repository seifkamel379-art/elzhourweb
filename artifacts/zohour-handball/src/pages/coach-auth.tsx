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
import { PhotoUpload } from "@/components/photo-upload";

export default function CoachAuth() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [coachName, setCoachName] = useState("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
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
    if (!photoURL) {
      toast.error("الرجاء إضافة صورة شخصية");
      return;
    }

    if (!user) return;
    setIsLoading(true);

    try {
      await setDoc(doc(db, "coaches", user.uid), {
        email: user.email,
        name: coachName.trim(),
        photoURL,
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
      <div className="max-w-sm mx-auto mt-4 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card p-6 md:p-8 rounded-3xl shadow-xl shadow-primary/5 border border-border text-center"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>

          <h2 className="text-xl font-extrabold text-card-foreground mb-1">
            صلاحية المدرب
          </h2>
          <p className="text-xs text-muted-foreground mb-6">
            أدخل اسمك وصورتك وكلمة المرور الإدارية
          </p>

          <div className="flex justify-center mb-6">
            <PhotoUpload value={photoURL} onChange={setPhotoURL} size={104} />
          </div>

          <form onSubmit={onSubmit} className="space-y-4 text-right">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">اسم المدرب</Label>
              <Input
                type="text"
                value={coachName}
                onChange={(e) => setCoachName(e.target.value)}
                className="bg-muted/50 h-11 rounded-xl text-sm"
                placeholder="مثال: كابتن أحمد"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">كلمة المرور الإدارية</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-muted/50 h-11 text-center tracking-widest rounded-xl text-sm"
                dir="ltr"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-xl mt-2"
              disabled={isLoading}
            >
              {isLoading ? "جاري التحقق..." : "دخول كمدرب"}
            </Button>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
}
