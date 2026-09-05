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
    addDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ===============================
// HTML ELEMENTS
// ===============================

const festivalYear = document.getElementById("festivalYear");

const migrateBtn = document.getElementById("migrateBtn");

const message = document.getElementById("message");

const logoutBtn = document.getElementById("logoutBtn");


// ===============================
// CHECK ADMIN
// ===============================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "../login.html";

        return;
    }


    try {

        const userRef = doc(
            db,
            "users",
            user.uid
        );

        const userSnapshot = await getDoc(userRef);


        if (!userSnapshot.exists()) {

            await signOut(auth);

            window.location.href = "../login.html";

            return;
        }


        const userData = userSnapshot.data();


        if (userData.role !== "admin") {

            alert(
                "Access denied. Admin account required."
            );

            window.location.href = "../dashboard.html";

            return;
        }


    } catch (error) {

        console.error(
            "Error checking admin:",
            error
        );

        alert(
            "Unable to verify admin access."
        );

        window.location.href =
            "../dashboard.html";
    }

});


// ===============================
// MIGRATE EXPENSES
// ===============================

migrateBtn.addEventListener(
    "click",
    async () => {

        const year = festivalYear.value;


        message.textContent =
            "Publishing expenses...";


        migrateBtn.disabled = true;


        try {

            // ===============================
            // GET PRIVATE EXPENSES
            // ===============================

            const expensesQuery = query(

                collection(
                    db,
                    "expenses"
                ),

                where(
                    "festivalYear",
                    "==",
                    year
                )

            );


            const expensesSnapshot =
                await getDocs(
                    expensesQuery
                );


            // ===============================
            // GET EXISTING PUBLIC EXPENSES
            // ===============================

            const publicQuery = query(

                collection(
                    db,
                    "publicExpenses"
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


            // ===============================
            // CREATE SIGNATURES
            // ===============================

            const existingPublicExpenses =
                new Set();


            publicSnapshot.forEach(
                (docSnapshot) => {

                    const data =
                        docSnapshot.data();


                    const signature =
                        createSignature(
                            data
                        );


                    existingPublicExpenses.add(
                        signature
                    );

                }
            );


            // ===============================
            // COPY EXPENSES
            // ===============================

            let addedCount = 0;

            let skippedCount = 0;


            for (
                const expenseDoc
                of expensesSnapshot.docs
            ) {

                const expense =
                    expenseDoc.data();


                const publicExpense = {

                    title:
                        expense.title || "",

                    category:
                        expense.category || "",

                    amount:
                        Number(
                            expense.amount || 0
                        ),

                    description:
                        expense.description || "",

                    festivalYear:
                        expense.festivalYear,

                    date:
                        expense.date || null

                };


                const signature =
                    createSignature(
                        publicExpense
                    );


                // ===============================
                // PREVENT DUPLICATES
                // ===============================

                if (
                    existingPublicExpenses.has(
                        signature
                    )
                ) {

                    skippedCount++;

                    continue;
                }


                // ===============================
                // ADD PUBLIC EXPENSE
                // ===============================

                await addDoc(

                    collection(
                        db,
                        "publicExpenses"
                    ),

                    publicExpense

                );


                existingPublicExpenses.add(
                    signature
                );


                addedCount++;

            }


            // ===============================
            // RESULT
            // ===============================

            message.textContent =
                `Migration complete! ` +
                `${addedCount} expense(s) published, ` +
                `${skippedCount} duplicate(s) skipped.`;

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


// ===============================
// CREATE SIGNATURE
// ===============================

function createSignature(data) {

    let dateValue = "";


    if (data.date?.toDate) {

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

        data.title || "",

        data.category || "",

        Number(
            data.amount || 0
        ),

        data.description || "",

        data.festivalYear || "",

        dateValue

    ].join("|");

}


// ===============================
// LOGOUT
// ===============================

logoutBtn.addEventListener(
    "click",
    async (event) => {

        event.preventDefault();

        await signOut(auth);

        window.location.href =
            "../login.html";

    }
);