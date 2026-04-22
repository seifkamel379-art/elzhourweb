import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useLocation } from "wouter";

interface UserProfile {
  uid: string;
  email: string;
  role: "player" | "coach" | null;
  name?: string;
  createdAt?: any;
}

interface PlayerProfile {
  firstName: string;
  fatherName: string;
  grandfatherName: string;
  fullName: string;
  phone: string;
  dob: string;
  createdAt?: any;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  playerData: PlayerProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  playerData: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [playerData, setPlayerData] = useState<PlayerProfile | null>(null);
  const [coachName, setCoachName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useLocation();

  // Listen to firebase auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setPlayerData(null);
        setCoachName(null);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // Listen to user profile, player doc, coach doc
  useEffect(() => {
    if (!user) return;

    const unsubUser = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        setProfile({ uid: user.uid, ...(snap.data() as any) });
      } else {
        setProfile(null);
      }
      setLoading(false);
    }, () => setLoading(false));

    const unsubPlayer = onSnapshot(doc(db, "players", user.uid), (snap) => {
      setPlayerData(snap.exists() ? (snap.data() as PlayerProfile) : null);
    });

    const unsubCoach = onSnapshot(doc(db, "coaches", user.uid), (snap) => {
      setCoachName(snap.exists() ? (snap.data() as any).name || null : null);
    });

    return () => {
      unsubUser();
      unsubPlayer();
      unsubCoach();
    };
  }, [user]);

  // Routing logic — single source of truth
  useEffect(() => {
    if (loading) return;

    if (!user) {
      if (location !== "/") setLocation("/");
      return;
    }
    if (!profile) return;

    const role = profile.role;

    if (!role) {
      if (location !== "/select-portal") setLocation("/select-portal");
      return;
    }

    if (role === "player") {
      if (!playerData) {
        if (location !== "/player-setup") setLocation("/player-setup");
      } else if (location === "/" || location === "/select-portal" || location === "/player-setup") {
        setLocation("/player");
      }
      return;
    }

    if (role === "coach") {
      if (!coachName) {
        if (location !== "/coach-auth") setLocation("/coach-auth");
      } else if (location === "/" || location === "/select-portal" || location === "/coach-auth") {
        setLocation("/coach");
      }
      return;
    }
  }, [user, profile, playerData, coachName, loading, location, setLocation]);

  const enrichedProfile: UserProfile | null = profile
    ? { ...profile, name: coachName || profile.name }
    : null;

  return (
    <AuthContext.Provider value={{ user, profile: enrichedProfile, playerData, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
