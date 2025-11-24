import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD23qB_JTn6PjNdLmXaMd-ZLegBds4s-R0",
  authDomain: "student-teacher-booking-2004.firebaseapp.com",
  projectId: "student-teacher-booking-2004",
  storageBucket: "student-teacher-booking-2004.firebasestorage.app",
  messagingSenderId: "361525033372",
  appId: "1:361525033372:web:74fa91ecc9e10a85343059",
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
