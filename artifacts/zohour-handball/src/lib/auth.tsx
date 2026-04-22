import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
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
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setPlayerData(null);
        setLoading(false);
        
        if (location !== "/" && !location.startsWith("/auth")) {
          setLocation("/");
        }
        return;
      }

      const userRef = doc(db, "users", firebaseUser.uid);
      const unsubUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data() as UserProfile;
          setProfile(userData);

          if (userData.role === "player") {
            const playerRef = doc(db, "players", firebaseUser.uid);
            getDoc(playerRef).then((playerSnap) => {
              if (playerSnap.exists()) {
                setPlayerData(playerSnap.data() as PlayerProfile);
              } else {
                setPlayerData(null);
                if (location !== "/player-setup") setLocation("/player-setup");
              }
              setLoading(false);
            });
          } else if (userData.role === "coach") {
            const coachRef = doc(db, "coaches", firebaseUser.uid);
            getDoc(coachRef).then((coachSnap) => {
              if (coachSnap.exists()) {
                setProfile(prev => prev ? { ...prev, name: coachSnap.data().name } : prev);
                if (location !== "/coach") setLocation("/coach");
              } else {
                if (location !== "/coach-auth") setLocation("/coach-auth");
              }
              setPlayerData(null);
              setLoading(false);
            });
          } else {
            setPlayerData(null);
            setLoading(false);
            if (location !== "/select-portal") {
              setLocation("/select-portal");
            }
          }
        } else {
          setProfile(null);
          setLoading(false);
          if (location !== "/select-portal") {
            setLocation("/select-portal");
          }
        }
      });

      return () => unsubUser();
    });

    return () => unsubscribe();
  }, [location, setLocation]);

  useEffect(() => {
    if (loading) return;
    
    if (user && profile) {
      if (!profile.role && location !== "/select-portal") {
        setLocation("/select-portal");
      } else if (profile.role === "player" && !playerData && location !== "/player-setup") {
        setLocation("/player-setup");
      } else if (profile.role === "player" && playerData && location === "/") {
        setLocation("/player");
      } else if (profile.role === "coach" && profile.name && location === "/") {
        setLocation("/coach");
      } else if (profile.role === "coach" && !profile.name && location !== "/coach-auth") {
        setLocation("/coach-auth");
      }
    }
  }, [user, profile, playerData, loading, location, setLocation]);

  return (
    <AuthContext.Provider value={{ user, profile, playerData, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
