import { useRef, useState } from "react";
import { Camera, Loader2, User } from "lucide-react";
import { uploadImage, cldThumb } from "@/lib/cloudinary";
import { toast } from "sonner";

interface PhotoUploadProps {
  value: string | null;
  onChange: (url: string) => void;
  size?: number;
}

export function PhotoUpload({ value, onChange, size = 112 }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("حجم الصورة كبير جداً (8MB كحد أقصى)");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (err: any) {
      toast.error(err.message || "فشل رفع الصورة");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative group rounded-full overflow-hidden border-2 border-primary/30 hover:border-primary transition-all shadow-lg"
        style={{ width: size, height: size }}
      >
        {value ? (
          <img
            src={cldThumb(value, size * 2)}
            alt="profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <User className="text-muted-foreground" style={{ width: size / 2.5, height: size / 2.5 }} />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </div>
        {uploading && !value && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </button>
      <p className="text-[11px] text-muted-foreground font-semibold">
        {value ? "اضغط لتغيير الصورة" : "اضغط لإضافة صورة شخصية"}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
