import { useAuth, AuthProvider } from "./AuthContext";
import Login from "./Login";
import StudentPortal from "./StudentPortal";
import AdminPortal from "./AdminPortal";

// ── Inner app — reads auth state and routes accordingly ──────────────────────
function AppInner() {
  const { user, role, loading } = useAuth();

  // Show a loading spinner while Firebase checks auth state
  if (loading) {
    return (
      <div style={s.loadRoot}>
        <div style={s.spinner} />
        <div style={s.loadText}>Loading...</div>
        <style>{globalStyle}</style>
      </div>
    );
  }

  // Not logged in → show Login page
  if (!user) return <Login />;

  // Logged in as admin → Admin Portal
  if (role === "admin") return <AdminPortal />;

  // Logged in as student → Student Portal
  return <StudentPortal />;
}

// ── Root app — wraps everything in AuthProvider ──────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const globalStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #06090f; }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
`;

const s = {
  loadRoot: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#06090f",
    fontFamily: "'Syne', sans-serif",
    gap: 16,
  },
  spinner: {
    width: 40,
    height: 40,
    border: "3px solid rgba(0,245,160,0.15)",
    borderTop: "3px solid #00f5a0",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.3)",
    fontFamily: "'Space Mono', monospace",
    letterSpacing: 1,
  },
};