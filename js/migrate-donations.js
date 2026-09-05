import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    where,
    addDoc,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const festivalYear =
    document.getElementById("festivalYear");

const migrateBtn =
    document.getElementById("migrateBtn");

const message =
    document.getElementById("message");

const logoutBtn =
    document.getElementById("logoutBtn");


// =========================================
// CHECK ADMIN
// =========================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href =
            "../login.html";

        return;
    }


    try {

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );


        const userSnap =
            await getDoc(userRef);


        if (!userSnap.exists()) {

            await signOut(auth);

            window.location.href =
                "../login.html";

            return;
        }


        const userData =
            userSnap.data();


        if (userData.role !== "admin") {

            alert(
                "Access denied. Admin account required."
            );

            window.location.href =
                "../dashboard.html";

            return;
        }


    } catch (error) {

        console.error(
            "Admin verification error:",
            error
        );

        window.location.href =
            "../dashboard.html";

    }

});


// =========================================
// MIGRATE DONATIONS
// =========================================

migrateBtn.addEventListener(
    "click",
    async () => {

        const year =
            festivalYear.value;


        const confirmed =
            confirm(
                `Publish all confirmed donations for ${year} to Transparency?`
            );


        if (!confirmed) {

            return;

        }


        migrateBtn.disabled = true;

        message.textContent =
            "Publishing donations...";


        try {

            // =========================================
            // GET PRIVATE DONATIONS
            // =========================================

            const donationsQuery =
                query(
                    collection(
                        db,
                        "donations"
                    ),

                    where(
                        "festivalYear",
                        "==",
                        year
                    )
                );


            const donationsSnapshot =
                await getDocs(
                    donationsQuery
                );


            // =========================================
            // GET EXISTING PUBLIC DONATIONS
            // =========================================

            const publicQuery =
                query(
                    collection(
                        db,
                        "publicDonations"
                    ),

                    where(
                        "festivalYear",
                        "==",
                        year
                    )
                );


            const publicSnapshot =
                await getDocs(
                    publicQuery
                );


            // =========================================
            // CREATE DUPLICATE SIGNATURES
            // =========================================

            const existingPublic =
                new Set();


            publicSnapshot.forEach(
                (publicDoc) => {

                    const data =
                        publicDoc.data();


                    existingPublic.add(
                        createSignature(data)
                    );

                }
            );


            let addedCount = 0;

            let skippedCount = 0;

            let pendingCount = 0;


            // =========================================
            // PROCESS DONATIONS
            // =========================================

            for (
                const donationDoc
                of donationsSnapshot.docs
            ) {

                const donation =
                    donationDoc.data();


                // Only publish confirmed donations

                if (
                    donation.status !==
                    "confirmed"
                ) {

                    pendingCount++;

                    continue;

                }


                const publicDonation = {

                    donorName:
                        donation.donorName ||
                        "Anonymous",

                    amount:
                        Number(
                            donation.amount || 0
                        ),

                    paymentMethod:
                        donation.paymentMethod ||
                        "",

                    festivalYear:
                        donation.festivalYear,

                    date:
                        donation.date ||
                        null,

                    status:
                        "confirmed"

                };


                const signature =
                    createSignature(
                        publicDonation
                    );


                // =========================================
                // SKIP DUPLICATES
                // =========================================

                if (
                    existingPublic.has(
                        signature
                    )
                ) {

                    skippedCount++;

                    continue;

                }


                // =========================================
                // ADD PUBLIC DONATION
                // =========================================

                await addDoc(

                    collection(
                        db,
                        "publicDonations"
                    ),

                    publicDonation

                );


                existingPublic.add(
                    signature
                );


                addedCount++;

            }


            // =========================================
            // RESULT
            // =========================================

            message.textContent =
                `Migration complete! ` +
                `${addedCount} donation(s) published, ` +
                `${skippedCount} duplicate(s) skipped, ` +
                `${pendingCount} pending donation(s) skipped.`;

            message.style.color =
                "green";


        } catch (error) {

            console.error(
                "Migration error:",
                error
            );


            message.textContent =
                "Migration failed: " +
                error.message;

            message.style.color =
                "red";

        }


        migrateBtn.disabled = false;

    }
);


// =========================================
// CREATE SIGNATURE
// =========================================

function createSignature(data) {

    let dateValue = "";


    if (
        data.date &&
        typeof data.date.toDate ===
        "function"
    ) {

        dateValue =
            data.date
                .toDate()
                .getTime();

    } else if (
        data.date instanceof Date
    ) {

        dateValue =
            data.date.getTime();

    } else if (data.date) {

        dateValue =
            new Date(
                data.date
            ).getTime();

    }


    return [

        data.donorName || "",

        Number(
            data.amount || 0
        ),

        data.paymentMethod || "",

        data.festivalYear || "",

        dateValue

    ].join("|");

}


// =========================================
// LOGOUT
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