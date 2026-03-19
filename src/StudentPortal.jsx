import { useState } from "react";

const CAT_COLOR = { Core: "#00f5a0", Elective: "#f5a000", Lab: "#a78bfa" };

function Toast({ toast }) {
  if (!toast) return null;
  const bg = toast.type === "error" ? "#ff4040" : toast.type === "warn" ? "#f5a000" : "#00f5a0";
  return <div style={{ ...ts.toast, background: bg, color: "#000" }}>{toast.msg}</div>;
}

export default function StudentPortal({ db, onBack }) {
  const [tick, setTick]     = useState(0);   // force re-render after mutations
  const [view, setView]     = useState("catalog");
  const [search, setSearch] = useState("");
  const [catFilter, setCat] = useState("All");
  const [toast, setToast]   = useState(null);

  const refresh = () => setTick(t => t + 1);

  const student  = db.getStudent(db.currentStudentId);
  const settings = db.settings;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2600);
  };

  const enroll = (courseId) => {
    if (!settings.registrationOpen) { showToast("Registration is currently closed.", "error"); return; }
    const res = db.enrollStudent(student.id, courseId);
    if (res.ok) { showToast("✓ Enrolled successfully!"); refresh(); }
    else         showToast("⚠ " + res.msg, "error");
  };

  const drop = (courseId) => {
    const res = db.dropStudent(student.id, courseId);
    if (res.ok) { showToast("Dropped course.", "warn"); refresh(); }
    else         showToast("⚠ " + res.msg, "error");
  };

  const myRegIds  = student.registrations;
  const myCredits = myRegIds.reduce((s, id) => s + (db.getCourse(id)?.credits || 0), 0);
  const myCourses = myRegIds.map(id => db.getCourse(id)).filter(Boolean);

  const compulsoryIds   = db.courses.filter(c => c.compulsory).map(c => c.id);
  const missingCompulsory = compulsoryIds.filter(id => !myRegIds.includes(id));
  const compulsoryDone  = missingCompulsory.length === 0;
  const creditOk        = myCredits >= settings.minCredits;
  const canFinalize     = compulsoryDone && creditOk;

  const categories = ["All", ...new Set(db.courses.map(c => c.category))];

  const visible = db.courses.filter(c => {
    const q = search.toLowerCase();
    const matchQ = c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || (db.getStaff(c.staffId)?.name || "").toLowerCase().includes(q);
    const matchC = catFilter === "All" || c.category === catFilter;
    return matchQ && matchC;
  });

  return (
    <div style={st.root}>
      <div style={st.gridBg} />
      <Toast toast={toast} />

      {/* Header */}
      <header style={st.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={onBack} style={st.backBtn}>← Portal</button>
          <div>
            <div style={st.portalTitle}>Student Portal</div>
            <div style={st.portalSub}>{student.name} · {student.rollNo} · {student.dept}</div>
          </div>
        </div>

        <div style={st.headerRight}>
          {/* Credit meter */}
          <div style={st.creditBlock}>
            <div style={st.creditNums}>
              <span style={{ color: myCredits >= settings.minCredits ? "#00f5a0" : "#ff5050", fontWeight: 800 }}>{myCredits}</span>
              <span style={st.creditSlash}>/</span>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>{settings.maxCredits} cr</span>
            </div>
            <div style={st.trackWrap}>
              {/* min-credit marker */}
              <div style={{ ...st.minMarker, left: `${(settings.minCredits / settings.maxCredits) * 100}%` }} title={`Min: ${settings.minCredits}`} />
              <div style={st.track}>
                <div style={{ ...st.fill, width: `${Math.min(100, (myCredits / settings.maxCredits) * 100)}%`, background: myCredits > settings.maxCredits - 2 ? "#ff5050" : myCredits >= settings.minCredits ? "#00f5a0" : "#f5a000" }} />
              </div>
            </div>
            <div style={st.creditHint}>
              {myCredits < settings.minCredits ? `Need ${settings.minCredits - myCredits} more credits` : "Credit requirement met ✓"}
            </div>
          </div>

          <div style={st.regStatus}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: settings.registrationOpen ? "#00f5a0" : "#ff5050" }} />
            {settings.registrationOpen ? "Open" : "Closed"}
          </div>
        </div>
      </header>

      {/* Nav */}
      <nav style={st.nav}>
        {["catalog", "my-courses", "status"].map(v => (
          <button key={v} style={{ ...st.navBtn, ...(view === v ? st.navActive : {}) }} onClick={() => setView(v)}>
            {v === "catalog" ? "▤ Catalog" : v === "my-courses" ? `✦ My Courses (${myCourses.length})` : "⬡ Status"}
          </button>
        ))}
      </nav>

      <main style={st.main}>

        {/* ── CATALOG ── */}
        {view === "catalog" && (
          <>
            <div style={st.toolbar}>
              <input style={st.search} placeholder="Search course, code, instructor…" value={search} onChange={e => setSearch(e.target.value)} />
              <div style={st.cats}>
                {categories.map(c => (
                  <button key={c} style={{ ...st.catBtn, ...(catFilter === c ? { background: "#00f5a0", color: "#000" } : {}) }} onClick={() => setCat(c)}>{c}</button>
                ))}
              </div>
            </div>

            {/* Compulsory banner */}
            {missingCompulsory.length > 0 && (
              <div style={st.banner}>
                ⚠ You must enroll in <strong>{missingCompulsory.length}</strong> more compulsory course(s):&nbsp;
                {missingCompulsory.map(id => <span key={id} style={st.chip}>{db.getCourse(id)?.code}</span>)}
              </div>
            )}

            <div style={st.courseGrid}>
              {visible.map(course => {
                const isReg     = myRegIds.includes(course.id);
                const staff     = db.getStaff(course.staffId);
                const seats     = course.totalSeats - course.enrolledSeats;
                const full      = seats <= 0;
                const wouldOver = !isReg && myCredits + course.credits > settings.maxCredits;
                return (
                  <div key={course.id} style={{ ...st.card, ...(isReg ? st.cardEnrolled : {}), ...(course.compulsory ? st.cardCompulsory : {}) }}>
                    <div style={st.cardHead}>
                      <span style={{ ...st.catTag, color: CAT_COLOR[course.category] || "#aaa" }}>● {course.category}</span>
                      {course.compulsory && <span style={st.compTag}>COMPULSORY</span>}
                      <span style={{ ...st.seatsTag, color: seats <= 5 ? "#ff5050" : "rgba(255,255,255,0.3)" }}>{seats} seats</span>
                    </div>
                    <div style={st.code}>{course.code}</div>
                    <div style={st.name}>{course.name}</div>
                    <div style={st.meta}>👤 {staff?.name || "TBA"} · {staff?.designation || ""}</div>
                    <div style={st.meta}>🏫 {course.room} · {course.schedule}</div>
                    <div style={st.meta}>🏢 {course.dept}</div>
                    <div style={st.cardFoot}>
                      <span style={st.creditPill}>{course.credits} cr</span>
                      {isReg
                        ? <button style={st.dropBtn} onClick={() => drop(course.id)}>Drop</button>
                        : full
                        ? <button style={st.disabledBtn} disabled>Full</button>
                        : wouldOver
                        ? <button style={st.disabledBtn} disabled>Over Limit</button>
                        : <button style={st.enrollBtn} onClick={() => enroll(course.id)}>Enroll</button>}
                    </div>
                    {isReg && <div style={st.enrolledBadge}>✓</div>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── MY COURSES ── */}
        {view === "my-courses" && (
          <div>
            <div style={st.myHead}>
              <h2 style={st.myTitle}>My Registered Courses</h2>
              <div style={st.summRow}>
                {[["Courses", myCourses.length], ["Credits", myCredits], ["Remaining", settings.maxCredits - myCredits]].map(([l, v]) => (
                  <div key={l} style={st.summBox}><div style={st.summNum}>{v}</div><div style={st.summLabel}>{l}</div></div>
                ))}
              </div>
            </div>
            {myCourses.length === 0
              ? <div style={st.empty}><div style={{ fontSize: 48, opacity: 0.15 }}>◌</div><div>No courses enrolled yet.</div><button style={st.goBtn} onClick={() => setView("catalog")}>Browse Catalog →</button></div>
              : <div style={st.myList}>
                  {myCourses.map(c => {
                    const staff = db.getStaff(c.staffId);
                    return (
                      <div key={c.id} style={st.myCard}>
                        <div style={{ ...st.myAccent, background: CAT_COLOR[c.category] || "#aaa" }} />
                        <div style={st.myInfo}>
                          <div style={st.myCode}>{c.code} {c.compulsory && <span style={st.compTag}>COMPULSORY</span>}</div>
                          <div style={st.myName}>{c.name}</div>
                          <div style={st.myMeta}>{staff?.name} · {c.room} · {c.schedule}</div>
                        </div>
                        <div style={st.myRight}>
                          <div style={st.myCredits}>{c.credits} cr</div>
                          <button style={st.dropBtn} onClick={() => drop(c.id)}>Drop</button>
                        </div>
                      </div>
                    );
                  })}
                </div>}
          </div>
        )}

        {/* ── STATUS ── */}
        {view === "status" && (
          <div style={st.statusWrap}>
            <h2 style={st.myTitle}>Registration Status</h2>
            <div style={st.statusCards}>
              <div style={{ ...st.statusCard, borderColor: creditOk ? "rgba(0,245,160,0.3)" : "rgba(255,80,80,0.3)" }}>
                <div style={st.statusIcon}>{creditOk ? "✅" : "⏳"}</div>
                <div style={st.statusLabel}>Credit Requirement</div>
                <div style={st.statusVal}>{myCredits} / min {settings.minCredits}</div>
                <div style={st.statusNote}>{creditOk ? "Met" : `Need ${settings.minCredits - myCredits} more credits`}</div>
              </div>
              <div style={{ ...st.statusCard, borderColor: compulsoryDone ? "rgba(0,245,160,0.3)" : "rgba(255,80,80,0.3)" }}>
                <div style={st.statusIcon}>{compulsoryDone ? "✅" : "⚠️"}</div>
                <div style={st.statusLabel}>Compulsory Courses</div>
                <div style={st.statusVal}>{compulsoryIds.length - missingCompulsory.length} / {compulsoryIds.length}</div>
                <div style={st.statusNote}>{compulsoryDone ? "All enrolled" : `Missing: ${missingCompulsory.map(id => db.getCourse(id)?.code).join(", ")}`}</div>
              </div>
              <div style={{ ...st.statusCard, borderColor: canFinalize ? "rgba(0,245,160,0.5)" : "rgba(255,255,255,0.08)" }}>
                <div style={st.statusIcon}>{canFinalize ? "🎉" : "🔒"}</div>
                <div style={st.statusLabel}>Finalization</div>
                <div style={st.statusVal}>{canFinalize ? "Ready" : "Pending"}</div>
                <div style={st.statusNote}>{canFinalize ? "You can finalize registration!" : "Complete the above requirements"}</div>
              </div>
            </div>

            {canFinalize && (
              <button style={st.finalizeBtn} onClick={() => showToast("🎓 Registration finalized! Check your email.", "success")}>
                Finalize Registration
              </button>
            )}

            <div style={st.courseTable}>
              <div style={st.tableHead}>
                {["Code", "Course", "Credits", "Staff", "Schedule", "Status"].map(h => <div key={h} style={st.th}>{h}</div>)}
              </div>
              {myCourses.map(c => (
                <div key={c.id} style={st.tableRow}>
                  <div style={st.td}>{c.code}</div>
                  <div style={{ ...st.td, flex: 2 }}>{c.name}</div>
                  <div style={st.td}>{c.credits}</div>
                  <div style={st.td}>{db.getStaff(c.staffId)?.name || "TBA"}</div>
                  <div style={st.td}>{c.schedule}</div>
                  <div style={{ ...st.td, color: "#00f5a0" }}>Enrolled</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <style>{globalStyle}</style>
    </div>
  );
}

const globalStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #06090f; }
  ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #00f5a0; border-radius: 2px; }
  button { cursor: pointer; font-family: 'Syne', sans-serif; }
  input  { font-family: 'Space Mono', monospace; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
`;

const ts = {
  toast: { position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", padding: "11px 28px", borderRadius: 8, fontWeight: 700, fontSize: 13, zIndex: 9999, animation: "slideDown 0.3s ease", boxShadow: "0 4px 24px rgba(0,0,0,0.5)", fontFamily: "'Syne',sans-serif" },
};

const st = {
  root: { minHeight: "100vh", background: "#06090f", color: "#e8eaf0", fontFamily: "'Syne',sans-serif", position: "relative" },
  gridBg: { position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(0,245,160,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,160,0.03) 1px,transparent 1px)", backgroundSize: "36px 36px", pointerEvents: "none", zIndex: 0 },

  header: { position: "sticky", top: 0, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 36px", borderBottom: "1px solid rgba(0,245,160,0.1)", backdropFilter: "blur(14px)", background: "rgba(6,9,15,0.85)", flexWrap: "wrap", gap: 16 },
  backBtn: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", borderRadius: 6, padding: "6px 12px", fontSize: 12 },
  portalTitle: { fontSize: 16, fontWeight: 800, color: "#e8eaf0" },
  portalSub: { fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'Space Mono',monospace", marginTop: 2 },
  headerRight: { display: "flex", alignItems: "center", gap: 28 },
  creditBlock: { display: "flex", flexDirection: "column", gap: 4, minWidth: 180 },
  creditNums: { fontSize: 18, fontFamily: "'Space Mono',monospace", display: "flex", alignItems: "baseline", gap: 4 },
  creditSlash: { color: "rgba(255,255,255,0.2)" },
  trackWrap: { position: "relative", height: 8 },
  minMarker: { position: "absolute", top: -2, width: 2, height: 12, background: "rgba(255,255,255,0.3)", borderRadius: 1, zIndex: 2 },
  track: { height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden", marginTop: 2 },
  fill: { height: "100%", borderRadius: 3, transition: "width 0.4s ease, background 0.3s" },
  creditHint: { fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'Space Mono',monospace" },
  regStatus: { display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", fontFamily: "'Space Mono',monospace" },

  nav: { position: "relative", zIndex: 10, display: "flex", gap: 4, padding: "14px 36px", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  navBtn: { background: "transparent", border: "1px solid transparent", padding: "8px 18px", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.35)", transition: "all 0.2s" },
  navActive: { background: "rgba(0,245,160,0.07)", border: "1px solid rgba(0,245,160,0.2)", color: "#00f5a0" },

  main: { position: "relative", zIndex: 10, padding: "28px 36px", maxWidth: 1280, margin: "0 auto" },
  toolbar: { display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" },
  search: { flex: 1, minWidth: 200, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 8, padding: "9px 14px", color: "#e8eaf0", fontSize: 13, outline: "none" },
  cats: { display: "flex", gap: 6, flexWrap: "wrap" },
  catBtn: { padding: "7px 14px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.45)", transition: "all 0.2s" },

  banner: { background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.2)", borderRadius: 10, padding: "12px 18px", fontSize: 13, color: "#ff8080", marginBottom: 18, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  chip: { background: "rgba(255,80,80,0.15)", border: "1px solid rgba(255,80,80,0.25)", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontFamily: "'Space Mono',monospace" },

  courseGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 14 },
  card: { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 18, position: "relative", display: "flex", flexDirection: "column", gap: 6, animation: "fadeUp 0.3s ease" },
  cardEnrolled: { background: "rgba(0,245,160,0.03)", border: "1px solid rgba(0,245,160,0.2)" },
  cardCompulsory: { boxShadow: "inset 0 0 0 1px rgba(245,160,0,0.12)" },
  cardHead: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" },
  catTag: { fontSize: 10, fontWeight: 700, fontFamily: "'Space Mono',monospace" },
  compTag: { background: "rgba(245,160,0,0.12)", color: "#f5a000", fontSize: 9, fontWeight: 800, borderRadius: 4, padding: "2px 6px", fontFamily: "'Space Mono',monospace", letterSpacing: 0.5 },
  seatsTag: { marginLeft: "auto", fontSize: 10, fontFamily: "'Space Mono',monospace" },
  code: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", fontFamily: "'Space Mono',monospace", marginTop: 4 },
  name: { fontSize: 15, fontWeight: 700, color: "#e8eaf0", lineHeight: 1.3 },
  meta: { fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.6 },
  cardFoot: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  creditPill: { background: "rgba(255,255,255,0.07)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, fontFamily: "'Space Mono',monospace", color: "rgba(255,255,255,0.5)" },
  enrollBtn: { padding: "7px 18px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: "#00f5a0", color: "#000", border: "none" },
  dropBtn: { padding: "7px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: "rgba(255,80,80,0.1)", color: "#ff6060", border: "1px solid rgba(255,80,80,0.2)" },
  disabledBtn: { padding: "7px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.2)", border: "none", cursor: "not-allowed" },
  enrolledBadge: { position: "absolute", top: 14, right: 14, fontSize: 14, color: "#00f5a0", fontWeight: 800 },

  myHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 },
  myTitle: { fontSize: 20, fontWeight: 800 },
  summRow: { display: "flex", gap: 12 },
  summBox: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 20px", textAlign: "center", minWidth: 80 },
  summNum: { fontSize: 22, fontWeight: 800, color: "#00f5a0", fontFamily: "'Space Mono',monospace" },
  summLabel: { fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 },
  myList: { display: "flex", flexDirection: "column", gap: 10 },
  myCard: { display: "flex", alignItems: "center", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" },
  myAccent: { width: 4, alignSelf: "stretch", flexShrink: 0 },
  myInfo: { flex: 1, padding: "14px 18px" },
  myCode: { fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'Space Mono',monospace", marginBottom: 4, display: "flex", gap: 8, alignItems: "center" },
  myName: { fontSize: 15, fontWeight: 700, marginBottom: 4 },
  myMeta: { fontSize: 11, color: "rgba(255,255,255,0.3)" },
  myRight: { display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", padding: "14px 18px" },
  myCredits: { fontSize: 13, fontWeight: 700, fontFamily: "'Space Mono',monospace", color: "rgba(255,255,255,0.35)" },
  empty: { textAlign: "center", padding: "80px 0", display: "flex", flexDirection: "column", gap: 14, alignItems: "center", color: "rgba(255,255,255,0.25)" },
  goBtn: { background: "#00f5a0", color: "#000", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 700, fontSize: 13 },

  statusWrap: { maxWidth: 900 },
  statusCards: { display: "flex", gap: 16, margin: "24px 0", flexWrap: "wrap" },
  statusCard: { flex: 1, minWidth: 220, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 24, textAlign: "center" },
  statusIcon: { fontSize: 32, marginBottom: 10 },
  statusLabel: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6 },
  statusVal: { fontSize: 22, fontWeight: 800, color: "#e8eaf0", marginBottom: 6, fontFamily: "'Space Mono',monospace" },
  statusNote: { fontSize: 11, color: "rgba(255,255,255,0.3)" },
  finalizeBtn: { background: "linear-gradient(135deg,#00f5a0,#00b4d8)", color: "#000", border: "none", borderRadius: 10, padding: "14px 36px", fontSize: 15, fontWeight: 800, marginBottom: 32, letterSpacing: 0.3 },
  courseTable: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" },
  tableHead: { display: "flex", padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" },
  tableRow: { display: "flex", padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)" },
  th: { flex: 1, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 0.5 },
  td: { flex: 1, fontSize: 12, color: "rgba(255,255,255,0.6)" },
};