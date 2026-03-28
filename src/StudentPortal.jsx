import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { fsdb } from "./firebase";
import {
  collection, doc, getDoc, getDocs, setDoc,
  updateDoc, arrayUnion, arrayRemove, increment,
} from "firebase/firestore";

const CAT_COLOR = { Core: "#00f5a0", Elective: "#f5a000", Lab: "#a78bfa" };

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  const bg = toast.type === "error" ? "#ff4040" : toast.type === "warn" ? "#f5a000" : "#00f5a0";
  return <div style={{ ...ts.toast, background: bg }}>{toast.msg}</div>;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function StudentPortal() {
  const { user, logout } = useAuth();

  const [student,  setStudent]  = useState(null);
  const [courses,  setCourses]  = useState([]);
  const [settings, setSettings] = useState({ minCredits: 12, maxCredits: 22, registrationOpen: true, universityName: "Coimbatore Institute of Technology", semester: "Semester IV · 2025–26" });
  const [loading,  setLoading]  = useState(true);
  const [view,     setView]     = useState("catalog");
  const [search,   setSearch]   = useState("");
  const [catFilter,setCat]      = useState("All");
  const [toast,    setToast]    = useState(null);
  const [busy,     setBusy]     = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  // ── Load data from Firestore ──────────────────────────────────────────────
  const loadData = async () => {
    try {
      // Student
      const studentSnap = await getDoc(doc(fsdb, "users", user.uid));
      if (studentSnap.exists()) {
        setStudent({ id: user.uid, ...studentSnap.data() });
      } else {
        const newStudent = { name: user.displayName, email: user.email, photoURL: user.photoURL, uid: user.uid, dept: "Computer Science", year: 1, registrations: [] };
        await setDoc(doc(fsdb, "users", user.uid), newStudent);
        setStudent({ id: user.uid, ...newStudent });
      }

      // Courses
      const coursesSnap = await getDocs(collection(fsdb, "courses"));
      setCourses(coursesSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Settings
      const settingsSnap = await getDoc(doc(fsdb, "settings", "university"));
      if (settingsSnap.exists()) setSettings(settingsSnap.data());
    } catch (e) {
      console.error("Load error:", e);
      showToast("Failed to load data. Check Firestore.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── Enroll ────────────────────────────────────────────────────────────────
  const enroll = async (course) => {
    if (!settings.registrationOpen) { showToast("Registration is currently closed.", "error"); return; }
    if (student.registrations?.includes(course.id)) { showToast("Already enrolled.", "error"); return; }
    const currentCredits = (student.registrations || []).reduce((s, id) => s + (courses.find(c => c.id === id)?.credits || 0), 0);
    if (currentCredits + course.credits > settings.maxCredits) { showToast(`Exceeds max ${settings.maxCredits} credits.`, "error"); return; }
    if ((course.enrolledSeats || 0) >= course.totalSeats) { showToast("No seats available.", "error"); return; }

    setBusy(course.id);
    try {
      await updateDoc(doc(fsdb, "users", user.uid), { registrations: arrayUnion(course.id) });
      await updateDoc(doc(fsdb, "courses", course.id), { enrolledSeats: increment(1) });
      await loadData();
      showToast(`✓ Enrolled in ${course.code}!`);
    } catch (e) { showToast("Enroll failed. Try again.", "error"); }
    finally { setBusy(false); }
  };

  // ── Drop ──────────────────────────────────────────────────────────────────
  const drop = async (course) => {
    setBusy(course.id);
    try {
      await updateDoc(doc(fsdb, "users", user.uid), { registrations: arrayRemove(course.id) });
      await updateDoc(doc(fsdb, "courses", course.id), { enrolledSeats: increment(-1) });
      await loadData();
      showToast(`Dropped ${course.code}.`, "warn");
    } catch (e) { showToast("Drop failed. Try again.", "error"); }
    finally { setBusy(false); }
  };

  // ── Derived state ─────────────────────────────────────────────────────────
  const myRegIds   = student?.registrations || [];
  const myCourses  = myRegIds.map(id => courses.find(c => c.id === id)).filter(Boolean);
  const myCredits  = myCourses.reduce((s, c) => s + (c?.credits || 0), 0);
  const compulsory = courses.filter(c => c.compulsory);
  const missingComp = compulsory.filter(c => !myRegIds.includes(c.id));
  const creditOk   = myCredits >= settings.minCredits;
  const canFinalize = missingComp.length === 0 && creditOk;
  const categories = ["All", ...new Set(courses.map(c => c.category))];

  const visible = courses.filter(c => {
    const q = search.toLowerCase();
    return (c.name?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q) || c.instructor?.toLowerCase().includes(q)) &&
           (catFilter === "All" || c.category === catFilter);
  });

  if (loading) return (
    <div style={st.loadRoot}>
      <div style={st.spinner} />
      <div style={st.loadText}>Loading your portal...</div>
      <style>{globalStyle}</style>
    </div>
  );

  return (
    <div style={st.root}>
      <div style={st.gridBg} />
      <Toast toast={toast} />

      {/* Header */}
      <header style={st.header}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={st.logoMark}>◈</div>
          <div>
            <div style={st.portalTitle}>Student Portal</div>
            <div style={st.portalSub}>{settings.universityName} · {settings.semester}</div>
          </div>
        </div>

        <div style={st.headerRight}>
          {/* Credit bar */}
          <div style={st.creditBlock}>
            <div style={st.creditNums}>
              <span style={{ color: myCredits >= settings.minCredits ? "#00f5a0" : "#ff6060", fontWeight:800 }}>{myCredits}</span>
              <span style={{ color:"rgba(255,255,255,0.2)" }}>/</span>
              <span style={{ color:"rgba(255,255,255,0.35)" }}>{settings.maxCredits} cr</span>
            </div>
            <div style={st.trackWrap}>
              <div style={{ ...st.minMarker, left:`${(settings.minCredits / settings.maxCredits) * 100}%` }} title={`Min: ${settings.minCredits} cr`} />
              <div style={st.track}>
                <div style={{ ...st.fill, width:`${Math.min(100,(myCredits/settings.maxCredits)*100)}%`, background: myCredits >= settings.minCredits ? "#00f5a0" : "#f5a000" }} />
              </div>
            </div>
            <div style={st.creditHint}>{myCredits < settings.minCredits ? `Need ${settings.minCredits - myCredits} more credits` : "Credit req. met ✓"}</div>
          </div>

          {/* User */}
          <div style={st.userRow}>
            {user.photoURL
              ? <img src={user.photoURL} style={st.avatar} alt="avatar" referrerPolicy="no-referrer" />
              : <div style={st.avatarFallback}>{user.displayName?.[0]}</div>}
            <div>
              <div style={st.userName}>{user.displayName}</div>
              <div style={st.userEmail}>{user.email}</div>
            </div>
          </div>

          <button style={st.logoutBtn} onClick={logout}>Sign out</button>
        </div>
      </header>

      {/* Nav */}
      <nav style={st.nav}>
        {[["catalog","▤ Catalog"], ["my-courses",`✦ My Courses (${myCourses.length})`], ["status","⬡ Status"]].map(([v,label]) => (
          <button key={v} style={{ ...st.navBtn, ...(view===v ? st.navActive:{}) }} onClick={() => setView(v)}>{label}</button>
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
                  <button key={c} style={{ ...st.catBtn, ...(catFilter===c ? { background:"#00f5a0", color:"#000" }:{}) }} onClick={() => setCat(c)}>{c}</button>
                ))}
              </div>
            </div>

            {missingComp.length > 0 && (
              <div style={st.banner}>
                ⚠ Compulsory courses not yet enrolled:&nbsp;
                {missingComp.map(c => <span key={c.id} style={st.chip}>{c.code}</span>)}
              </div>
            )}

            {courses.length === 0 && (
              <div style={st.emptyState}>
                <div style={{ fontSize:40, opacity:0.15 }}>◌</div>
                <div>No courses found in Firestore.</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.25)", marginTop:6 }}>Ask your admin to add courses from the Admin Portal.</div>
              </div>
            )}

            <div style={st.courseGrid}>
              {visible.map(course => {
                const isReg    = myRegIds.includes(course.id);
                const seats    = (course.totalSeats || 0) - (course.enrolledSeats || 0);
                const full     = seats <= 0;
                const currentCredits = myCourses.reduce((s,c) => s+(c?.credits||0),0);
                const wouldOver = !isReg && currentCredits + course.credits > settings.maxCredits;
                const isBusy   = busy === course.id;
                return (
                  <div key={course.id} style={{ ...st.card, ...(isReg ? st.cardEnrolled:{}), ...(course.compulsory ? st.cardCompulsory:{}) }}>
                    <div style={st.cardHead}>
                      <span style={{ ...st.catTag, color: CAT_COLOR[course.category]||"#aaa" }}>● {course.category}</span>
                      {course.compulsory && <span style={st.compTag}>COMPULSORY</span>}
                      <span style={{ ...st.seatsTag, color: seats<=5?"#ff6060":"rgba(255,255,255,0.25)" }}>{seats} seats</span>
                    </div>
                    <div style={st.code}>{course.code}</div>
                    <div style={st.name}>{course.name}</div>
                    {course.instructor && <div style={st.meta}>👤 {course.instructor}</div>}
                    {course.room     && <div style={st.meta}>🏫 {course.room}{course.schedule ? ` · ${course.schedule}` : ""}</div>}
                    {course.dept     && <div style={st.meta}>🏢 {course.dept}</div>}
                    <div style={st.cardFoot}>
                      <span style={st.creditPill}>{course.credits} cr</span>
                      {isBusy
                        ? <button style={st.busyBtn} disabled>...</button>
                        : isReg
                        ? <button style={st.dropBtn} onClick={() => drop(course)}>Drop</button>
                        : full
                        ? <button style={st.disabledBtn} disabled>Full</button>
                        : wouldOver
                        ? <button style={st.disabledBtn} disabled>Over Limit</button>
                        : <button style={st.enrollBtn} onClick={() => enroll(course)}>Enroll</button>}
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
                {[["Courses", myCourses.length], ["Credits", myCredits], ["Remaining", settings.maxCredits - myCredits]].map(([l,v]) => (
                  <div key={l} style={st.summBox}><div style={st.summNum}>{v}</div><div style={st.summLabel}>{l}</div></div>
                ))}
              </div>
            </div>
            {myCourses.length === 0
              ? <div style={st.emptyState}><div style={{ fontSize:48, opacity:0.1 }}>◌</div><div>No courses enrolled yet.</div><button style={st.goBtn} onClick={() => setView("catalog")}>Browse Catalog →</button></div>
              : <div style={st.myList}>
                  {myCourses.map(c => (
                    <div key={c.id} style={st.myCard}>
                      <div style={{ ...st.myAccent, background: CAT_COLOR[c.category]||"#aaa" }} />
                      <div style={st.myInfo}>
                        <div style={st.myCode}>{c.code} {c.compulsory && <span style={st.compTag}>COMPULSORY</span>}</div>
                        <div style={st.myName}>{c.name}</div>
                        <div style={st.myMeta}>{c.instructor && `${c.instructor} · `}{c.room}{c.schedule && ` · ${c.schedule}`}</div>
                      </div>
                      <div style={st.myRight}>
                        <div style={st.myCredits}>{c.credits} cr</div>
                        <button style={st.dropBtn} onClick={() => drop(c)}>Drop</button>
                      </div>
                    </div>
                  ))}
                </div>}
          </div>
        )}

        {/* ── STATUS ── */}
        {view === "status" && (
          <div style={{ maxWidth:860 }}>
            <h2 style={st.myTitle}>Registration Status</h2>
            <div style={st.statusCards}>
              {[
                { icon: creditOk?"✅":"⏳",    label:"Credit Requirement", val:`${myCredits} / min ${settings.minCredits}`, note: creditOk?"Met":"Need "+(settings.minCredits-myCredits)+" more", ok:creditOk },
                { icon: missingComp.length===0?"✅":"⚠️", label:"Compulsory Courses", val:`${compulsory.length-missingComp.length} / ${compulsory.length}`, note: missingComp.length===0?"All enrolled":"Missing: "+missingComp.map(c=>c.code).join(", "), ok:missingComp.length===0 },
                { icon: canFinalize?"🎉":"🔒",  label:"Finalization",       val: canFinalize?"Ready":"Pending", note: canFinalize?"You can finalize!":"Complete above", ok:canFinalize },
              ].map(item => (
                <div key={item.label} style={{ ...st.statusCard, borderColor: item.ok?"rgba(0,245,160,0.25)":"rgba(255,255,255,0.07)" }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>{item.icon}</div>
                  <div style={st.statusLabel}>{item.label}</div>
                  <div style={st.statusVal}>{item.val}</div>
                  <div style={st.statusNote}>{item.note}</div>
                </div>
              ))}
            </div>

            {canFinalize && (
              <button style={st.finalizeBtn} onClick={() => showToast("🎓 Registration finalized! Check your email.", "success")}>
                Finalize Registration
              </button>
            )}

            <div style={st.tableWrap}>
              <div style={st.tHead}>
                {["Code","Course","Credits","Schedule","Status"].map(h => <div key={h} style={st.th}>{h}</div>)}
              </div>
              {myCourses.length === 0
                ? <div style={{ padding:"24px", color:"rgba(255,255,255,0.2)", fontSize:13 }}>No courses enrolled.</div>
                : myCourses.map(c => (
                    <div key={c.id} style={st.tRow}>
                      <div style={st.td}><span style={{ fontFamily:"'Space Mono',monospace", fontSize:11 }}>{c.code}</span></div>
                      <div style={{ ...st.td, flex:2 }}>{c.name}</div>
                      <div style={st.td}>{c.credits}</div>
                      <div style={st.td}>{c.schedule || "—"}</div>
                      <div style={{ ...st.td, color:"#00f5a0" }}>Enrolled</div>
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
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:#06090f; }
  ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-thumb { background:#00f5a0; border-radius:2px; }
  button { cursor:pointer; font-family:'Syne',sans-serif; }
  input  { font-family:'Space Mono',monospace; }
  @keyframes spin    { to { transform:rotate(360deg); } }
  @keyframes fadeUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
`;

const ts = {
  toast: { position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", padding:"11px 28px", borderRadius:8, fontWeight:700, fontSize:13, zIndex:9999, animation:"slideDown 0.3s ease", boxShadow:"0 4px 24px rgba(0,0,0,0.5)", fontFamily:"'Syne',sans-serif", color:"#000" },
};

const st = {
  root:     { minHeight:"100vh", background:"#06090f", color:"#e8eaf0", fontFamily:"'Syne',sans-serif", position:"relative" },
  gridBg:   { position:"fixed", inset:0, backgroundImage:"linear-gradient(rgba(0,245,160,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,160,0.025) 1px,transparent 1px)", backgroundSize:"36px 36px", pointerEvents:"none", zIndex:0 },
  loadRoot: { minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#06090f", gap:14, fontFamily:"'Syne',sans-serif" },
  spinner:  { width:36, height:36, border:"3px solid rgba(0,245,160,0.12)", borderTop:"3px solid #00f5a0", borderRadius:"50%", animation:"spin 0.75s linear infinite" },
  loadText: { fontSize:12, color:"rgba(255,255,255,0.25)", fontFamily:"'Space Mono',monospace" },

  header:      { position:"sticky", top:0, zIndex:100, display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 32px", borderBottom:"1px solid rgba(0,245,160,0.08)", backdropFilter:"blur(14px)", background:"rgba(6,9,15,0.88)", flexWrap:"wrap", gap:12 },
  logoMark:    { fontSize:24, color:"#00f5a0", fontWeight:800 },
  portalTitle: { fontSize:15, fontWeight:800 },
  portalSub:   { fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:"'Space Mono',monospace", marginTop:2 },
  headerRight: { display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" },
  creditBlock: { display:"flex", flexDirection:"column", gap:4, minWidth:160 },
  creditNums:  { fontSize:17, fontFamily:"'Space Mono',monospace", display:"flex", gap:4, alignItems:"baseline" },
  trackWrap:   { position:"relative", height:8 },
  minMarker:   { position:"absolute", top:-2, width:2, height:12, background:"rgba(255,255,255,0.25)", borderRadius:1, zIndex:2 },
  track:       { height:4, background:"rgba(255,255,255,0.06)", borderRadius:2, overflow:"hidden", marginTop:2 },
  fill:        { height:"100%", borderRadius:2, transition:"width 0.4s ease" },
  creditHint:  { fontSize:10, color:"rgba(255,255,255,0.28)", fontFamily:"'Space Mono',monospace" },
  userRow:     { display:"flex", alignItems:"center", gap:10 },
  avatar:      { width:34, height:34, borderRadius:"50%", objectFit:"cover" },
  avatarFallback:{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#00f5a0,#00b4d8)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#000", fontSize:14 },
  userName:    { fontSize:13, fontWeight:700 },
  userEmail:   { fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:"'Space Mono',monospace" },
  logoutBtn:   { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)", borderRadius:6, padding:"6px 14px", fontSize:12, fontWeight:600 },

  nav:      { position:"relative", zIndex:10, display:"flex", gap:4, padding:"12px 32px", borderBottom:"1px solid rgba(255,255,255,0.05)" },
  navBtn:   { background:"transparent", border:"1px solid transparent", padding:"7px 16px", borderRadius:6, fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.35)", transition:"all 0.2s" },
  navActive:{ background:"rgba(0,245,160,0.07)", border:"1px solid rgba(0,245,160,0.18)", color:"#00f5a0" },

  main:     { position:"relative", zIndex:10, padding:"24px 32px", maxWidth:1280, margin:"0 auto" },
  toolbar:  { display:"flex", gap:12, marginBottom:18, flexWrap:"wrap" },
  search:   { flex:1, minWidth:200, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"9px 14px", color:"#e8eaf0", fontSize:13, outline:"none" },
  cats:     { display:"flex", gap:6, flexWrap:"wrap" },
  catBtn:   { padding:"7px 13px", borderRadius:6, fontSize:11, fontWeight:700, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.4)", transition:"all 0.2s" },
  banner:   { background:"rgba(255,80,80,0.06)", border:"1px solid rgba(255,80,80,0.18)", borderRadius:10, padding:"11px 16px", fontSize:13, color:"#ff8080", marginBottom:16, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" },
  chip:     { background:"rgba(255,80,80,0.12)", borderRadius:4, padding:"2px 8px", fontSize:11, fontFamily:"'Space Mono',monospace" },
  emptyState:{ textAlign:"center", padding:"60px 0", display:"flex", flexDirection:"column", gap:12, alignItems:"center", color:"rgba(255,255,255,0.22)" },

  courseGrid:    { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(265px,1fr))", gap:14 },
  card:          { background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:18, position:"relative", display:"flex", flexDirection:"column", gap:5, animation:"fadeUp 0.3s ease" },
  cardEnrolled:  { background:"rgba(0,245,160,0.03)", border:"1px solid rgba(0,245,160,0.18)" },
  cardCompulsory:{ boxShadow:"inset 0 0 0 1px rgba(245,160,0,0.1)" },
  cardHead:      { display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", marginBottom:4 },
  catTag:        { fontSize:10, fontWeight:700, fontFamily:"'Space Mono',monospace" },
  compTag:       { background:"rgba(245,160,0,0.1)", color:"#f5a000", fontSize:9, fontWeight:800, borderRadius:4, padding:"2px 6px", fontFamily:"'Space Mono',monospace" },
  seatsTag:      { marginLeft:"auto", fontSize:10, fontFamily:"'Space Mono',monospace" },
  code:          { fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.28)", fontFamily:"'Space Mono',monospace" },
  name:          { fontSize:15, fontWeight:700, lineHeight:1.3 },
  meta:          { fontSize:11, color:"rgba(255,255,255,0.3)" },
  cardFoot:      { display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 },
  creditPill:    { background:"rgba(255,255,255,0.06)", borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:700, fontFamily:"'Space Mono',monospace", color:"rgba(255,255,255,0.4)" },
  enrollBtn:     { padding:"7px 18px", borderRadius:6, fontSize:12, fontWeight:700, background:"#00f5a0", color:"#000", border:"none" },
  dropBtn:       { padding:"7px 16px", borderRadius:6, fontSize:12, fontWeight:700, background:"rgba(255,80,80,0.09)", color:"#ff6060", border:"1px solid rgba(255,80,80,0.18)" },
  disabledBtn:   { padding:"7px 16px", borderRadius:6, fontSize:12, fontWeight:700, background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.18)", border:"none", cursor:"not-allowed" },
  busyBtn:       { padding:"7px 16px", borderRadius:6, fontSize:12, fontWeight:700, background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.3)", border:"none", cursor:"wait" },
  enrolledBadge: { position:"absolute", top:14, right:14, fontSize:13, color:"#00f5a0", fontWeight:800 },

  myHead:   { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22, flexWrap:"wrap", gap:14 },
  myTitle:  { fontSize:20, fontWeight:800 },
  summRow:  { display:"flex", gap:12 },
  summBox:  { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"12px 18px", textAlign:"center" },
  summNum:  { fontSize:22, fontWeight:800, color:"#00f5a0", fontFamily:"'Space Mono',monospace" },
  summLabel:{ fontSize:10, color:"rgba(255,255,255,0.28)", marginTop:2 },
  myList:   { display:"flex", flexDirection:"column", gap:10 },
  myCard:   { display:"flex", alignItems:"center", background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden" },
  myAccent: { width:4, alignSelf:"stretch", flexShrink:0 },
  myInfo:   { flex:1, padding:"14px 18px" },
  myCode:   { fontSize:11, color:"rgba(255,255,255,0.28)", fontFamily:"'Space Mono',monospace", marginBottom:4, display:"flex", gap:8, alignItems:"center" },
  myName:   { fontSize:14, fontWeight:700, marginBottom:3 },
  myMeta:   { fontSize:11, color:"rgba(255,255,255,0.28)" },
  myRight:  { display:"flex", flexDirection:"column", gap:8, alignItems:"flex-end", padding:"14px 18px" },
  myCredits:{ fontSize:13, fontWeight:700, fontFamily:"'Space Mono',monospace", color:"rgba(255,255,255,0.35)" },
  goBtn:    { background:"#00f5a0", color:"#000", border:"none", borderRadius:8, padding:"10px 22px", fontWeight:700, fontSize:13 },

  statusCards:  { display:"flex", gap:14, margin:"22px 0", flexWrap:"wrap" },
  statusCard:   { flex:1, minWidth:200, background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:22, textAlign:"center" },
  statusLabel:  { fontSize:11, color:"rgba(255,255,255,0.35)", marginBottom:6 },
  statusVal:    { fontSize:20, fontWeight:800, fontFamily:"'Space Mono',monospace", marginBottom:6 },
  statusNote:   { fontSize:11, color:"rgba(255,255,255,0.28)" },
  finalizeBtn:  { background:"linear-gradient(135deg,#00f5a0,#00b4d8)", color:"#000", border:"none", borderRadius:10, padding:"13px 32px", fontSize:14, fontWeight:800, marginBottom:28 },
  tableWrap:    { background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, overflow:"hidden" },
  tHead:        { display:"flex", padding:"11px 18px", borderBottom:"1px solid rgba(255,255,255,0.06)", background:"rgba(255,255,255,0.02)" },
  tRow:         { display:"flex", padding:"11px 18px", borderBottom:"1px solid rgba(255,255,255,0.04)" },
  th:           { flex:1, fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.28)", textTransform:"uppercase", letterSpacing:0.5 },
  td:           { flex:1, fontSize:12, color:"rgba(255,255,255,0.55)" },
};