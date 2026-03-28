import { createContext, useContext, useEffect, useState } from "react";
import { auth, db, provider } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [role, setRole]       = useState(null); // "student" | "admin"
  const [loading, setLoading] = useState(true);

  // Admin emails — add your admin email here
  const ADMIN_EMAILS = ["dharshan@gmail.com"];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const isAdmin = ADMIN_EMAILS.includes(firebaseUser.email);
        setRole(isAdmin ? "admin" : "student");

        // Save student to Firestore if first login
        if (!isAdmin) {
          const ref = doc(db, "users", firebaseUser.uid);
          const snap = await getDoc(ref);
          if (!snap.exists()) {
            await setDoc(ref, {
              name:          firebaseUser.displayName,
              email:         firebaseUser.email,
              photoURL:      firebaseUser.photoURL,
              uid:           firebaseUser.uid,
              dept:          "Computer Science",
              year:          1,
              registrations: [],
              createdAt:     new Date(),
            });
          }
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const loginWithGoogle = () => signInWithPopup(auth, provider);
  const logout          = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, role, loading, loginWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}