import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { fsdb } from "./firebase";
import {
  collection, doc, getDoc, getDocs, setDoc,
  addDoc, updateDoc, deleteDoc, serverTimestamp,
} from "firebase/firestore";

const CAT_COLOR = { Core:"#00f5a0", Elective:"#f5a000", Lab:"#a78bfa" };

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  const bg = toast.type==="error"?"#ff4040":toast.type==="warn"?"#f5a000":"#00f5a0";
  return <div style={{ ...ad.toast, background:bg, color:"#000" }}>{toast.msg}</div>;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={ad.overlay}>
      <div style={ad.modal}>
        <div style={ad.modalHead}>
          <span style={ad.modalTitle}>{title}</span>
          <button onClick={onClose} style={ad.closeBtn}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={ad.field}>
      <label style={ad.label}>{label}</label>
      {children}
      {hint && <div style={ad.hint}>{hint}</div>}
    </div>
  );
}

const BLANK_COURSE = { code:"", name:"", credits:3, instructor:"", dept:"Computer Science", category:"Core", totalSeats:40, schedule:"", room:"", compulsory:false };
const DEPARTMENTS  = ["Computer Science","Mathematics","Electronics","Physics","Management"];
const CATEGORIES   = ["Core","Elective","Lab"];
const DEF_SETTINGS = { universityName:"Coimbatore Institute of Technology", semester:"Semester IV · 2025–26", minCredits:12, maxCredits:22, registrationOpen:true };

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminPortal() {
  const { user, logout } = useAuth();

  const [courses,     setCourses]     = useState([]);
  const [students,    setStudents]    = useState([]);
  const [settings,    setSettings]    = useState(DEF_SETTINGS);
  const [settingsForm,setSettingsForm]= useState(DEF_SETTINGS);
  const [loading,     setLoading]     = useState(true);
  const [view,        setView]        = useState("dashboard");
  const [toast,       setToast]       = useState(null);
  const [courseModal, setCM]          = useState(null); // null | { mode:"add"|"edit", data }
  const [confirmDel,  setConfirmDel]  = useState(null); // null | { type:"course"|"student", id, name }

  const showToast = (msg, type="success") => { setToast({ msg, type }); setTimeout(()=>setToast(null),2800); };

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadData = async () => {
    try {
      const [coursesSnap, studentsSnap, settingsSnap] = await Promise.all([
        getDocs(collection(fsdb,"courses")),
        getDocs(collection(fsdb,"users")),
        getDoc(doc(fsdb,"settings","university")),
      ]);
      setCourses(coursesSnap.docs.map(d=>({ id:d.id,...d.data() })));
      setStudents(studentsSnap.docs.map(d=>({ id:d.id,...d.data() })));
      if (settingsSnap.exists()) {
        const s = settingsSnap.data();
        setSettings(s);
        setSettingsForm(s);
      }
    } catch(e) { console.error(e); showToast("Failed to load data.","error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  // ── Course CRUD ───────────────────────────────────────────────────────────
  const openAddCourse  = () => setCM({ mode:"add",  data:{ ...BLANK_COURSE } });
  const openEditCourse = (c)  => setCM({ mode:"edit", data:{ ...c } });

  const saveCourse = async () => {
    const d = courseModal.data;
    if (!d.code || !d.name) { showToast("Code and Name are required.","error"); return; }
    try {
      if (courseModal.mode==="add") {
        await addDoc(collection(fsdb,"courses"), { ...d, enrolledSeats:0, createdAt:serverTimestamp() });
        showToast("Course added!");
      } else {
        const { id, ...rest } = d;
        await updateDoc(doc(fsdb,"courses",id), rest);
        showToast("Course updated!");
      }
      setCM(null);
      loadData();
    } catch(e) { showToast("Save failed: "+e.message,"error"); }
  };

  const deleteCourse = async (id) => {
    try {
      await deleteDoc(doc(fsdb,"courses",id));
      showToast("Course deleted.","warn");
      setConfirmDel(null);
      loadData();
    } catch(e) { showToast("Delete failed.","error"); }
  };

  // ── Settings ──────────────────────────────────────────────────────────────
  const saveSettings = async () => {
    try {
      const data = { ...settingsForm, minCredits:Number(settingsForm.minCredits), maxCredits:Number(settingsForm.maxCredits) };
      await setDoc(doc(fsdb,"settings","university"), data);
      setSettings(data);
      showToast("Settings saved!");
    } catch(e) { showToast("Save failed.","error"); }
  };

  const toggleRegistration = async () => {
    const newVal = !settings.registrationOpen;
    try {
      await updateDoc(doc(fsdb,"settings","university"), { registrationOpen:newVal });
      setSettings(s=>({ ...s, registrationOpen:newVal }));
      setSettingsForm(s=>({ ...s, registrationOpen:newVal }));
      showToast(newVal?"Registration OPENED":"Registration CLOSED","warn");
    } catch(e) { showToast("Update failed.","error"); }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalSeats    = courses.reduce((s,c)=>s+(c.totalSeats||0),0);
  const totalEnrolled = courses.reduce((s,c)=>s+(c.enrolledSeats||0),0);
  const compulsoryCount = courses.filter(c=>c.compulsory).length;

  if (loading) return (
    <div style={ad.loadRoot}>
      <div style={ad.spinner} />
      <div style={ad.loadText}>Loading admin panel...</div>
      <style>{globalStyle}</style>
    </div>
  );

  const cm = courseModal;

  return (
    <div style={ad.root}>
      <div style={ad.gridBg} />
      <Toast toast={toast} />

      {/* Course Modal */}
      {cm && (
        <Modal title={cm.mode==="add"?"Add New Course":"Edit Course"} onClose={()=>setCM(null)}>
          <div style={ad.formGrid}>
            <Field label="Course Code *">
              <input style={ad.input} value={cm.data.code} onChange={e=>setCM({...cm,data:{...cm.data,code:e.target.value}})} placeholder="CS101" />
            </Field>
            <Field label="Course Name *">
              <input style={ad.input} value={cm.data.name} onChange={e=>setCM({...cm,data:{...cm.data,name:e.target.value}})} placeholder="Introduction to Programming" />
            </Field>
            <Field label="Instructor">
              <input style={ad.input} value={cm.data.instructor||""} onChange={e=>setCM({...cm,data:{...cm.data,instructor:e.target.value}})} placeholder="Dr. Firstname Lastname" />
            </Field>
            <Field label="Credits">
              <input style={ad.input} type="number" min={1} max={6} value={cm.data.credits} onChange={e=>setCM({...cm,data:{...cm.data,credits:Number(e.target.value)}})} />
            </Field>
            <Field label="Total Seats">
              <input style={ad.input} type="number" min={1} value={cm.data.totalSeats} onChange={e=>setCM({...cm,data:{...cm.data,totalSeats:Number(e.target.value)}})} />
            </Field>
            <Field label="Category">
              <select style={ad.input} value={cm.data.category} onChange={e=>setCM({...cm,data:{...cm.data,category:e.target.value}})}>
                {CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Department">
              <select style={ad.input} value={cm.data.dept} onChange={e=>setCM({...cm,data:{...cm.data,dept:e.target.value}})}>
                {DEPARTMENTS.map(d=><option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Room">
              <input style={ad.input} value={cm.data.room||""} onChange={e=>setCM({...cm,data:{...cm.data,room:e.target.value}})} placeholder="CSB-101" />
            </Field>
            <Field label="Schedule">
              <input style={ad.input} value={cm.data.schedule||""} onChange={e=>setCM({...cm,data:{...cm.data,schedule:e.target.value}})} placeholder="Mon/Wed 9:00–10:30" />
            </Field>
          </div>
          <div style={ad.checkRow}>
            <input type="checkbox" id="comp" checked={!!cm.data.compulsory} onChange={e=>setCM({...cm,data:{...cm.data,compulsory:e.target.checked}})} />
            <label htmlFor="comp" style={ad.checkLabel}>Mark as Compulsory (students must enroll)</label>
          </div>
          <div style={ad.modalFoot}>
            <button style={ad.cancelBtn} onClick={()=>setCM(null)}>Cancel</button>
            <button style={ad.saveBtn} onClick={saveCourse}>{cm.mode==="add"?"Add Course":"Save Changes"}</button>
          </div>
        </Modal>
      )}

      {/* Confirm Delete */}
      {confirmDel && (
        <Modal title={`Delete ${confirmDel.type==="course"?"Course":"Student"}?`} onClose={()=>setConfirmDel(null)}>
          <p style={{ color:"rgba(255,255,255,0.45)", fontSize:14, padding:"14px 0 24px", lineHeight:1.6 }}>
            This will permanently delete <strong style={{ color:"#e8eaf0" }}>{confirmDel.name}</strong>.
            {confirmDel.type==="course" && " All student enrollments for this course will remain in their records."}
          </p>
          <div style={ad.modalFoot}>
            <button style={ad.cancelBtn} onClick={()=>setConfirmDel(null)}>Cancel</button>
            <button style={ad.deleteBtn} onClick={()=>deleteCourse(confirmDel.id)}>Yes, Delete</button>
          </div>
        </Modal>
      )}

      {/* Header */}
      <header style={ad.header}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={ad.logoMark}>◈</div>
          <div>
            <div style={ad.portalTitle}>Admin Portal</div>
            <div style={ad.portalSub}>{settings.universityName}</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
          <button
            style={{ ...ad.regToggle, background:settings.registrationOpen?"rgba(0,245,160,0.1)":"rgba(255,80,80,0.1)", color:settings.registrationOpen?"#00f5a0":"#ff6060", borderColor:settings.registrationOpen?"rgba(0,245,160,0.25)":"rgba(255,80,80,0.25)" }}
            onClick={toggleRegistration}
          >
            ● Registration {settings.registrationOpen?"OPEN":"CLOSED"}
          </button>
          <div style={ad.userRow}>
            {user.photoURL
              ? <img src={user.photoURL} style={ad.avatar} alt="avatar" referrerPolicy="no-referrer" />
              : <div style={ad.avatarFb}>{user.displayName?.[0]}</div>}
            <span style={ad.userName}>{user.displayName}</span>
          </div>
          <button style={ad.logoutBtn} onClick={logout}>Sign out</button>
        </div>
      </header>

      {/* Nav */}
      <nav style={ad.nav}>
        {[["dashboard","◆ Dashboard"],["courses","▤ Courses"],["students","👥 Students"],["settings","⚙ Settings"]].map(([v,label])=>(
          <button key={v} style={{ ...ad.navBtn, ...(view===v?ad.navActive:{}) }} onClick={()=>setView(v)}>{label}</button>
        ))}
      </nav>

      <main style={ad.main}>

        {/* ── DASHBOARD ── */}
        {view==="dashboard" && (
          <div>
            <h2 style={ad.sectionTitle}>Overview</h2>
            <div style={ad.statGrid}>
              {[
                ["Total Courses",   courses.length,   "#00f5a0"],
                ["Compulsory",      compulsoryCount,  "#f5a000"],
                ["Total Seats",     totalSeats,       "#a78bfa"],
                ["Total Enrolled",  totalEnrolled,    "#00b4d8"],
                ["Students",        students.length,  "#00f5a0"],
                ["Min Credits",     settings.minCredits,"#f5a000"],
              ].map(([l,v,c])=>(
                <div key={l} style={ad.statCard}>
                  <div style={{ ...ad.statNum, color:c }}>{v}</div>
                  <div style={ad.statLabel}>{l}</div>
                </div>
              ))}
            </div>

            <h2 style={{ ...ad.sectionTitle, marginTop:40 }}>Enrollment Overview</h2>
            <div style={ad.enrollTable}>
              <div style={ad.tHead}>
                {["Code","Course","Category","Seats","Enrolled","Available","Fill %"].map(h=><div key={h} style={ad.th}>{h}</div>)}
              </div>
              {courses.length===0
                ? <div style={{ padding:24, color:"rgba(255,255,255,0.2)", fontSize:13 }}>No courses yet. Add from the Courses tab.</div>
                : courses.map(c=>{
                    const pct = c.totalSeats>0 ? Math.round((c.enrolledSeats||0)/c.totalSeats*100) : 0;
                    return (
                      <div key={c.id} style={ad.tRow}>
                        <div style={ad.td}><span style={{ fontFamily:"'Space Mono',monospace", fontSize:11 }}>{c.code}</span></div>
                        <div style={{ ...ad.td, flex:2 }}>{c.name} {c.compulsory&&<span style={ad.compTag}>C</span>}</div>
                        <div style={ad.td}><span style={{ color:CAT_COLOR[c.category]||"#aaa", fontSize:11 }}>{c.category}</span></div>
                        <div style={ad.td}>{c.totalSeats}</div>
                        <div style={ad.td}>{c.enrolledSeats||0}</div>
                        <div style={{ ...ad.td, color:(c.totalSeats-(c.enrolledSeats||0))<=5?"#ff6060":"#00f5a0" }}>{c.totalSeats-(c.enrolledSeats||0)}</div>
                        <div style={ad.td}>
                          <div style={ad.miniTrack}><div style={{ ...ad.miniFill, width:`${pct}%`, background:pct>80?"#ff5050":pct>50?"#f5a000":"#00f5a0" }} /></div>
                          <span style={{ fontSize:10, color:"rgba(255,255,255,0.28)" }}>{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>
        )}

        {/* ── COURSES ── */}
        {view==="courses" && (
          <div>
            <div style={ad.secHead}>
              <h2 style={ad.sectionTitle}>Courses ({courses.length})</h2>
              <button style={ad.addBtn} onClick={openAddCourse}>+ Add Course</button>
            </div>
            {courses.length===0
              ? <div style={ad.emptyState}><div style={{ fontSize:40, opacity:0.1 }}>◌</div><div>No courses yet.</div><button style={ad.addBtn} onClick={openAddCourse}>+ Add First Course</button></div>
              : <div style={ad.courseCards}>
                  {courses.map(c=>{
                    const seats = (c.totalSeats||0)-(c.enrolledSeats||0);
                    return (
                      <div key={c.id} style={ad.cCard}>
                        <div style={ad.cCardHead}>
                          <span style={{ ...ad.catDot, color:CAT_COLOR[c.category]||"#aaa" }}>● {c.category}</span>
                          {c.compulsory&&<span style={ad.compTag}>COMPULSORY</span>}
                          <span style={{ marginLeft:"auto", fontSize:10, color:"rgba(255,255,255,0.22)", fontFamily:"'Space Mono',monospace" }}>{seats}/{c.totalSeats} seats</span>
                        </div>
                        <div style={ad.cCode}>{c.code}</div>
                        <div style={ad.cName}>{c.name}</div>
                        {c.instructor&&<div style={ad.cMeta}>👤 {c.instructor}</div>}
                        {c.room&&<div style={ad.cMeta}>🏫 {c.room}{c.schedule?` · ${c.schedule}`:""}</div>}
                        <div style={ad.cMeta}>🏢 {c.dept} · {c.credits} credits</div>
                        <div style={ad.miniTrack} title={`${c.enrolledSeats||0} enrolled`}>
                          <div style={{ ...ad.miniFill, width:`${c.totalSeats>0?(c.enrolledSeats||0)/c.totalSeats*100:0}%`, background:"#00f5a0" }} />
                        </div>
                        <div style={ad.cFoot}>
                          <button style={ad.editBtn} onClick={()=>openEditCourse(c)}>Edit</button>
                          <button style={ad.delBtn} onClick={()=>setConfirmDel({ type:"course", id:c.id, name:c.name })}>Delete</button>
                        </div>
                      </div>
                    );
                  })}
                </div>}
          </div>
        )}

        {/* ── STUDENTS ── */}
        {view==="students" && (
          <div>
            <h2 style={ad.sectionTitle}>Registered Students ({students.length})</h2>
            {students.length===0
              ? <div style={ad.emptyState}><div style={{ fontSize:40, opacity:0.1 }}>◌</div><div>No students have logged in yet.</div></div>
              : <div style={ad.studentList}>
                  {students.map(s=>{
                    const regCourses = (s.registrations||[]).map(id=>courses.find(c=>c.id===id)).filter(Boolean);
                    const totalCr = regCourses.reduce((sum,c)=>sum+(c?.credits||0),0);
                    return (
                      <div key={s.id} style={ad.studentCard}>
                        <div style={ad.studentLeft}>
                          {s.photoURL
                            ? <img src={s.photoURL} style={ad.sAvatar} alt="avatar" referrerPolicy="no-referrer" />
                            : <div style={ad.sAvatarFb}>{(s.name||"?")[0]}</div>}
                          <div>
                            <div style={ad.sName}>{s.name}</div>
                            <div style={ad.sMeta}>{s.email}</div>
                            <div style={ad.sMeta}>{s.dept} · Year {s.year}</div>
                          </div>
                        </div>
                        <div style={ad.studentRight}>
                          <div style={ad.sCreditBox}>
                            <div style={ad.sCreditNum}>{totalCr}</div>
                            <div style={ad.sCreditLabel}>credits</div>
                          </div>
                          <div style={ad.sCoursesWrap}>
                            {regCourses.length===0
                              ? <span style={{ fontSize:11, color:"rgba(255,255,255,0.2)" }}>No courses enrolled</span>
                              : regCourses.map(c=><span key={c.id} style={{ ...ad.courseChip, borderColor:`${CAT_COLOR[c.category]}40`, color:CAT_COLOR[c.category] }}>{c.code}</span>)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>}
          </div>
        )}

        {/* ── SETTINGS ── */}
        {view==="settings" && (
          <div style={{ maxWidth:580 }}>
            <h2 style={ad.sectionTitle}>University Settings</h2>
            <div style={ad.settingsCard}>
              <Field label="University Name">
                <input style={ad.input} value={settingsForm.universityName} onChange={e=>setSettingsForm({...settingsForm,universityName:e.target.value})} />
              </Field>
              <Field label="Semester Label">
                <input style={ad.input} value={settingsForm.semester} onChange={e=>setSettingsForm({...settingsForm,semester:e.target.value})} />
              </Field>
              <div style={ad.formGrid}>
                <Field label="Min Credits Required" hint="Students must register at least this many credits">
                  <input style={ad.input} type="number" min={1} max={30} value={settingsForm.minCredits} onChange={e=>setSettingsForm({...settingsForm,minCredits:e.target.value})} />
                </Field>
                <Field label="Max Credits Allowed" hint="Students cannot exceed this credit count">
                  <input style={ad.input} type="number" min={1} max={40} value={settingsForm.maxCredits} onChange={e=>setSettingsForm({...settingsForm,maxCredits:e.target.value})} />
                </Field>
              </div>
              <div style={ad.checkRow}>
                <input type="checkbox" id="regOpen" checked={!!settingsForm.registrationOpen} onChange={e=>setSettingsForm({...settingsForm,registrationOpen:e.target.checked})} style={{ width:16,height:16 }} />
                <label htmlFor="regOpen" style={ad.checkLabel}>Registration is open for students</label>
              </div>
              <button style={ad.saveSettingsBtn} onClick={saveSettings}>Save Settings</button>
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
  ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-thumb { background:#f5a000; border-radius:2px; }
  button { cursor:pointer; font-family:'Syne',sans-serif; }
  input,select { font-family:'Syne',sans-serif; }
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
`;

const ad = {
  toast:    { position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", padding:"11px 28px", borderRadius:8, fontWeight:700, fontSize:13, zIndex:9999, animation:"slideDown 0.3s ease", boxShadow:"0 4px 24px rgba(0,0,0,0.5)", fontFamily:"'Syne',sans-serif" },
  root:     { minHeight:"100vh", background:"#06090f", color:"#e8eaf0", fontFamily:"'Syne',sans-serif", position:"relative" },
  gridBg:   { position:"fixed", inset:0, backgroundImage:"linear-gradient(rgba(245,160,0,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(245,160,0,0.02) 1px,transparent 1px)", backgroundSize:"36px 36px", pointerEvents:"none", zIndex:0 },
  loadRoot: { minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#06090f", gap:14, fontFamily:"'Syne',sans-serif" },
  spinner:  { width:36, height:36, border:"3px solid rgba(245,160,0,0.12)", borderTop:"3px solid #f5a000", borderRadius:"50%", animation:"spin 0.75s linear infinite" },
  loadText: { fontSize:12, color:"rgba(255,255,255,0.25)", fontFamily:"'Space Mono',monospace" },

  header:      { position:"sticky", top:0, zIndex:100, display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 32px", borderBottom:"1px solid rgba(245,160,0,0.1)", backdropFilter:"blur(14px)", background:"rgba(6,9,15,0.88)", flexWrap:"wrap", gap:12 },
  logoMark:    { fontSize:24, color:"#f5a000", fontWeight:800 },
  portalTitle: { fontSize:15, fontWeight:800 },
  portalSub:   { fontSize:10, color:"rgba(255,255,255,0.28)", fontFamily:"'Space Mono',monospace", marginTop:2 },
  regToggle:   { padding:"7px 14px", borderRadius:6, fontSize:11, fontWeight:800, border:"1px solid", letterSpacing:0.4, fontFamily:"'Space Mono',monospace" },
  userRow:     { display:"flex", alignItems:"center", gap:10 },
  avatar:      { width:32, height:32, borderRadius:"50%", objectFit:"cover" },
  avatarFb:    { width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#f5a000,#ff6b35)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#000", fontSize:14 },
  userName:    { fontSize:13, fontWeight:700 },
  logoutBtn:   { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)", borderRadius:6, padding:"6px 14px", fontSize:12, fontWeight:600 },

  nav:      { position:"relative", zIndex:10, display:"flex", gap:4, padding:"12px 32px", borderBottom:"1px solid rgba(255,255,255,0.05)" },
  navBtn:   { background:"transparent", border:"1px solid transparent", padding:"7px 16px", borderRadius:6, fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.35)", transition:"all 0.2s" },
  navActive:{ background:"rgba(245,160,0,0.08)", border:"1px solid rgba(245,160,0,0.2)", color:"#f5a000" },

  main:         { position:"relative", zIndex:10, padding:"24px 32px", maxWidth:1280, margin:"0 auto" },
  sectionTitle: { fontSize:19, fontWeight:800, marginBottom:18 },
  secHead:      { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, flexWrap:"wrap", gap:12 },
  addBtn:       { background:"#f5a000", color:"#000", border:"none", borderRadius:8, padding:"9px 22px", fontWeight:700, fontSize:13 },
  emptyState:   { textAlign:"center", padding:"60px 0", display:"flex", flexDirection:"column", gap:14, alignItems:"center", color:"rgba(255,255,255,0.22)" },

  statGrid:  { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(145px,1fr))", gap:12 },
  statCard:  { background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"18px 14px", textAlign:"center" },
  statNum:   { fontSize:30, fontWeight:800, fontFamily:"'Space Mono',monospace" },
  statLabel: { fontSize:11, color:"rgba(255,255,255,0.32)", marginTop:4 },

  enrollTable:{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, overflow:"hidden" },
  tHead:      { display:"flex", padding:"11px 18px", borderBottom:"1px solid rgba(255,255,255,0.06)", background:"rgba(255,255,255,0.02)" },
  tRow:       { display:"flex", padding:"10px 18px", borderBottom:"1px solid rgba(255,255,255,0.04)", alignItems:"center" },
  th:         { flex:1, fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.28)", textTransform:"uppercase", letterSpacing:0.5 },
  td:         { flex:1, fontSize:12, color:"rgba(255,255,255,0.55)" },
  miniTrack:  { height:4, background:"rgba(255,255,255,0.06)", borderRadius:2, overflow:"hidden", marginBottom:3, flex:1 },
  miniFill:   { height:"100%", borderRadius:2, transition:"width 0.4s" },
  compTag:    { background:"rgba(245,160,0,0.1)", color:"#f5a000", fontSize:9, fontWeight:800, borderRadius:4, padding:"2px 6px", fontFamily:"'Space Mono',monospace" },

  courseCards:{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(275px,1fr))", gap:14 },
  cCard:      { background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:18, display:"flex", flexDirection:"column", gap:5, animation:"fadeUp 0.25s ease" },
  cCardHead:  { display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", marginBottom:4 },
  catDot:     { fontSize:10, fontWeight:700, fontFamily:"'Space Mono',monospace" },
  cCode:      { fontSize:11, color:"rgba(255,255,255,0.28)", fontFamily:"'Space Mono',monospace" },
  cName:      { fontSize:15, fontWeight:700, lineHeight:1.3 },
  cMeta:      { fontSize:11, color:"rgba(255,255,255,0.3)" },
  cFoot:      { display:"flex", gap:8, marginTop:8 },
  editBtn:    { flex:1, padding:"7px", borderRadius:6, fontSize:12, fontWeight:700, background:"rgba(245,160,0,0.08)", color:"#f5a000", border:"1px solid rgba(245,160,0,0.18)" },
  delBtn:     { flex:1, padding:"7px", borderRadius:6, fontSize:12, fontWeight:700, background:"rgba(255,80,80,0.07)", color:"#ff6060", border:"1px solid rgba(255,80,80,0.16)" },

  studentList:  { display:"flex", flexDirection:"column", gap:10 },
  studentCard:  { display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"16px 20px", flexWrap:"wrap", gap:14 },
  studentLeft:  { display:"flex", alignItems:"center", gap:14 },
  sAvatar:      { width:44, height:44, borderRadius:"50%", objectFit:"cover" },
  sAvatarFb:    { width:44, height:44, borderRadius:"50%", background:"linear-gradient(135deg,#f5a000,#ff6b35)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#000", fontSize:18 },
  sName:        { fontSize:15, fontWeight:700, marginBottom:3 },
  sMeta:        { fontSize:11, color:"rgba(255,255,255,0.3)" },
  studentRight: { display:"flex", alignItems:"center", gap:20 },
  sCreditBox:   { textAlign:"center" },
  sCreditNum:   { fontSize:22, fontWeight:800, color:"#00f5a0", fontFamily:"'Space Mono',monospace" },
  sCreditLabel: { fontSize:10, color:"rgba(255,255,255,0.28)" },
  sCoursesWrap: { display:"flex", gap:6, flexWrap:"wrap", maxWidth:300 },
  courseChip:   { borderRadius:4, padding:"2px 8px", fontSize:11, fontFamily:"'Space Mono',monospace", border:"1px solid" },

  overlay:    { position:"fixed", inset:0, background:"rgba(0,0,0,0.72)", backdropFilter:"blur(6px)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:20 },
  modal:      { background:"#0d1119", border:"1px solid rgba(255,255,255,0.09)", borderRadius:16, width:"100%", maxWidth:620, maxHeight:"90vh", overflowY:"auto", padding:28 },
  modalHead:  { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 },
  modalTitle: { fontSize:17, fontWeight:800 },
  closeBtn:   { background:"rgba(255,255,255,0.05)", border:"none", color:"rgba(255,255,255,0.4)", borderRadius:6, width:30, height:30, fontSize:14 },
  formGrid:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 },
  field:      { display:"flex", flexDirection:"column", gap:5 },
  label:      { fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.38)", letterSpacing:0.4 },
  input:      { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:8, padding:"9px 12px", color:"#e8eaf0", fontSize:13, outline:"none" },
  hint:       { fontSize:10, color:"rgba(255,255,255,0.2)" },
  checkRow:   { display:"flex", alignItems:"center", gap:10, marginBottom:22 },
  checkLabel: { fontSize:13, color:"rgba(255,255,255,0.45)" },
  modalFoot:  { display:"flex", gap:10, justifyContent:"flex-end" },
  cancelBtn:  { padding:"9px 20px", borderRadius:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", color:"rgba(255,255,255,0.4)", fontSize:13, fontWeight:600 },
  saveBtn:    { padding:"9px 24px", borderRadius:8, background:"#f5a000", color:"#000", border:"none", fontSize:13, fontWeight:700 },
  deleteBtn:  { padding:"9px 24px", borderRadius:8, background:"#ff4040", color:"#fff", border:"none", fontSize:13, fontWeight:700 },

  settingsCard:    { background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:28, display:"flex", flexDirection:"column", gap:16 },
  saveSettingsBtn: { background:"#f5a000", color:"#000", border:"none", borderRadius:8, padding:"11px 26px", fontWeight:700, fontSize:14, alignSelf:"flex-start" },
};