import { useState } from "react";
import StudentPortal from "./StudentPortal";
import AdminPortal from "./AdminPortal";
import { DB } from "./db";

export default function App() {
  const [role, setRole] = useState(null); // null | "student" | "admin"

  if (role === "student") return <StudentPortal db={DB} onBack={() => setRole(null)} />;
  if (role === "admin")   return <AdminPortal   db={DB} onBack={() => setRole(null)} />;

  return (
    <div style={s.root}>
      <div style={s.bg} />
      <div style={s.noise} />

      <div style={s.center}>
        <div style={s.logoRow}>
          <div style={s.logoMark}>◈</div>
          <div>
            <div style={s.uni}>{DB.settings.universityName}</div>
            <div style={s.sem}>{DB.settings.semester}</div>
          </div>
        </div>

        <h1 style={s.title}>Course Registration<br /><span style={s.titleAccent}>Portal</span></h1>
        <p style={s.sub}>Select your role to continue</p>

        <div style={s.cards}>
          <button style={s.card} onClick={() => setRole("student")}>
            <div style={s.cardIcon}>🎓</div>
            <div style={s.cardTitle}>Student</div>
            <div style={s.cardDesc}>Browse, enroll & manage your semester courses</div>
            <div style={s.cardArrow}>→</div>
          </button>
          <button style={{ ...s.card, ...s.cardAdmin }} onClick={() => setRole("admin")}>
            <div style={s.cardIcon}>🏛️</div>
            <div style={s.cardTitle}>University Admin</div>
            <div style={s.cardDesc}>Manage courses, staff, seats & registration settings</div>
            <div style={{ ...s.cardArrow, color: "#f5a000" }}>→</div>
          </button>
        </div>

        <div style={s.info}>
          <span>Min Credits Required: <strong style={{ color: "#00f5a0" }}>{DB.settings.minCredits}</strong></span>
          <span style={s.dot}>·</span>
          <span>Max Credits Allowed: <strong style={{ color: "#f5a000" }}>{DB.settings.maxCredits}</strong></span>
          <span style={s.dot}>·</span>
          <span>Registration: <strong style={{ color: DB.settings.registrationOpen ? "#00f5a0" : "#ff5050" }}>
            {DB.settings.registrationOpen ? "OPEN" : "CLOSED"}
          </strong></span>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #06090f; }
        button { cursor: pointer; }
      `}</style>
    </div>
  );
}

const s = {
  root: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", position: "relative", overflow: "hidden", background: "#06090f" },
  bg: { position: "fixed", inset: 0, backgroundImage: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,245,160,0.08) 0%, transparent 70%)", pointerEvents: "none" },
  noise: { position: "fixed", inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")", pointerEvents: "none" },
  center: { position: "relative", zIndex: 10, textAlign: "center", padding: 40, maxWidth: 700, width: "100%" },
  logoRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 48 },
  logoMark: { fontSize: 36, color: "#00f5a0" },
  uni: { fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: 0.5 },
  sem: { fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'Space Mono',monospace", marginTop: 2 },
  title: { fontSize: 56, fontWeight: 800, color: "#e8eaf0", lineHeight: 1.1, marginBottom: 12, letterSpacing: -1.5 },
  titleAccent: { color: "#00f5a0" },
  sub: { fontSize: 15, color: "rgba(255,255,255,0.35)", marginBottom: 48 },
  cards: { display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", marginBottom: 40 },
  card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,245,160,0.15)", borderRadius: 16, padding: "32px 28px", width: 260, textAlign: "left", transition: "all 0.25s", display: "flex", flexDirection: "column", gap: 10, color: "#e8eaf0" },
  cardAdmin: { border: "1px solid rgba(245,160,0,0.2)" },
  cardIcon: { fontSize: 32, marginBottom: 4 },
  cardTitle: { fontSize: 18, fontWeight: 800 },
  cardDesc: { fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.5, flex: 1 },
  cardArrow: { fontSize: 20, color: "#00f5a0", marginTop: 8 },
  info: { fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "'Space Mono',monospace", display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" },
  dot: { color: "rgba(255,255,255,0.15)" },
};