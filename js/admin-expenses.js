import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Elements
const expenseForm = document.getElementById("expenseForm");
const message = document.getElementById("message");
const logoutBtn = document.getElementById("logoutBtn");

// ===============================
// Check Login & Admin Role
// ===============================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../login.html";
    return;
  }

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      alert("User profile not found.");
      await signOut(auth);
      window.location.href = "../login.html";
      return;
    }

    const userData = userSnap.data();

    if (userData.role !== "admin") {
      alert("Access denied. Admin account required.");
      window.location.href = "../dashboard.html";
      return;
    }

    console.log("Admin access granted.");
  } catch (error) {
    console.error("Admin verification error:", error);
    alert("Unable to verify admin access.");
    window.location.href = "../dashboard.html";
  }
});

// ===============================
// Add Expense
// ===============================
expenseForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const user = auth.currentUser;

  if (!user) {
    alert("Please login first.");
    return;
  }

  const expenseName = document.getElementById("expenseName").value.trim();
  const category = document.getElementById("category").value;
  const amount = Number(document.getElementById("amount").value);
  const description = document.getElementById("description").value.trim();
  const festivalYear = document.getElementById("festivalYear").value;
  const expenseDate = document.getElementById("expenseDate").value;

  if (!expenseName || !category || amount <= 0 || !expenseDate) {
    message.style.color = "red";
    message.textContent = "Please fill all required fields correctly.";
    return;
  }

  try {
    await addDoc(collection(db, "expenses"), {
      title: expenseName,
      category: category,
      amount: amount,
      description: description,
      festivalYear: festivalYear,

      // Keep this field name as 'date'
      date: new Date(expenseDate),

      createdBy: user.uid,
      createdAt: serverTimestamp()
    });

    message.style.color = "green";
    message.textContent = "Expense added successfully! ✅";

    expenseForm.reset();
  } catch (error) {
    console.error("Error adding expense:", error);
    message.style.color = "red";
    message.textContent = "Failed to add expense: " + error.message;
  }
});

// ===============================
// Logout
// ===============================
logoutBtn.addEventListener("click", async (event) => {
  event.preventDefault();

  try {
    await signOut(auth);
    window.location.href = "../login.html";
  } catch (error) {
    console.error("Logout error:", error);
  }
});