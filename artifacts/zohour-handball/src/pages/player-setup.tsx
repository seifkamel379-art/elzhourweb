import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout";

const setupSchema = z.object({
  firstName: z.string().min(2, "الاسم الأول مطلوب"),
  middleName: z.string().min(2, "اسم الأب مطلوب"),
  lastName: z.string().min(2, "اللقب مطلوب"),
  phone: z.string().min(10, "رقم الهاتف مطلوب"),
  dob: z.string().refine((val) => {
    const year = new Date(val).getFullYear();
    return year >= 2008 && year <= 2013;
  }, "يجب أن تكون سنة الميلاد بين 2008 و 2013"),
});

export default function PlayerSetup() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof setupSchema>>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      phone: "",
      dob: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof setupSchema>) => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      const fullName = `${data.firstName} ${data.middleName} ${data.lastName}`;
      await setDoc(doc(db, "players", user.uid), {
        ...data,
        fullName,
        createdAt: serverTimestamp(),
      });
      
      setLocation("/player");
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
      <div className="max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30 flex items-center justify-center">
              <UserPlus className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">استكمال البيانات</h2>
              <p className="text-slate-500">الرجاء إدخال بياناتك الشخصية كلاعب</p>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>الاسم الأول</Label>
                <Input {...form.register("firstName")} className="bg-slate-50" />
                {form.formState.errors.firstName && <p className="text-red-500 text-sm">{form.formState.errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>اسم الأب</Label>
                <Input {...form.register("middleName")} className="bg-slate-50" />
                {form.formState.errors.middleName && <p className="text-red-500 text-sm">{form.formState.errors.middleName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>اللقب / العائلة</Label>
                <Input {...form.register("lastName")} className="bg-slate-50" />
                {form.formState.errors.lastName && <p className="text-red-500 text-sm">{form.formState.errors.lastName.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input type="tel" {...form.register("phone")} className="bg-slate-50 text-left" dir="ltr" />
              {form.formState.errors.phone && <p className="text-red-500 text-sm">{form.formState.errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>تاريخ الميلاد</Label>
              <Input type="date" {...form.register("dob")} className="bg-slate-50" />
              {form.formState.errors.dob && <p className="text-red-500 text-sm">{form.formState.errors.dob.message}</p>}
            </div>

            <Button type="submit" className="w-full h-12 bg-blue-700 hover:bg-blue-800 text-md rounded-xl" disabled={isLoading}>
              {isLoading ? "جاري الحفظ..." : "حفظ ومتابعة"}
            </Button>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
}
