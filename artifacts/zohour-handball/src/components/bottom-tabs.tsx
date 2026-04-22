import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export interface BottomTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface BottomTabsProps<T extends string> {
  tabs: BottomTab[];
  active: T;
  onChange: (id: T) => void;
}

export function BottomTabs<T extends string>({ tabs, active, onChange }: BottomTabsProps<T>) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)] bg-background/95 backdrop-blur-xl border-t border-border">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="flex items-stretch justify-around h-16 relative">
          {tabs.map((t) => {
            const isActive = active === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => onChange(t.id as T)}
                className="flex-1 relative flex flex-col items-center justify-center gap-1 transition-colors"
              >
                {isActive && (
                  <motion.div
                    layoutId="bottom-tab-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-10 bg-primary rounded-b-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-[10px] font-bold transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
