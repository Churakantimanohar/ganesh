import { auth, db } from "./firebase-config.js";


import { signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


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

const festivalYear = document.getElementById("festivalYear");



/* ========================================
   CHECK LOGIN
======================================== */

loadExpenses(festivalYear?.value || "2026");

if (festivalYear) {
    festivalYear.addEventListener("change", () => loadExpenses(festivalYear.value));
}



/* ========================================
   LOAD EXPENSES
======================================== */

async function loadExpenses(year) {

    try {

        const snapshot = await getDocs(collection(db, "publicExpenses"));
        const expenses = snapshot.docs
            .map((documentSnapshot) => ({ id: documentSnapshot.id, ...documentSnapshot.data() }))
            .filter((expense) => String(expense.festivalYear) === String(year))
            .sort((a, b) => getDateValue(b.date) - getDateValue(a.date));


        tableBody.innerHTML = "";


        let total = 0;


        if (expenses.length === 0) {

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


        expenses.forEach(
            (expense) => {


                total +=
                    Number(
                        expense.amount
                    );


                let date = "N/A";


                date = formatDate(expense.date);


                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>
                        ${date}
                    </td>

                    <td>
                        ${escapeHTML(expense.title || "N/A")}
                    </td>

                    <td>
                        ${escapeHTML(expense.category || "N/A")}
                    </td>

                    <td>
                        ₹${Number(
                            expense.amount
                        ).toLocaleString("en-IN")}
                    </td>

                    <td>
                        ${escapeHTML(expense.description || "N/A")}
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

logoutButton?.addEventListener(
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

function formatDate(value) {
    if (!value) return "N/A";
    const date = value?.toDate ? value.toDate() : new Date(value);
    return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString("en-IN");
}

function getDateValue(value) {
    if (!value) return 0;
    const date = value?.toDate ? value.toDate() : new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function escapeHTML(value) {
    const element = document.createElement("div");
    element.textContent = value;
    return element.innerHTML;
}