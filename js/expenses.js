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
    orderBy
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const tableBody =
    document.getElementById(
        "expenseTableBody"
    );


const totalElement =
    document.getElementById(
        "totalExpenses"
    );


const logoutButton =
    document.getElementById(
        "logoutButton"
    );



/* ========================================
   CHECK LOGIN
======================================== */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        await loadExpenses();

    }
);



/* ========================================
   LOAD EXPENSES
======================================== */

async function loadExpenses() {

    try {

        const expensesRef =
            collection(
                db,
                "expenses"
            );


        const expensesQuery =
            query(
                expensesRef,

                where(
                    "festivalYear",
                    "==",
                    "2026"
                ),

                orderBy(
                    "date",
                    "desc"
                )
            );


        const snapshot =
            await getDocs(
                expensesQuery
            );


        tableBody.innerHTML = "";


        let total = 0;


        if (snapshot.empty) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="5">
                        No expenses recorded yet.
                    </td>
                </tr>
            `;

            totalElement.textContent =
                "₹0";

            return;

        }


        snapshot.forEach(
            (documentSnapshot) => {

                const expense =
                    documentSnapshot.data();


                total +=
                    Number(
                        expense.amount
                    );


                let date = "N/A";


                if (expense.date) {

                    date =
                        expense.date
                            .toDate()
                            .toLocaleDateString(
                                "en-IN"
                            );

                }


                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>
                        ${date}
                    </td>

                    <td>
                        ${expense.title || "N/A"}
                    </td>

                    <td>
                        ${expense.category || "N/A"}
                    </td>

                    <td>
                        ₹${Number(
                            expense.amount
                        ).toLocaleString("en-IN")}
                    </td>

                    <td>
                        ${expense.description || "N/A"}
                    </td>

                `;


                tableBody.appendChild(
                    row
                );

            }
        );


        totalElement.textContent =
            "₹" +
            total.toLocaleString(
                "en-IN"
            );


    } catch (error) {

        console.error(
            "Error loading expenses:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    Unable to load expenses.
                </td>
            </tr>
        `;

    }

}



/* ========================================
   LOGOUT
======================================== */

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