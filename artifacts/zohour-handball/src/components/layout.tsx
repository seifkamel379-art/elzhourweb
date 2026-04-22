import { useAuth } from "@/lib/auth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { LogOut } from "lucide-react";
import { Button } from "./ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm shadow-blue-900/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Logo" className="w-10 h-10 rounded-full border border-blue-100 object-cover" />
            <div>
              <h1 className="font-bold text-slate-900 text-sm md:text-base leading-tight">مركز شباب الزهور</h1>
              <p className="text-xs text-slate-500">فريق 2010</p>
            </div>
          </div>
          
          {profile && (
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-sm text-slate-600">
                {profile.role === "coach" ? "بوابة المدرب" : "بوابة اللاعب"}
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-500 hover:text-red-600 hover:bg-red-50">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
