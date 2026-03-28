import { useState } from "react";
import { useAuth } from "./AuthContext";

export default function Login() {
  const { loginWithGoogle } = useAuth();
  const [view, setView]     = useState("home"); // home | student | admin
  const [error, setError]   = useState("");

  const handleGoogle = async () => {
    try {
      setError("");
      await loginWithGoogle();
    } catch (e) {
      setError("Login failed. Try again.");
    }
  };

  return (
    <div style={s.root}>
      <div style={s.bg} />
      <div style={s.box}>
        <div style={s.logo}>◈ EduReg</div>
        <div style={s.uni}>Coimbatore Institute of Technology</div>

        {view === "home" && (
          <>
            <h1 style={s.title}>Welcome Back</h1>
            <p style={s.sub}>Select your role to sign in</p>
            <div style={s.roleCards}>
              <button style={s.roleCard} onClick={() => setView("student")}>
                <span style={s.roleIcon}>🎓</span>
                <span style={s.roleLabel}>Student</span>
              </button>
              <button style={{ ...s.roleCard, borderColor: "rgba(245,160,0,0.3)" }} onClick={() => setView("admin")}>
                <span style={s.roleIcon}>🏛️</span>
                <span style={s.roleLabel}>Admin</span>
              </button>
            </div>
          </>
        )}

        {view === "student" && (
          <>
            <button style={s.back} onClick={() => setView("home")}>← Back</button>
            <h1 style={s.title}>Student Login</h1>
            <p style={s.sub}>Sign in with your university Google account</p>
            <button style={s.googleBtn} onClick={handleGoogle}>
              <img src="https://www.google.com/favicon.ico" width={18} height={18} alt="G" />
              Continue with Google
            </button>
            {error && <div style={s.error}>{error}</div>}
          </>
        )}

        {view === "admin" && (
          <>
            <button style={s.back} onClick={() => setView("home")}>← Back</button>
            <h1 style={s.title}>Admin Login</h1>
            <p style={s.sub}>Sign in with your admin Google account</p>
            <button style={{ ...s.googleBtn, background: "rgba(245,160,0,0.1)", borderColor: "rgba(245,160,0,0.3)", color: "#f5a000" }} onClick={handleGoogle}>
              <img src="https://www.google.com/favicon.ico" width={18} height={18} alt="G" />
              Continue with Google
            </button>
            <p style={s.hint}>Only authorized admin emails can access the admin panel.</p>
            {error && <div style={s.error}>{error}</div>}
          </>
        )}
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap'); * { box-sizing:border-box; margin:0; padding:0; } body { background:#06090f; }`}</style>
    </div>
  );
}

const s = {
  root:      { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Syne',sans-serif", background:"#06090f", position:"relative" },
  bg:        { position:"fixed", inset:0, backgroundImage:"radial-gradient(ellipse 80% 60% at 50% 0%,rgba(0,245,160,0.07) 0%,transparent 70%)", pointerEvents:"none" },
  box:       { position:"relative", zIndex:10, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding:"48px 40px", width:"100%", maxWidth:420, textAlign:"center", display:"flex", flexDirection:"column", gap:16 },
  logo:      { fontSize:24, fontWeight:800, color:"#00f5a0" },
  uni:       { fontSize:12, color:"rgba(255,255,255,0.3)" },
  title:     { fontSize:28, fontWeight:800, color:"#e8eaf0" },
  sub:       { fontSize:13, color:"rgba(255,255,255,0.4)" },
  roleCards: { display:"flex", gap:12, justifyContent:"center", marginTop:8 },
  roleCard:  { flex:1, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(0,245,160,0.2)", borderRadius:12, padding:"20px 16px", cursor:"pointer", display:"flex", flexDirection:"column", gap:8, alignItems:"center", color:"#e8eaf0" },
  roleIcon:  { fontSize:28 },
  roleLabel: { fontSize:14, fontWeight:700 },
  googleBtn: { display:"flex", alignItems:"center", justifyContent:"center", gap:10, background:"rgba(0,245,160,0.08)", border:"1px solid rgba(0,245,160,0.25)", borderRadius:10, padding:"13px 24px", color:"#00f5a0", fontSize:14, fontWeight:700, cursor:"pointer", marginTop:8 },
  back:      { background:"none", border:"none", color:"rgba(255,255,255,0.4)", fontSize:13, cursor:"pointer", textAlign:"left", fontFamily:"'Syne',sans-serif" },
  hint:      { fontSize:11, color:"rgba(255,255,255,0.25)", marginTop:4 },
  error:     { background:"rgba(255,60,60,0.1)", border:"1px solid rgba(255,60,60,0.2)", borderRadius:8, padding:"10px", color:"#ff6060", fontSize:13 },
};