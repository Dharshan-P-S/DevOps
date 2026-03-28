import { useAuth, AuthProvider } from "./AuthContext";
import Login         from "./Login";
import StudentPortal from "./StudentPortal";
import AdminPortal   from "./AdminPortal";

function AppInner() {
  const { user, role, loading } = useAuth();

  if (loading) return (
    <div style={s.loadRoot}>
      <div style={s.spinner} />
      <div style={s.loadText}>Authenticating...</div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Mono&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background:#06090f; }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );

  if (!user)            return <Login />;
  if (role === "admin") return <AdminPortal />;
  return <StudentPortal />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

const s = {
  loadRoot:  { minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#06090f", fontFamily:"'Syne',sans-serif", gap:16 },
  spinner:   { width:36, height:36, border:"3px solid rgba(0,245,160,0.12)", borderTop:"3px solid #00f5a0", borderRadius:"50%", animation:"spin 0.75s linear infinite" },
  loadText:  { fontSize:12, color:"rgba(255,255,255,0.25)", fontFamily:"'Space Mono',monospace", letterSpacing:1 },
};