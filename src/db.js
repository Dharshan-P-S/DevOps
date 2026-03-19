// ============================================================
// db.js — In-memory workspace database (acts as your JSON DB)
// All state lives here; import and mutate via exported helpers
// ============================================================

export const DB = {
  // ── University Settings ──────────────────────────────────
  settings: {
    universityName: "Coimbatore Institute of Technology",
    semester: "Semester IV · 2025–26",
    minCredits: 12,          // students MUST register at least this many credits
    maxCredits: 22,          // students CANNOT exceed this many credits
    registrationOpen: true,  // university can open/close registration
  },

  // ── Departments ──────────────────────────────────────────
  departments: ["Computer Science", "Mathematics", "Electronics", "Physics", "Management"],

  // ── Staff ────────────────────────────────────────────────
  staff: [
    { id: "S001", name: "Dr. Meena Iyer",    dept: "Computer Science", designation: "Professor" },
    { id: "S002", name: "Prof. Rajan Kumar", dept: "Computer Science", designation: "Associate Professor" },
    { id: "S003", name: "Dr. Priya Nair",    dept: "Computer Science", designation: "Professor" },
    { id: "S004", name: "Prof. Arjun Mehta", dept: "Computer Science", designation: "Assistant Professor" },
    { id: "S005", name: "Dr. Kavya Sharma",  dept: "Electronics",      designation: "Professor" },
    { id: "S006", name: "Prof. Sundar Rao",  dept: "Mathematics",      designation: "Professor" },
    { id: "S007", name: "Dr. Anitha Reddy",  dept: "Mathematics",      designation: "Associate Professor" },
    { id: "S008", name: "Prof. Vikram Singh",dept: "Computer Science", designation: "Professor" },
  ],

  // ── Courses ──────────────────────────────────────────────
  courses: [
    { id: "C001", code: "CS101", name: "Introduction to Programming",    credits: 3, staffId: "S001", dept: "Computer Science", category: "Core",     totalSeats: 60, enrolledSeats: 0, schedule: "Mon/Wed 9:00–10:30", room: "CSB-101", compulsory: true  },
    { id: "C002", code: "CS201", name: "Data Structures & Algorithms",   credits: 4, staffId: "S002", dept: "Computer Science", category: "Core",     totalSeats: 50, enrolledSeats: 0, schedule: "Tue/Thu 10:00–12:00", room: "CSB-202", compulsory: true  },
    { id: "C003", code: "CS301", name: "Database Management Systems",    credits: 3, staffId: "S003", dept: "Computer Science", category: "Core",     totalSeats: 55, enrolledSeats: 0, schedule: "Mon/Fri 11:00–12:30", room: "CSB-103", compulsory: false },
    { id: "C004", code: "CS401", name: "Machine Learning Fundamentals",  credits: 4, staffId: "S004", dept: "Computer Science", category: "Elective", totalSeats: 40, enrolledSeats: 0, schedule: "Wed/Fri 2:00–4:00",  room: "CSB-301", compulsory: false },
    { id: "C005", code: "CS402", name: "Web Development",                credits: 3, staffId: "S005", dept: "Electronics",      category: "Elective", totalSeats: 60, enrolledSeats: 0, schedule: "Tue/Thu 2:00–3:30",  room: "ELB-201", compulsory: false },
    { id: "C006", code: "MA201", name: "Linear Algebra",                 credits: 3, staffId: "S006", dept: "Mathematics",      category: "Core",     totalSeats: 70, enrolledSeats: 0, schedule: "Mon/Wed/Fri 8:00–9:00", room: "MAB-101", compulsory: true  },
    { id: "C007", code: "MA301", name: "Probability & Statistics",       credits: 3, staffId: "S007", dept: "Mathematics",      category: "Core",     totalSeats: 65, enrolledSeats: 0, schedule: "Tue/Thu 9:00–10:30", room: "MAB-201", compulsory: false },
    { id: "C008", code: "CS501", name: "Cloud Computing",                credits: 3, staffId: "S008", dept: "Computer Science", category: "Elective", totalSeats: 35, enrolledSeats: 0, schedule: "Mon/Wed 2:00–3:30",  room: "CSB-401", compulsory: false },
  ],

  // ── Students ─────────────────────────────────────────────
  students: [
    { id: "ST001", name: "Arjun Venkatesh", rollNo: "21CS001", dept: "Computer Science", year: 2, registrations: [] },
    { id: "ST002", name: "Divya Lakshmi",   rollNo: "21CS002", dept: "Computer Science", year: 2, registrations: [] },
  ],

  // ── Active student session (simulates login) ──────────────
  currentStudentId: "ST001",

  // ── Helpers ──────────────────────────────────────────────
  getCourse(id)   { return this.courses.find(c => c.id === id); },
  getStaff(id)    { return this.staff.find(s => s.id === id); },
  getStudent(id)  { return this.students.find(s => s.id === id); },

  enrollStudent(studentId, courseId) {
    const student = this.getStudent(studentId);
    const course  = this.getCourse(courseId);
    if (!student || !course) return { ok: false, msg: "Not found" };
    if (student.registrations.includes(courseId)) return { ok: false, msg: "Already enrolled" };
    if (course.enrolledSeats >= course.totalSeats) return { ok: false, msg: "No seats available" };
    const currentCredits = student.registrations.reduce((s, id) => s + (this.getCourse(id)?.credits || 0), 0);
    if (currentCredits + course.credits > this.settings.maxCredits)
      return { ok: false, msg: `Exceeds max credit limit of ${this.settings.maxCredits}` };
    student.registrations.push(courseId);
    course.enrolledSeats += 1;
    return { ok: true };
  },

  dropStudent(studentId, courseId) {
    const student = this.getStudent(studentId);
    const course  = this.getCourse(courseId);
    if (!student || !course) return { ok: false, msg: "Not found" };
    if (!student.registrations.includes(courseId)) return { ok: false, msg: "Not enrolled" };
    student.registrations = student.registrations.filter(id => id !== courseId);
    course.enrolledSeats = Math.max(0, course.enrolledSeats - 1);
    return { ok: true };
  },

  addCourse(data) {
    const id = "C" + String(Date.now()).slice(-6);
    this.courses.push({ id, enrolledSeats: 0, ...data });
    return id;
  },

  updateCourse(id, data) {
    const idx = this.courses.findIndex(c => c.id === id);
    if (idx === -1) return false;
    this.courses[idx] = { ...this.courses[idx], ...data };
    return true;
  },

  deleteCourse(id) {
    // Remove from all student registrations first
    this.students.forEach(s => { s.registrations = s.registrations.filter(r => r !== id); });
    this.courses = this.courses.filter(c => c.id !== id);
  },

  addStaff(data) {
    const id = "S" + String(Date.now()).slice(-3);
    this.staff.push({ id, ...data });
    return id;
  },

  removeStaff(id) {
    // Unassign from courses
    this.courses.forEach(c => { if (c.staffId === id) c.staffId = null; });
    this.staff = this.staff.filter(s => s.id !== id);
  },
};