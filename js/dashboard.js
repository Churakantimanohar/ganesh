import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const userName = document.getElementById("userName");

const accountName = document.getElementById("accountName");

const accountEmail = document.getElementById("accountEmail");

const logoutButton = document.getElementById("logoutButton");


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


    } catch (error) {

        console.error(
            "Error loading user:",
            error
        );

    }

});


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