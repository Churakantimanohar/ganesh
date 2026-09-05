
import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =========================================
// HTML Elements
// =========================================

const adminName = document.getElementById("adminName");
const adminEmail = document.getElementById("adminEmail");
const adminRole = document.getElementById("adminRole");

const totalDonations = document.getElementById("totalDonations");
const totalExpenses = document.getElementById("totalExpenses");
const remainingBalance = document.getElementById("remainingBalance");

const festivalYear = document.getElementById("festivalYear");

const logoutBtn = document.getElementById("logoutBtn");


// =========================================
// Check Admin Login
// =========================================

onAuthStateChanged(auth, async (user) => {

    // Not logged in
    if (!user) {

        window.location.href = "../login.html";

        return;
    }


    try {

        // Get user document
        const userRef = doc(db, "users", user.uid);

        const userSnap = await getDoc(userRef);


        // User document doesn't exist
        if (!userSnap.exists()) {

            alert("User account information not found.");

            await signOut(auth);

            window.location.href = "../login.html";

            return;
        }


        const userData = userSnap.data();


        // Check admin role
        if (userData.role !== "admin") {

            alert("Access denied. Admin account required.");

            window.location.href = "../dashboard.html";

            return;
        }


        // Display admin information
        adminName.textContent = userData.name || "Admin";

        adminEmail.textContent = userData.email || user.email;

        adminRole.textContent = "Admin";


        // Load financial data
        loadFinancialSummary(festivalYear.value);


    } catch (error) {

        console.error(
            "Admin verification error:",
            error
        );

        alert("Unable to verify admin access.");

        window.location.href = "../dashboard.html";
    }

});


// =========================================
// Load Financial Summary
// =========================================

async function loadFinancialSummary(year) {

    try {

        // =========================
        // Get Donations
        // =========================

        const donationQuery = query(
            collection(db, "donations"),
            where("festivalYear", "==", year)
        );

        const donationSnapshot =
            await getDocs(donationQuery);


        let donationTotal = 0;


        donationSnapshot.forEach((doc) => {

            const data = doc.data();

            donationTotal += Number(data.amount) || 0;

        });


        // =========================
        // Get Expenses
        // =========================

        const expenseQuery = query(
            collection(db, "expenses"),
            where("festivalYear", "==", year)
        );

        const expenseSnapshot =
            await getDocs(expenseQuery);


        let expenseTotal = 0;


        expenseSnapshot.forEach((doc) => {

            const data = doc.data();

            expenseTotal += Number(data.amount) || 0;

        });


        // =========================
        // Calculate Balance
        // =========================

        const balance =
            donationTotal - expenseTotal;


        // =========================
        // Display Values
        // =========================

        totalDonations.textContent =
            formatCurrency(donationTotal);

        totalExpenses.textContent =
            formatCurrency(expenseTotal);

        remainingBalance.textContent =
            formatCurrency(balance);


    } catch (error) {

        console.error(
            "Error loading financial summary:",
            error
        );

        totalDonations.textContent = "₹0";

        totalExpenses.textContent = "₹0";

        remainingBalance.textContent = "₹0";
    }

}


// =========================================
// Format Currency
// =========================================

function formatCurrency(amount) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }
    ).format(amount);

}


// =========================================
// Festival Year Change
// =========================================

festivalYear.addEventListener(
    "change",
    () => {

        loadFinancialSummary(
            festivalYear.value
        );

    }
);


// =========================================
// Logout
// =========================================

logoutBtn.addEventListener(
    "click",
    async (event) => {

        event.preventDefault();

        try {

            await signOut(auth);

            window.location.href =
                "../login.html";

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

    }
);
