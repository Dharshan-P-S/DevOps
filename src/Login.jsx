import { useState } from "react";
import { useAuth } from "./AuthContext";

export default function Login() {
  const { loginWithGoogle } = useAuth();
  const [view,  setView]  = useState("home"); // "home" | "student" | "admin"
  const [error, setError] = useState("");
  const [busy,  setBusy]  = useState(false);

  const handleGoogle = async () => {
    try {
      setBusy(true);
      setError("");
      await loginWithGoogle();
    } catch (e) {
      console.error("Login error:", e);
      setError(e.code ? `${e.code}: ${e.message}` : "Login failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={s.root}>
      <div style={s.bgGlow} />
      <div style={s.grid} />

      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoRow}>
          <span style={s.logoMark}>◈</span>
          <div>
            <div style={s.logoText}>EduReg</div>
            <div style={s.uniName}>Coimbatore Institute of Technology</div>
          </div>
        </div>

        {/* Home — pick role */}
        {view === "home" && (
          <>
            <h1 style={s.title}>Welcome Back</h1>
            <p style={s.sub}>Select your role to sign in</p>
            <div style={s.roleRow}>
              <button style={s.roleCard} onClick={() => setView("student")}>
                <div style={s.roleIcon}>🎓</div>
                <div style={s.roleLabel}>Student</div>
                <div style={s.roleHint}>Register & manage courses</div>
              </button>
              <button style={{ ...s.roleCard, ...s.roleCardAdmin }} onClick={() => setView("admin")}>
                <div style={s.roleIcon}>🏛️</div>
                <div style={s.roleLabel}>Admin</div>
                <div style={s.roleHint}>Manage university data</div>
              </button>
            </div>
          </>
        )}

        {/* Student login */}
        {view === "student" && (
          <>
            <button style={s.back} onClick={() => { setView("home"); setError(""); }}>← Back</button>
            <div style={s.roleIconBig}>🎓</div>
            <h1 style={s.title}>Student Login</h1>
            <p style={s.sub}>Sign in with your university Google account</p>
            <button style={{ ...s.googleBtn, ...(busy ? s.btnBusy : {}) }} onClick={handleGoogle} disabled={busy}>
              {busy
                ? <span style={s.spinner} />
                : <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={20} height={20} alt="G" />}
              {busy ? "Signing in..." : "Continue with Google"}
            </button>
            {error && <div style={s.errorBox}>{error}</div>}
          </>
        )}

        {/* Admin login */}
        {view === "admin" && (
          <>
            <button style={s.back} onClick={() => { setView("home"); setError(""); }}>← Back</button>
            <div style={s.roleIconBig}>🏛️</div>
            <h1 style={s.title}>Admin Login</h1>
            <p style={s.sub}>Sign in with your authorized admin Google account</p>
            <button style={{ ...s.googleBtn, ...s.googleBtnAdmin, ...(busy ? s.btnBusy : {}) }} onClick={handleGoogle} disabled={busy}>
              {busy
                ? <span style={{ ...s.spinner, borderTopColor: "#f5a000" }} />
                : <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={20} height={20} alt="G" />}
              {busy ? "Signing in..." : "Continue with Google"}
            </button>
            <p style={s.adminHint}>⚠ Only pre-authorized admin emails can access the admin panel.</p>
            {error && <div style={s.errorBox}>{error}</div>}
          </>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background:#06090f; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        button { cursor:pointer; font-family:'Syne',sans-serif; }
      `}</style>
    </div>
  );
}

const s = {
  root:          { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#06090f", fontFamily:"'Syne',sans-serif", position:"relative", overflow:"hidden" },
  bgGlow:        { position:"fixed", inset:0, backgroundImage:"radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,245,160,0.09) 0%, transparent 70%)", pointerEvents:"none" },
  grid:          { position:"fixed", inset:0, backgroundImage:"linear-gradient(rgba(0,245,160,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,160,0.03) 1px,transparent 1px)", backgroundSize:"36px 36px", pointerEvents:"none" },
  card:          { position:"relative", zIndex:10, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding:"44px 40px", width:"100%", maxWidth:440, display:"flex", flexDirection:"column", gap:18, animation:"fadeUp 0.4s ease" },
  logoRow:       { display:"flex", alignItems:"center", gap:12 },
  logoMark:      { fontSize:28, color:"#00f5a0" },
  logoText:      { fontSize:18, fontWeight:800, color:"#e8eaf0" },
  uniName:       { fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:"'Space Mono',monospace", marginTop:2 },
  title:         { fontSize:26, fontWeight:800, color:"#e8eaf0", lineHeight:1.2 },
  sub:           { fontSize:13, color:"rgba(255,255,255,0.4)", lineHeight:1.6 },
  roleRow:       { display:"flex", gap:12 },
  roleCard:      { flex:1, background:"rgba(0,245,160,0.04)", border:"1px solid rgba(0,245,160,0.18)", borderRadius:14, padding:"22px 16px", display:"flex", flexDirection:"column", alignItems:"center", gap:8, color:"#e8eaf0", transition:"all 0.2s" },
  roleCardAdmin: { background:"rgba(245,160,0,0.04)", border:"1px solid rgba(245,160,0,0.18)" },
  roleIcon:      { fontSize:30 },
  roleLabel:     { fontSize:15, fontWeight:800 },
  roleHint:      { fontSize:11, color:"rgba(255,255,255,0.3)", textAlign:"center" },
  roleIconBig:   { fontSize:44, textAlign:"center" },
  googleBtn:     { display:"flex", alignItems:"center", justifyContent:"center", gap:10, background:"rgba(0,245,160,0.08)", border:"1px solid rgba(0,245,160,0.25)", borderRadius:10, padding:"13px 20px", color:"#00f5a0", fontSize:14, fontWeight:700, transition:"all 0.2s" },
  googleBtnAdmin:{ background:"rgba(245,160,0,0.08)", border:"1px solid rgba(245,160,0,0.25)", color:"#f5a000" },
  btnBusy:       { opacity:0.6, cursor:"not-allowed" },
  spinner:       { width:18, height:18, border:"2px solid rgba(0,245,160,0.2)", borderTop:"2px solid #00f5a0", borderRadius:"50%", animation:"spin 0.7s linear infinite", flexShrink:0 },
  back:          { background:"none", border:"none", color:"rgba(255,255,255,0.35)", fontSize:13, textAlign:"left", padding:0 },
  adminHint:     { fontSize:11, color:"rgba(255,255,255,0.25)", lineHeight:1.6 },
  errorBox:      { background:"rgba(255,60,60,0.08)", border:"1px solid rgba(255,60,60,0.2)", borderRadius:8, padding:"10px 14px", color:"#ff7070", fontSize:12, lineHeight:1.6 },
};