import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const userName = document.getElementById("userName");

const accountName = document.getElementById("accountName");

const accountEmail = document.getElementById("accountEmail");

const logoutButton = document.getElementById("logoutButton");
const festivalYear = document.getElementById("festivalYear");
const totalDonations = document.getElementById("totalDonations");
const totalExpenses = document.getElementById("totalExpenses");
const remainingBalance = document.getElementById("remainingBalance");


/* =====================================
   CHECK LOGIN
===================================== */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        // User is not logged in

        window.location.href = "login.html";

        return;
    }


    console.log("Logged in user:", user.uid);


    /* =====================================
       GET USER DATA
    ===================================== */

    try {

        const userRef = doc(
            db,
            "users",
            user.uid
        );


        const userSnapshot =
            await getDoc(userRef);


        if (userSnapshot.exists()) {

            const userData =
                userSnapshot.data();


            userName.textContent =
                userData.name;


            accountName.textContent =
                userData.name;


        } else {

            console.log(
                "User document not found."
            );

        }


        accountEmail.textContent =
            user.email;

        loadFinancialSummary(festivalYear?.value || "2026");


    } catch (error) {

        console.error(
            "Error loading user:",
            error
        );

    }

});

if (festivalYear) {
    festivalYear.addEventListener("change", () => {
        loadFinancialSummary(festivalYear.value);
    });
}

async function loadFinancialSummary(year) {
    try {
        const [donationsSnapshot, expensesSnapshot] = await Promise.all([
            getDocs(collection(db, "publicDonations")),
            getDocs(collection(db, "publicExpenses"))
        ]);

        let donationTotal = 0;
        let expenseTotal = 0;

        donationsSnapshot.forEach((donationDoc) => {
            const donation = donationDoc.data();
            if (
                String(donation.festivalYear) === String(year) &&
                (!donation.status || donation.status === "confirmed")
            ) {
                donationTotal += Number(donation.amount || 0);
            }
        });

        expensesSnapshot.forEach((expenseDoc) => {
            const expense = expenseDoc.data();
            if (String(expense.festivalYear) === String(year)) {
                expenseTotal += Number(expense.amount || 0);
            }
        });

        totalDonations.textContent = formatCurrency(donationTotal);
        totalExpenses.textContent = formatCurrency(expenseTotal);
        remainingBalance.textContent = formatCurrency(donationTotal - expenseTotal);
    } catch (error) {
        console.error("Error loading dashboard financial summary:", error);
        totalDonations.textContent = "Unable to load";
        totalExpenses.textContent = "Unable to load";
        remainingBalance.textContent = "Unable to load";
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2
    }).format(amount);
}


/* =====================================
   LOGOUT
===================================== */

logoutButton.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

            window.location.href =
                "index.html";

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

    }
);