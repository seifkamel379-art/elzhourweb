import { cldThumb } from "@/lib/cloudinary";
import { User } from "lucide-react";

interface UserAvatarProps {
  photoURL?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  ring?: boolean;
}

export function UserAvatar({ photoURL, name, size = 40, className = "", ring = false }: UserAvatarProps) {
  const initial = name?.charAt(0) || "؟";
  const ringClass = ring ? "ring-2 ring-primary/30 ring-offset-2 ring-offset-background" : "";

  if (photoURL) {
    return (
      <img
        src={cldThumb(photoURL, size * 2)}
        alt={name || "avatar"}
        className={`rounded-full object-cover shrink-0 ${ringClass} ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 ${ringClass} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name ? initial : <User style={{ width: size * 0.5, height: size * 0.5 }} />}
    </div>
  );
}
