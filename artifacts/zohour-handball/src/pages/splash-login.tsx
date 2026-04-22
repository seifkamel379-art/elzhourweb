import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IntroAnimation from "@/components/intro-animation";
import { AmbientBackground } from "@/components/ambient-background";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useLocation } from "wouter";

const authSchema = z.object({
  email: z.string().email({ message: "البريد الإلكتروني غير صالح" }),
  password: z
    .string()
    .min(6, { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }),
});

export default function SplashLogin() {
  const [showSplash, setShowSplash] = useState(false);
  const { user, profile, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.role === "player") setLocation("/player");
      else if (profile.role === "coach") setLocation("/coach");
      else setLocation("/select-portal");
      return;
    }

    if (!loading && !user) {
      const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
      if (!hasSeenSplash) {
        setShowSplash(true);
      }
    }
  }, [user, profile, loading, setLocation]);

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem("hasSeenSplash", "true");
  };

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
      toast.error("خطأ في تسجيل الدخول", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: z.infer<typeof authSchema>) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      );
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: data.email,
        role: null,
        createdAt: serverTimestamp(),
      });
    } catch (error: any) {
      toast.error("خطأ في التسجيل", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <AmbientBackground />
      <AnimatePresence mode="wait">
        {showSplash && (
          <IntroAnimation key="intro" onComplete={handleSplashComplete} />
        )}
      </AnimatePresence>

      {!showSplash && (
        <motion.div
          key="auth"
          className="w-full max-w-sm p-4 relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 ring-2 ring-primary/20">
              <img
                src="/logo.jpg"
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="text-center mb-5">
            <h1 className="text-lg font-extrabold text-foreground">
              مركز شباب الزهور ببورسعيد
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              فريق كرة اليد · مواليد 2010
            </p>
          </div>

          <Card className="border border-border/60 shadow-2xl bg-card/90 backdrop-blur-xl overflow-hidden rounded-2xl">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12 rounded-none bg-muted/40 p-0 border-b border-border">
                <TabsTrigger
                  value="login"
                  className="data-[state=active]:bg-card data-[state=active]:text-primary h-full rounded-none font-bold text-sm"
                >
                  تسجيل دخول
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="data-[state=active]:bg-card data-[state=active]:text-primary h-full rounded-none font-bold text-sm"
                >
                  إنشاء حساب
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="p-5 m-0">
                <form
                  onSubmit={loginForm.handleSubmit(onLogin)}
                  className="space-y-3"
                >
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="login-email"
                      className="text-xs font-semibold text-muted-foreground"
                    >
                      البريد الإلكتروني
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="name@example.com"
                      {...loginForm.register("email")}
                      className="h-10 bg-background/50 rounded-xl text-sm"
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-destructive text-xs font-medium">
                        {loginForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="login-password"
                      className="text-xs font-semibold text-muted-foreground"
                    >
                      كلمة المرور
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      {...loginForm.register("password")}
                      className="h-10 bg-background/50 rounded-xl text-sm"
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-destructive text-xs font-medium">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold rounded-xl mt-1"
                    disabled={isLoading}
                  >
                    {isLoading ? "جاري الدخول..." : "دخول"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="p-5 m-0">
                <form
                  onSubmit={registerForm.handleSubmit(onRegister)}
                  className="space-y-3"
                >
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="register-email"
                      className="text-xs font-semibold text-muted-foreground"
                    >
                      البريد الإلكتروني
                    </Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="name@example.com"
                      {...registerForm.register("email")}
                      className="h-10 bg-background/50 rounded-xl text-sm"
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-destructive text-xs font-medium">
                        {registerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="register-password"
                      className="text-xs font-semibold text-muted-foreground"
                    >
                      كلمة المرور
                    </Label>
                    <Input
                      id="register-password"
                      type="password"
                      {...registerForm.register("password")}
                      className="h-10 bg-background/50 rounded-xl text-sm"
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-destructive text-xs font-medium">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-10 bg-accent text-accent-foreground hover:bg-accent/90 text-sm font-bold rounded-xl mt-1"
                    disabled={isLoading}
                  >
                    {isLoading ? "جاري التسجيل..." : "تسجيل جديد"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
