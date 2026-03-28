import { createContext, useContext, useEffect, useState } from "react";
import { auth, fsdb, provider } from "./firebase";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// ── Add admin email addresses here ───────────────────────────────────────────
const ADMIN_EMAILS = ["dharshan2872006@gmail.com"];

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [role,    setRole]    = useState(null); // "student" | "admin"
  const [loading, setLoading] = useState(true);

  const handleFirebaseUser = async (firebaseUser) => {
    if (!firebaseUser) {
      setUser(null);
      setRole(null);
      setLoading(false);
      return;
    }

    const isAdmin = ADMIN_EMAILS.includes(firebaseUser.email);
    setRole(isAdmin ? "admin" : "student");
    setUser(firebaseUser);

    // Create student doc in Firestore on first login
    if (!isAdmin) {
      const ref  = doc(fsdb, "users", firebaseUser.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          name:          firebaseUser.displayName || "Student",
          email:         firebaseUser.email,
          photoURL:      firebaseUser.photoURL || "",
          uid:           firebaseUser.uid,
          dept:          "Computer Science",
          year:          1,
          registrations: [],
          createdAt:     serverTimestamp(),
        });
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    // Handle redirect result (for browsers that block popups)
    getRedirectResult(auth)
      .then((result) => { if (result?.user) handleFirebaseUser(result.user); })
      .catch((err)   => { console.error("Redirect error:", err); setLoading(false); });

    // Listen to auth state changes
    const unsub = onAuthStateChanged(auth, handleFirebaseUser);
    return unsub;
  }, []);

  // Try popup first, fall back to redirect
  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      if (err.code === "auth/popup-blocked" || err.code === "auth/popup-closed-by-user") {
        await signInWithRedirect(auth, provider);
      } else {
        throw err;
      }
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, role, loading, loginWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}