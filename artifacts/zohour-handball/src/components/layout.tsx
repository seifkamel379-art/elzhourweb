import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { LogOut, Moon, Sun, User } from "lucide-react";
import { useTheme } from "./theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Layout({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="sticky top-0 z-40 w-full glass border-b border-border/50">
        <div className="container max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-full border border-border/50" />
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold leading-tight text-foreground">مركز شباب الزهور</h1>
                <p className="text-[10px] text-muted-foreground leading-tight font-semibold">كرة يد 2010</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {profile && (
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <Avatar className="w-8 h-8 border border-border/50">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-xl">
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive gap-2 rounded-lg cursor-pointer font-semibold text-xs">
                    <LogOut className="w-4 h-4" />
                    تسجيل خروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1 container max-w-5xl mx-auto px-4 py-6 flex flex-col">
        {children}
      </main>
    </div>
  );
}
