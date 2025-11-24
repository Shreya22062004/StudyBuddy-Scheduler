import { auth, db } from './firebase.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import {
  collection, addDoc, getDocs, setDoc, doc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const logoutBtn = document.getElementById('logoutBtn');
logoutBtn.onclick = async () => {
  await signOut(auth);
  showAuth();
  logAction("logout");
  localStorage.removeItem("role");
};

// --- Initial UI Call ---
showAuth();

function showAuth() {
  document.getElementById('authSection').style.display = '';
  document.getElementById('adminSection').style.display = 'none';
  document.getElementById('studentSection').style.display = 'none';
  document.getElementById('teacherSection').style.display = 'none';
  logoutBtn.style.display = 'none';
  document.getElementById('authSection').innerHTML = `
    <div class="card">
      <h2>Login / Register</h2>
      <input id="loginEmail" type="email" placeholder="Email"/>
      <input id="loginPassword" type="password" placeholder="Password"/>
      <select id="roleSel">
        <option value="student">Student</option>
        <option value="teacher">Teacher</option>
        <option value="admin">Admin</option>
      </select>
      <button id="loginBtn">Login</button>
      <button id="registerBtn">Register</button>
    </div>
  `;
  document.getElementById("loginBtn").onclick = loginUser;
  document.getElementById("registerBtn").onclick = registerUser;
}

// --- Auth Logic ---
async function loginUser() {
  let email = document.getElementById('loginEmail').value;
  let pwd = document.getElementById('loginPassword').value;
  let role = document.getElementById('roleSel').value;
  try {
    await signInWithEmailAndPassword(auth, email, pwd);
    localStorage.setItem("role", role);
    showDashboard();
    logAction("login");
  } catch (e) {
    alert(e.message);
  }
}

async function registerUser() {
  let email = document.getElementById('loginEmail').value;
  let pwd = document.getElementById('loginPassword').value;
  try {
    await createUserWithEmailAndPassword(auth, email, pwd);
    logAction("register");
    alert('Registered. Please login again.');
    showAuth();
  } catch (e) {
    alert(e.message);
  }
}

// --- Dashboard Routing ---
function showDashboard() {
  document.getElementById('authSection').style.display = 'none';
  logoutBtn.style.display = '';
  let role = localStorage.getItem("role") || "student";
  auth.onAuthStateChanged(user => {
    if (user) {
      if (role === 'admin') renderAdmin();
      else if (role === 'teacher') renderTeacher(user.email);
      else renderStudent(user.email);
    }
  });
}

// --- ADMIN ---
function renderAdmin() {
  document.getElementById('adminSection').style.display = '';
  document.getElementById('studentSection').style.display = 'none';
  document.getElementById('teacherSection').style.display = 'none';
  document.getElementById('adminSection').innerHTML = `
    <div class="card">
      <h2>Teacher Management</h2>
      <input id="teacherName" placeholder="Full Name"/>
      <input id="department" placeholder="Department"/>
      <input id="subject" placeholder="Subject"/>
      <input id="teacherEmail" type="email" placeholder="Teacher Email"/>
      <button id="addTeacherBtn">Add Teacher</button>
      <div id="teacherList"></div>
    </div>
    <div class="card">
      <h2>User Registration (Simulation)</h2>
      <div id="regList"><i>Approve/reject user registrations</i></div>
    </div>
  `;
  document.getElementById("addTeacherBtn").onclick = async function() {
    let name = document.getElementById('teacherName').value;
    let dept = document.getElementById('department').value;
    let subj = document.getElementById('subject').value;
    let email = document.getElementById('teacherEmail').value;
    if (!name || !dept || !subj || !email) {
      alert("Please fill all fields including teacher email!");
      return;
    }
    try {
      await addDoc(collection(db, "teachers"), { name, dept, subj, email });
      logAction("add_teacher");
      loadTeachers();
    } catch (err) {
      alert("Error adding teacher. " + err.message);
    }
  };
  loadTeachers();
}

async function loadTeachers() {
  let tList = document.getElementById('teacherList');
  if (!tList) return;
  let data = await getDocs(collection(db, "teachers"));
  tList.innerHTML = "";
  data.forEach(d => {
    tList.innerHTML += `<div>
      ${d.data().name} (${d.data().email}) - ${d.data().dept} - ${d.data().subj}
      <button onclick="deleteTeacher('${d.id}')">Delete</button>
    </div>`;
  });
}

window.deleteTeacher = async function(id) {
  await deleteDoc(doc(db, "teachers", id));
  logAction("delete_teacher");
  loadTeachers();
};

// --- STUDENT ---
function renderStudent(userEmail) {
  document.getElementById('studentSection').style.display = '';
  document.getElementById('teacherSection').style.display = 'none';
  document.getElementById('adminSection').style.display = 'none';
  document.getElementById('studentSection').innerHTML = `
    <div class="card">
      <h2>Book Appointment</h2>
      <select id="bookTeacher"></select>
      <input id="bookSubject" placeholder="Subject"/>
      <input id="bookTime" type="datetime-local"/>
      <textarea id="bookMsg" placeholder="Message"></textarea>
      <button id="bookAppointmentBtn">Book</button>
    </div>
    <div class="card">
      <h2>My Appointments</h2>
      <div id="appointmentList"></div>
    </div>
  `;
  loadTeachersDropdown();
  document.getElementById("bookAppointmentBtn").onclick = function() {
    bookAppointment(userEmail);
  };
  loadAppointments(userEmail);
}

