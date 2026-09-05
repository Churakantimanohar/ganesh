import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const donationForm =
    document.getElementById("donationForm");

const message =
    document.getElementById("donationMessage");

const logoutButton =
    document.getElementById("logoutButton");


let currentUser = null;


// ========================================
// CHECK LOGIN
// ========================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;
    }

    currentUser = user;

    console.log(
        "Logged in user:",
        currentUser.uid
    );

});


// ========================================
// SUBMIT DONATION
// ========================================

donationForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        if (!currentUser) {

            message.textContent =
                "Please login before donating.";

            return;
        }


        const donorName =
            document
                .getElementById("donorName")
                .value
                .trim();


        const amount =
            Number(
                document
                    .getElementById("amount")
                    .value
            );


        const paymentMethod =
            document
                .getElementById("paymentMethod")
                .value;


        const festivalYear =
            document
                .getElementById("festivalYear")
                .value;


        // ========================================
        // VALIDATE
        // ========================================

        if (!donorName) {

            message.textContent =
                "Please enter your name.";

            return;
        }


        if (amount <= 0) {

            message.textContent =
                "Donation amount must be greater than ₹0.";

            return;
        }


        if (!paymentMethod) {

            message.textContent =
                "Please select a payment method.";

            return;
        }


        try {

            // ========================================
            // SAVE PRIVATE DONATION
            // ========================================

            await addDoc(
                collection(db, "donations"),
                {

                    donorId:
                        currentUser.uid,

                    donorName:
                        donorName,

                    amount:
                        amount,

                    paymentMethod:
                        paymentMethod,

                    festivalYear:
                        festivalYear,

                    date:
                        serverTimestamp(),

                    // Admin must verify first
                    status:
                        "pending"

                }
            );


            // ========================================
            // SUCCESS
            // ========================================

            message.textContent =
                "Donation submitted successfully! " +
                "It will appear in Transparency after admin verification. 🙏";


            donationForm.reset();


        } catch (error) {

            console.error(
                "Donation error:",
                error
            );


            message.textContent =
                "Unable to record donation.";

        }

    }
);


// ========================================
// LOGOUT
// ========================================

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