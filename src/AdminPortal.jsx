import { useState } from "react";

const CAT_COLOR = { Core: "#00f5a0", Elective: "#f5a000", Lab: "#a78bfa" };

function Toast({ toast }) {
  if (!toast) return null;
  const bg = toast.type === "error" ? "#ff4040" : toast.type === "warn" ? "#f5a000" : "#00f5a0";
  return <div style={{ ...ad.toast, background: bg, color: "#000" }}>{toast.msg}</div>;
}

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

function Input({ label, ...props }) {
  return (
    <div style={ad.fieldWrap}>
      <label style={ad.label}>{label}</label>
      <input style={ad.input} {...props} />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div style={ad.fieldWrap}>
      <label style={ad.label}>{label}</label>
      <select style={ad.input} {...props}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

const BLANK_COURSE = { code: "", name: "", credits: 3, staffId: "", dept: "", category: "Core", totalSeats: 40, schedule: "", room: "", compulsory: false };
const BLANK_STAFF  = { name: "", dept: "", designation: "Assistant Professor" };

export default function AdminPortal({ db, onBack }) {
  const [tick, setTick]         = useState(0);
  const [view, setView]         = useState("dashboard");
  const [toast, setToast]       = useState(null);
  const [courseModal, setCM]    = useState(null); // null | { mode: "add"|"edit", data }
  const [staffModal, setSM]     = useState(null); // null | { mode: "add" }
  const [deleteCourse, setDelC] = useState(null);
  const [deleteStaff, setDelS]  = useState(null);
  const [settingsForm, setSettings] = useState({ ...db.settings });

  const refresh = () => setTick(t => t + 1);
  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2600); };

  // ── Settings ──
  const saveSettings = () => {
    Object.assign(db.settings, {
      ...settingsForm,
      minCredits: Number(settingsForm.minCredits),
      maxCredits: Number(settingsForm.maxCredits),
    });
    refresh(); showToast("Settings saved!");
  };

  // ── Course CRUD ──
  const openAddCourse  = () => setCM({ mode: "add",  data: { ...BLANK_COURSE } });
  const openEditCourse = (c)  => setCM({ mode: "edit", data: { ...c } });
  const saveCourse = () => {
    const d = courseModal.data;
    if (!d.code || !d.name || !d.staffId) { showToast("Fill all required fields.", "error"); return; }
    if (courseModal.mode === "add") { db.addCourse(d); showToast("Course added!"); }
    else { db.updateCourse(d.id, d); showToast("Course updated!"); }
    setCM(null); refresh();
  };
  const confirmDeleteCourse = () => { db.deleteCourse(deleteCourse); setDelC(null); refresh(); showToast("Course deleted.", "warn"); };

  // ── Staff CRUD ──
  const openAddStaff = () => setSM({ mode: "add", data: { ...BLANK_STAFF } });
  const saveStaff = () => {
    const d = staffModal.data;
    if (!d.name || !d.dept) { showToast("Fill all required fields.", "error"); return; }
    db.addStaff(d); setSM(null); refresh(); showToast("Staff added!");
  };
  const confirmDeleteStaff = () => { db.removeStaff(deleteStaff); setDelS(null); refresh(); showToast("Staff removed.", "warn"); };

  const stats = {
    totalCourses:  db.courses.length,
    totalSeats:    db.courses.reduce((s, c) => s + c.totalSeats, 0),
    enrolled:      db.courses.reduce((s, c) => s + c.enrolledSeats, 0),
    totalStaff:    db.staff.length,
    students:      db.students.length,
    compulsory:    db.courses.filter(c => c.compulsory).length,
  };

  const catOptions     = [{ value: "Core", label: "Core" }, { value: "Elective", label: "Elective" }, { value: "Lab", label: "Lab" }];
  const deptOptions    = db.departments.map(d => ({ value: d, label: d }));
  const staffOptions   = [{ value: "", label: "— Select Staff —" }, ...db.staff.map(s => ({ value: s.id, label: `${s.name} (${s.dept})` }))];
  const desigOptions   = ["Professor", "Associate Professor", "Assistant Professor", "Lecturer"].map(v => ({ value: v, label: v }));

  const cm = courseModal;
  const sm = staffModal;

  return (
    <div style={ad.root}>
      <div style={ad.gridBg} />
      <Toast toast={toast} />

      {/* Course Modal */}
      {cm && (
        <Modal title={cm.mode === "add" ? "Add New Course" : "Edit Course"} onClose={() => setCM(null)}>
          <div style={ad.formGrid}>
            <Input label="Course Code *" value={cm.data.code} onChange={e => setCM({ ...cm, data: { ...cm.data, code: e.target.value } })} placeholder="CS101" />
            <Input label="Course Name *" value={cm.data.name} onChange={e => setCM({ ...cm, data: { ...cm.data, name: e.target.value } })} placeholder="Introduction to Programming" />
            <Input label="Credits" type="number" min={1} max={6} value={cm.data.credits} onChange={e => setCM({ ...cm, data: { ...cm.data, credits: Number(e.target.value) } })} />
            <Input label="Total Seats" type="number" min={1} value={cm.data.totalSeats} onChange={e => setCM({ ...cm, data: { ...cm.data, totalSeats: Number(e.target.value) } })} />
            <Select label="Category" options={catOptions} value={cm.data.category} onChange={e => setCM({ ...cm, data: { ...cm.data, category: e.target.value } })} />
            <Select label="Department" options={deptOptions} value={cm.data.dept} onChange={e => setCM({ ...cm, data: { ...cm.data, dept: e.target.value } })} />
            <Select label="Assigned Staff *" options={staffOptions} value={cm.data.staffId} onChange={e => setCM({ ...cm, data: { ...cm.data, staffId: e.target.value } })} />
            <Input label="Room" value={cm.data.room} onChange={e => setCM({ ...cm, data: { ...cm.data, room: e.target.value } })} placeholder="CSB-101" />
            <Input label="Schedule" value={cm.data.schedule} onChange={e => setCM({ ...cm, data: { ...cm.data, schedule: e.target.value } })} placeholder="Mon/Wed 9:00–10:30" />
          </div>
          <div style={ad.checkRow}>
            <input type="checkbox" id="comp" checked={cm.data.compulsory} onChange={e => setCM({ ...cm, data: { ...cm.data, compulsory: e.target.checked } })} />
            <label htmlFor="comp" style={ad.checkLabel}>Mark as Compulsory (students must enroll)</label>
          </div>
          <div style={ad.modalFoot}>
            <button style={ad.cancelBtn} onClick={() => setCM(null)}>Cancel</button>
            <button style={ad.saveBtn} onClick={saveCourse}>{cm.mode === "add" ? "Add Course" : "Save Changes"}</button>
          </div>
        </Modal>
      )}

      {/* Staff Modal */}
      {sm && (
        <Modal title="Add Staff Member" onClose={() => setSM(null)}>
          <div style={ad.formGrid}>
            <Input label="Full Name *" value={sm.data.name} onChange={e => setSM({ ...sm, data: { ...sm.data, name: e.target.value } })} placeholder="Dr. Firstname Lastname" />
            <Select label="Department *" options={deptOptions} value={sm.data.dept} onChange={e => setSM({ ...sm, data: { ...sm.data, dept: e.target.value } })} />
            <Select label="Designation" options={desigOptions} value={sm.data.designation} onChange={e => setSM({ ...sm, data: { ...sm.data, designation: e.target.value } })} />
          </div>
          <div style={ad.modalFoot}>
            <button style={ad.cancelBtn} onClick={() => setSM(null)}>Cancel</button>
            <button style={ad.saveBtn} onClick={saveStaff}>Add Staff</button>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteCourse && (
        <Modal title="Delete Course?" onClose={() => setDelC(null)}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, padding: "16px 0 24px" }}>
            This will remove <strong style={{ color: "#e8eaf0" }}>{db.getCourse(deleteCourse)?.name}</strong> and drop all enrolled students from it.
          </p>
          <div style={ad.modalFoot}>
            <button style={ad.cancelBtn} onClick={() => setDelC(null)}>Cancel</button>
            <button style={ad.deleteBtn} onClick={confirmDeleteCourse}>Yes, Delete</button>
          </div>
        </Modal>
      )}
      {deleteStaff && (
        <Modal title="Remove Staff?" onClose={() => setDelS(null)}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, padding: "16px 0 24px" }}>
            Remove <strong style={{ color: "#e8eaf0" }}>{db.getStaff(deleteStaff)?.name}</strong>? Their assigned courses will be marked TBA.
          </p>
          <div style={ad.modalFoot}>
            <button style={ad.cancelBtn} onClick={() => setDelS(null)}>Cancel</button>
            <button style={ad.deleteBtn} onClick={confirmDeleteStaff}>Yes, Remove</button>
          </div>
        </Modal>
      )}

      {/* Header */}
      <header style={ad.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={onBack} style={ad.backBtn}>← Portal</button>
          <div>
            <div style={ad.portalTitle}>University Admin</div>
            <div style={ad.portalSub}>{db.settings.universityName}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "'Space Mono',monospace" }}>
            Registration:
          </div>
          <button
            style={{ ...ad.toggleBtn, background: db.settings.registrationOpen ? "rgba(0,245,160,0.15)" : "rgba(255,80,80,0.1)", color: db.settings.registrationOpen ? "#00f5a0" : "#ff6060", borderColor: db.settings.registrationOpen ? "rgba(0,245,160,0.3)" : "rgba(255,80,80,0.3)" }}
            onClick={() => { db.settings.registrationOpen = !db.settings.registrationOpen; setSettings({ ...db.settings }); refresh(); showToast(db.settings.registrationOpen ? "Registration OPENED" : "Registration CLOSED", "warn"); }}
          >
            {db.settings.registrationOpen ? "● OPEN" : "● CLOSED"}
          </button>
        </div>
      </header>

      {/* Nav */}
      <nav style={ad.nav}>
        {[["dashboard", "◆ Dashboard"], ["courses", "▤ Courses"], ["staff", "👥 Staff"], ["settings", "⚙ Settings"]].map(([v, label]) => (
          <button key={v} style={{ ...ad.navBtn, ...(view === v ? ad.navActive : {}) }} onClick={() => setView(v)}>{label}</button>
        ))}
      </nav>

      <main style={ad.main}>

        {/* ── DASHBOARD ── */}
        {view === "dashboard" && (
          <div>
            <h2 style={ad.sectionTitle}>Overview</h2>
            <div style={ad.statGrid}>
              {[
                ["Total Courses", stats.totalCourses, "#00f5a0"],
                ["Compulsory",    stats.compulsory,   "#f5a000"],
                ["Total Seats",   stats.totalSeats,   "#a78bfa"],
                ["Enrolled",      stats.enrolled,     "#00b4d8"],
                ["Staff",         stats.totalStaff,   "#00f5a0"],
                ["Students",      stats.students,     "#f5a000"],
              ].map(([l, v, c]) => (
                <div key={l} style={ad.statCard}>
                  <div style={{ ...ad.statNum, color: c }}>{v}</div>
                  <div style={ad.statLabel}>{l}</div>
                </div>
              ))}
            </div>

            <h2 style={{ ...ad.sectionTitle, marginTop: 40 }}>Course Enrollment Overview</h2>
            <div style={ad.enrollTable}>
              <div style={ad.tHead}>
                {["Code", "Course Name", "Staff", "Category", "Seats", "Enrolled", "Available", "Fill %"].map(h => (
                  <div key={h} style={ad.th}>{h}</div>
                ))}
              </div>
              {db.courses.map(c => {
                const pct = Math.round((c.enrolledSeats / c.totalSeats) * 100);
                const staff = db.getStaff(c.staffId);
                return (
                  <div key={c.id} style={ad.tRow}>
                    <div style={ad.td}><span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11 }}>{c.code}</span></div>
                    <div style={{ ...ad.td, flex: 2 }}>{c.name} {c.compulsory && <span style={ad.compTag}>C</span>}</div>
                    <div style={ad.td}>{staff?.name || "TBA"}</div>
                    <div style={ad.td}><span style={{ color: CAT_COLOR[c.category] || "#aaa", fontSize: 11 }}>{c.category}</span></div>
                    <div style={ad.td}>{c.totalSeats}</div>
                    <div style={ad.td}>{c.enrolledSeats}</div>
                    <div style={{ ...ad.td, color: c.totalSeats - c.enrolledSeats <= 5 ? "#ff6060" : "#00f5a0" }}>{c.totalSeats - c.enrolledSeats}</div>
                    <div style={ad.td}>
                      <div style={ad.miniTrack}>
                        <div style={{ ...ad.miniFill, width: `${pct}%`, background: pct > 80 ? "#ff5050" : pct > 50 ? "#f5a000" : "#00f5a0" }} />
                      </div>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── COURSES ── */}
        {view === "courses" && (
          <div>
            <div style={ad.secHead}>
              <h2 style={ad.sectionTitle}>Courses</h2>
              <button style={ad.addBtn} onClick={openAddCourse}>+ Add Course</button>
            </div>
            <div style={ad.courseCards}>
              {db.courses.map(c => {
                const staff = db.getStaff(c.staffId);
                const seats = c.totalSeats - c.enrolledSeats;
                return (
                  <div key={c.id} style={ad.cCard}>
                    <div style={ad.cCardHead}>
                      <span style={{ ...ad.catDot, color: CAT_COLOR[c.category] || "#aaa" }}>● {c.category}</span>
                      {c.compulsory && <span style={ad.compTag}>COMPULSORY</span>}
                      <span style={{ marginLeft: "auto", fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "'Space Mono',monospace" }}>{seats} / {c.totalSeats} seats</span>
                    </div>
                    <div style={ad.cCode}>{c.code}</div>
                    <div style={ad.cName}>{c.name}</div>
                    <div style={ad.cMeta}>👤 {staff?.name || "TBA"} · {staff?.designation || ""}</div>
                    <div style={ad.cMeta}>🏫 {c.room} · {c.schedule}</div>
                    <div style={ad.cMeta}>🏢 {c.dept} · {c.credits} credits</div>
                    <div style={ad.cFoot}>
                      <div style={ad.miniTrack} title={`${c.enrolledSeats} enrolled`}>
                        <div style={{ ...ad.miniFill, width: `${(c.enrolledSeats / c.totalSeats) * 100}%`, background: "#00f5a0" }} />
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button style={ad.editBtn} onClick={() => openEditCourse(c)}>Edit</button>
                        <button style={ad.delBtn} onClick={() => setDelC(c.id)}>Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STAFF ── */}
        {view === "staff" && (
          <div>
            <div style={ad.secHead}>
              <h2 style={ad.sectionTitle}>Staff</h2>
              <button style={ad.addBtn} onClick={openAddStaff}>+ Add Staff</button>
            </div>
            <div style={ad.staffList}>
              {db.staff.map(s => {
                const assigned = db.courses.filter(c => c.staffId === s.id);
                return (
                  <div key={s.id} style={ad.staffCard}>
                    <div style={ad.staffAvatar}>{s.name[0]}</div>
                    <div style={ad.staffInfo}>
                      <div style={ad.staffName}>{s.name}</div>
                      <div style={ad.staffMeta}>{s.designation} · {s.dept}</div>
                      <div style={ad.staffCourses}>
                        {assigned.length === 0
                          ? <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>No courses assigned</span>
                          : assigned.map(c => <span key={c.id} style={ad.courseChip}>{c.code}</span>)}
                      </div>
                    </div>
                    <div style={ad.staffId}>{s.id}</div>
                    <button style={ad.delBtn} onClick={() => setDelS(s.id)}>Remove</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {view === "settings" && (
          <div style={{ maxWidth: 560 }}>
            <h2 style={ad.sectionTitle}>University Settings</h2>
            <div style={ad.settingsCard}>
              <Input label="University Name" value={settingsForm.universityName} onChange={e => setSettings({ ...settingsForm, universityName: e.target.value })} />
              <Input label="Semester Label" value={settingsForm.semester} onChange={e => setSettings({ ...settingsForm, semester: e.target.value })} />
              <div style={ad.formGrid}>
                <div style={ad.fieldWrap}>
                  <label style={ad.label}>Min Credits Required</label>
                  <input style={ad.input} type="number" min={1} max={30} value={settingsForm.minCredits} onChange={e => setSettings({ ...settingsForm, minCredits: e.target.value })} />
                  <div style={ad.hint}>Students must register at least this many credits</div>
                </div>
                <div style={ad.fieldWrap}>
                  <label style={ad.label}>Max Credits Allowed</label>
                  <input style={ad.input} type="number" min={1} max={40} value={settingsForm.maxCredits} onChange={e => setSettings({ ...settingsForm, maxCredits: e.target.value })} />
                  <div style={ad.hint}>Students cannot exceed this credit count</div>
                </div>
              </div>
              <div style={{ ...ad.fieldWrap, flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 }}>
                <input type="checkbox" id="regOpen" checked={settingsForm.registrationOpen} onChange={e => setSettings({ ...settingsForm, registrationOpen: e.target.checked })} style={{ width: 16, height: 16 }} />
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
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #06090f; }
  ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #f5a000; border-radius: 2px; }
  button { cursor: pointer; font-family: 'Syne', sans-serif; }
  input, select { font-family: 'Syne', sans-serif; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
`;

const ad = {
  toast: { position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", padding: "11px 28px", borderRadius: 8, fontWeight: 700, fontSize: 13, zIndex: 9999, animation: "slideDown 0.3s ease", boxShadow: "0 4px 24px rgba(0,0,0,0.5)", fontFamily: "'Syne',sans-serif" },

  root: { minHeight: "100vh", background: "#06090f", color: "#e8eaf0", fontFamily: "'Syne',sans-serif", position: "relative" },
  gridBg: { position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(245,160,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(245,160,0,0.025) 1px,transparent 1px)", backgroundSize: "36px 36px", pointerEvents: "none", zIndex: 0 },

  header: { position: "sticky", top: 0, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 36px", borderBottom: "1px solid rgba(245,160,0,0.12)", backdropFilter: "blur(14px)", background: "rgba(6,9,15,0.88)", flexWrap: "wrap", gap: 12 },
  backBtn: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", borderRadius: 6, padding: "6px 12px", fontSize: 12 },
  portalTitle: { fontSize: 16, fontWeight: 800, color: "#e8eaf0" },
  portalSub: { fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'Space Mono',monospace", marginTop: 2 },
  toggleBtn: { padding: "7px 16px", borderRadius: 6, fontSize: 12, fontWeight: 800, border: "1px solid", letterSpacing: 0.5, fontFamily: "'Space Mono',monospace" },

  nav: { position: "relative", zIndex: 10, display: "flex", gap: 4, padding: "14px 36px", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  navBtn: { background: "transparent", border: "1px solid transparent", padding: "8px 18px", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.35)", transition: "all 0.2s" },
  navActive: { background: "rgba(245,160,0,0.08)", border: "1px solid rgba(245,160,0,0.22)", color: "#f5a000" },

  main: { position: "relative", zIndex: 10, padding: "28px 36px", maxWidth: 1280, margin: "0 auto" },
  sectionTitle: { fontSize: 20, fontWeight: 800, marginBottom: 20, color: "#e8eaf0" },
  secHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 },

  addBtn: { background: "#f5a000", color: "#000", border: "none", borderRadius: 8, padding: "9px 22px", fontWeight: 700, fontSize: 13 },

  // Stats
  statGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 14 },
  statCard: { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "20px 16px", textAlign: "center" },
  statNum: { fontSize: 32, fontWeight: 800, fontFamily: "'Space Mono',monospace" },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 },

  // Enroll table
  enrollTable: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" },
  tHead: { display: "flex", padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.025)" },
  tRow: { display: "flex", padding: "11px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center" },
  th: { flex: 1, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 0.5 },
  td: { flex: 1, fontSize: 12, color: "rgba(255,255,255,0.6)" },
  miniTrack: { height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden", marginBottom: 4, flex: 1 },
  miniFill: { height: "100%", borderRadius: 2, transition: "width 0.4s" },

  // Course cards
  courseCards: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 },
  cCard: { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 6, animation: "fadeUp 0.25s ease" },
  cCardHead: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" },
  catDot: { fontSize: 10, fontWeight: 700, fontFamily: "'Space Mono',monospace" },
  compTag: { background: "rgba(245,160,0,0.12)", color: "#f5a000", fontSize: 9, fontWeight: 800, borderRadius: 4, padding: "2px 6px", fontFamily: "'Space Mono',monospace" },
  cCode: { fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'Space Mono',monospace" },
  cName: { fontSize: 15, fontWeight: 700, lineHeight: 1.3 },
  cMeta: { fontSize: 11, color: "rgba(255,255,255,0.3)" },
  cFoot: { marginTop: 8, display: "flex", flexDirection: "column", gap: 8 },
  editBtn: { padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: "rgba(245,160,0,0.1)", color: "#f5a000", border: "1px solid rgba(245,160,0,0.2)" },
  delBtn: { padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: "rgba(255,80,80,0.08)", color: "#ff6060", border: "1px solid rgba(255,80,80,0.18)" },

  // Staff
  staffList: { display: "flex", flexDirection: "column", gap: 12 },
  staffCard: { display: "flex", alignItems: "center", gap: 16, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 20px" },
  staffAvatar: { width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#f5a000,#ff6b35)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: "#000", flexShrink: 0 },
  staffInfo: { flex: 1 },
  staffName: { fontSize: 15, fontWeight: 700, marginBottom: 2 },
  staffMeta: { fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 6 },
  staffCourses: { display: "flex", gap: 6, flexWrap: "wrap" },
  courseChip: { background: "rgba(245,160,0,0.1)", color: "#f5a000", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontFamily: "'Space Mono',monospace", border: "1px solid rgba(245,160,0,0.2)" },
  staffId: { fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "'Space Mono',monospace" },

  // Modal
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modal: { background: "#0e1420", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto", padding: 28 },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: 800, color: "#e8eaf0" },
  closeBtn: { background: "rgba(255,255,255,0.06)", border: "none", color: "rgba(255,255,255,0.4)", borderRadius: 6, width: 30, height: 30, fontSize: 14 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 },
  fieldWrap: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: 0.5 },
  input: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "#e8eaf0", fontSize: 13, outline: "none" },
  hint: { fontSize: 10, color: "rgba(255,255,255,0.2)" },
  checkRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 24 },
  checkLabel: { fontSize: 13, color: "rgba(255,255,255,0.5)" },
  modalFoot: { display: "flex", gap: 10, justifyContent: "flex-end" },
  cancelBtn: { padding: "9px 20px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 600 },
  saveBtn: { padding: "9px 24px", borderRadius: 8, background: "#f5a000", color: "#000", border: "none", fontSize: 13, fontWeight: 700 },
  deleteBtn: { padding: "9px 24px", borderRadius: 8, background: "#ff4040", color: "#fff", border: "none", fontSize: 13, fontWeight: 700 },

  // Settings
  settingsCard: { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 28, display: "flex", flexDirection: "column", gap: 16 },
  saveSettingsBtn: { background: "#f5a000", color: "#000", border: "none", borderRadius: 8, padding: "11px 28px", fontWeight: 700, fontSize: 14, marginTop: 8, alignSelf: "flex-start" },
};