import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    addDoc,
    doc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ===============================
// HTML ELEMENTS
// ===============================

const expenseForm = document.getElementById("expenseForm");

const expenseName = document.getElementById("expenseName");
const category = document.getElementById("category");
const amount = document.getElementById("amount");
const description = document.getElementById("description");
const festivalYear = document.getElementById("festivalYear");
const expenseDate = document.getElementById("expenseDate");


// ===============================
// CHECK ADMIN LOGIN
// ===============================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "../login.html";
        return;

    }

    try {

        const userRef = doc(db, "users", user.uid);

        const userSnapshot = await getDoc(userRef);

        if (!userSnapshot.exists()) {

            await auth.signOut();

            window.location.href = "../login.html";

            return;
        }

        const userData = userSnapshot.data();

        if (userData.role !== "admin") {

            alert("Access denied. Admin account required.");

            window.location.href = "../dashboard.html";

            return;
        }

    } catch (error) {

        console.error("Error checking admin:", error);

        alert("Unable to verify admin access.");

        window.location.href = "../dashboard.html";
    }

});


// ===============================
// ADD EXPENSE
// ===============================

expenseForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    // Get values
    const title = expenseName.value.trim();

    const expenseCategory = category.value.trim();

    const expenseAmount = Number(amount.value);

    const expenseDescription = description.value.trim();

    const year = festivalYear.value;

    const selectedDate = expenseDate.value;


    // ===============================
    // VALIDATION
    // ===============================

    if (!title) {

        alert("Please enter the expense name.");
        return;

    }

    if (!expenseCategory) {

        alert("Please enter the category.");
        return;

    }

    if (!expenseAmount || expenseAmount <= 0) {

        alert("Please enter a valid amount.");
        return;

    }

    if (!year) {

        alert("Please select a festival year.");
        return;

    }

    if (!selectedDate) {

        alert("Please select the expense date.");
        return;

    }


    // ===============================
    // CHECK CURRENT USER
    // ===============================

    const user = auth.currentUser;

    if (!user) {

        alert("Please login first.");

        window.location.href = "../login.html";

        return;
    }


    try {

        // ===============================
        // CREATE PRIVATE EXPENSE
        // ===============================

        const expenseData = {

            title: title,

            category: expenseCategory,

            amount: expenseAmount,

            description: expenseDescription,

            festivalYear: year,

            date: new Date(selectedDate),

            createdBy: user.uid,

            createdAt: serverTimestamp()

        };


      const expenseRef = await addDoc(
    collection(db, "expenses"),
    expenseData
);

const publicExpenseData = {
    privateExpenseId: expenseRef.id,
    title,
    category: expenseCategory,
    amount: expenseAmount,
    description: expenseDescription,
    festivalYear: year,
    date: new Date(selectedDate)
};

await addDoc(
    collection(db, "publicExpenses"),
    publicExpenseData
);


        // ===============================
        // SUCCESS
        // ===============================

        alert("Expense added successfully! ✅");


        // Clear form
        expenseForm.reset();


    } catch (error) {

        console.error("Error adding expense:", error);

        alert(
            "Unable to add expense.\n\n" +
            error.message
        );

    }

});