async function loadTeachersDropdown() {
  let sel = document.getElementById('bookTeacher');
  if (!sel) return;
  let data = await getDocs(collection(db, "teachers"));
  sel.innerHTML = "";
  data.forEach(d => {
    sel.innerHTML += `<option value="${d.data().email}">${d.data().name} - ${d.data().dept} (${d.data().subj})</option>`;
  });
}

async function bookAppointment(userEmail) {
  let teacherEmail = document.getElementById('bookTeacher').value;
  let subject = document.getElementById('bookSubject').value;
  let time = document.getElementById('bookTime').value;
  let msg = document.getElementById('bookMsg').value;
  if (!teacherEmail || !subject || !time) {
    alert("Fill all details!");
    return;
  }
  await addDoc(collection(db, "appointments"), {
    teacher: teacherEmail, subject, student: userEmail, datetime: time, message: msg, status: "pending"
  });
  logAction("book_appointment");
  loadAppointments(userEmail);
}

async function loadAppointments(userEmail) {
  let aList = document.getElementById('appointmentList');
  if (!aList) return;
  let data = await getDocs(collection(db, "appointments"));
  aList.innerHTML = "";
  data.forEach(d => {
    let ap = d.data();
    if (ap.student === userEmail && ap.status !== "cancelled") {
      aList.innerHTML += `<div>
        With: ${ap.teacher} | ${ap.datetime} | ${ap.subject}<br>
        <b>Message:</b> ${ap.message ? ap.message : "(No message)"}<br>
        Status: ${ap.status}
        <button onclick="cancelAppointment('${d.id}', '${userEmail}')">Cancel</button>
      </div>`;
    }
  });
}

window.cancelAppointment = async function(id, userEmail) {
  await updateDoc(doc(db, "appointments", id), { status: "cancelled" });
  logAction("cancel_appointment");
  loadAppointments(userEmail);
};

// --- TEACHER ---

function renderTeacher(userEmail) {
  document.getElementById('teacherSection').style.display = '';
  document.getElementById('studentSection').style.display = 'none';
  document.getElementById('adminSection').style.display = 'none';
  document.getElementById('teacherSection').innerHTML = `
    <div class="card">
      <h2>Pending Approvals</h2>
      <div id="teacherPendingAppts"></div>
    </div>
    <div class="card">
      <h2>Appointments List</h2>
      <div id="teacherApprovedAppts"></div>
    </div>
  `;
  loadTeacherPendingAppointments(userEmail);
  loadTeacherApprovedAppointments(userEmail);
}

async function loadTeacherPendingAppointments(userEmail) {
  let tPending = document.getElementById('teacherPendingAppts');
  if (!tPending) return;
  let data = await getDocs(collection(db, "appointments"));
  tPending.innerHTML = "";
  data.forEach(d => {
    let ap = d.data();
    if (ap.teacher === userEmail && ap.status === "pending") {
      tPending.innerHTML += `<div>
        Student: ${ap.student} | ${ap.subject} | ${ap.datetime}<br>
        <b>Message:</b> ${ap.message ? ap.message : "(No message)"}<br>
        Status: ${ap.status}
        <button onclick="approveAppointment('${d.id}', '${userEmail}')">Approve</button>
        <button onclick="cancelAppointment('${d.id}', '${userEmail}')">Cancel</button>
      </div>`;
    }
  });
}

async function loadTeacherApprovedAppointments(userEmail) {
  let tApproved = document.getElementById('teacherApprovedAppts');
  if (!tApproved) return;
  let data = await getDocs(collection(db, "appointments"));
  tApproved.innerHTML = "";
  data.forEach(d => {
    let ap = d.data();
    if (ap.teacher === userEmail && ap.status === "approved") {
      tApproved.innerHTML += `<div>
        Student: ${ap.student} | ${ap.subject} | ${ap.datetime}
        <b>Message:</b> ${ap.message ? ap.message : "(No message)"}<br>
        Status: ${ap.status}
      </div>`;
    }
  });
}

window.approveAppointment = async function(id, userEmail) {
  await updateDoc(doc(db, "appointments", id), { status: "approved" });
  logAction("approve_appointment");
  // Update both lists instantly:
  loadTeacherPendingAppointments(userEmail);
  loadTeacherApprovedAppointments(userEmail);
};

window.cancelAppointment = async function(id, userEmail) {
  await updateDoc(doc(db, "appointments", id), { status: "cancelled" });
  logAction("cancel_appointment");
  loadTeacherPendingAppointments(userEmail);
  loadTeacherApprovedAppointments(userEmail);
};

// --- Logging ---
async function logAction(action) {
  await addDoc(collection(db, "logs"), {
    user: auth.currentUser ? auth.currentUser.email : null,
    action,
    timestamp: new Date().toISOString()
  });
}
