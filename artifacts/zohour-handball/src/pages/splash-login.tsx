import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const authSchema = z.object({
  email: z.string().email({ message: "البريد الإلكتروني غير صالح" }),
  password: z.string().min(6, { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }),
});

export default function SplashLogin() {
  const [showSplash, setShowSplash] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
    if (!hasSeenSplash) {
      setShowSplash(true);
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem("hasSeenSplash", "true");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  const loginForm = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  const onLogin = async (data: z.infer<typeof authSchema>) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
    } catch (error: any) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: z.infer<typeof authSchema>) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: data.email,
        role: null,
        createdAt: serverTimestamp(),
      });
    } catch (error: any) {
      toast({
        title: "خطأ في التسجيل",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-500/20 blur-3xl"></div>
      </div>

      <AnimatePresence mode="wait">
        {showSplash ? (
          <motion.div
            key="splash"
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 1, type: "spring" }}
              className="flex flex-col items-center"
            >
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.5)] mb-8 relative">
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                <motion.div 
                  className="absolute inset-0 bg-white/20 mix-blend-overlay"
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <motion.h1 
                className="text-2xl md:text-4xl font-bold text-white mb-2 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
              >
                مركز شباب الزهور
              </motion.h1>
              <motion.h2
                className="text-lg md:text-xl text-blue-300 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
              >
                فريق كرة اليد - مواليد 2010
              </motion.h2>
            </motion.div>
            
            <Button
              variant="ghost"
              className="absolute top-6 right-6 text-white/50 hover:text-white"
              onClick={() => setShowSplash(false)}
            >
              تخطي
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="auth"
            className="w-full max-w-md p-4 relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg shadow-blue-900/20">
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
              </div>
            </div>

            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-14 rounded-t-xl rounded-b-none border-b bg-transparent p-0">
                  <TabsTrigger value="login" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 h-full rounded-none">تسجيل دخول</TabsTrigger>
                  <TabsTrigger value="register" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 h-full rounded-none">إنشاء حساب جديد</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="p-6 pt-6 mt-0">
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">البريد الإلكتروني</Label>
                      <Input id="login-email" type="email" placeholder="name@example.com" {...loginForm.register("email")} className="h-12 bg-white/50" />
                      {loginForm.formState.errors.email && <p className="text-red-500 text-sm">{loginForm.formState.errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">كلمة المرور</Label>
                      <Input id="login-password" type="password" {...loginForm.register("password")} className="h-12 bg-white/50" />
                      {loginForm.formState.errors.password && <p className="text-red-500 text-sm">{loginForm.formState.errors.password.message}</p>}
                    </div>
                    <Button type="submit" className="w-full h-12 bg-blue-700 hover:bg-blue-800 text-md" disabled={isLoading}>
                      {isLoading ? "جاري الدخول..." : "دخول"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register" className="p-6 pt-6 mt-0">
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-email">البريد الإلكتروني</Label>
                      <Input id="register-email" type="email" placeholder="name@example.com" {...registerForm.register("email")} className="h-12 bg-white/50" />
                      {registerForm.formState.errors.email && <p className="text-red-500 text-sm">{registerForm.formState.errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">كلمة المرور</Label>
                      <Input id="register-password" type="password" {...registerForm.register("password")} className="h-12 bg-white/50" />
                      {registerForm.formState.errors.password && <p className="text-red-500 text-sm">{registerForm.formState.errors.password.message}</p>}
                    </div>
                    <Button type="submit" className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-md" disabled={isLoading}>
                      {isLoading ? "جاري التسجيل..." : "تسجيل جديد"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
