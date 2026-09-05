
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
    where,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =========================================
// Elements
// =========================================

const festivalYear =
    document.getElementById("festivalYear");

const expenseTableBody =
    document.getElementById("expenseTableBody");

const totalExpenses =
    document.getElementById("totalExpenses");

const logoutBtn =
    document.getElementById("logoutBtn");

const editModal =
    document.getElementById("editModal");

const closeModal =
    document.getElementById("closeModal");

const editExpenseForm =
    document.getElementById("editExpenseForm");

const editMessage =
    document.getElementById("editMessage");


// =========================================
// Admin Authentication
// =========================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "../login.html";

        return;
    }


    try {

        const userRef =
            doc(db, "users", user.uid);

        const userSnap =
            await getDoc(userRef);


        if (!userSnap.exists()) {

            alert("User profile not found.");

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


        console.log(
            "Admin access granted."
        );


        loadExpenses(
            festivalYear.value
        );

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
// Load Expenses
// =========================================

async function loadExpenses(year) {

    expenseTableBody.innerHTML = `
        <tr>
            <td colspan="6">
                Loading expenses...
            </td>
        </tr>
    `;


    try {

        const expenseQuery = query(
            collection(db, "expenses"),
            where(
                "festivalYear",
                "==",
                year
            )
        );


        const snapshot =
            await getDocs(expenseQuery);


        expenseTableBody.innerHTML = "";


        let total = 0;


        if (snapshot.empty) {

            expenseTableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        No expenses found.
                    </td>
                </tr>
            `;

            totalExpenses.textContent = "₹0";

            return;
        }


        const expenses = [];


        snapshot.forEach((expenseDoc) => {

            const data =
                expenseDoc.data();


            expenses.push({
                id: expenseDoc.id,
                ...data
            });

        });


        // Sort newest first
        expenses.sort((a, b) => {

            const dateA =
                getDateValue(a.date);

            const dateB =
                getDateValue(b.date);

            return dateB - dateA;

        });


        expenses.forEach((expense) => {

            const amount =
                Number(expense.amount) || 0;


            total += amount;


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${formatDate(expense.date)}
                </td>

                <td>
                    ${escapeHtml(
                        expense.title || "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        expense.category || "-"
                    )}
                </td>

                <td>
                    ${formatCurrency(amount)}
                </td>

                <td>
                    ${escapeHtml(
                        expense.description || "-"
                    )}
                </td>

                <td>

                    <button
                        class="edit-btn"
                        data-id="${expense.id}"
                    >
                        Edit
                    </button>

                    <button
                        class="delete-btn"
                        data-id="${expense.id}"
                    >
                        Delete
                    </button>

                </td>
            `;


            expenseTableBody.appendChild(row);

        });


        totalExpenses.textContent =
            formatCurrency(total);


        // Add button events
        document
            .querySelectorAll(".edit-btn")
            .forEach((button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const expense =
                            expenses.find(
                                item =>
                                    item.id ===
                                    button.dataset.id
                            );

                        if (expense) {

                            openEditModal(
                                expense
                            );

                        }

                    }
                );

            });


        document
            .querySelectorAll(".delete-btn")
            .forEach((button) => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteExpense(
                            button.dataset.id
                        );

                    }
                );

            });


    } catch (error) {

        console.error(
            "Error loading expenses:",
            error
        );


        expenseTableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    Unable to load expenses.
                </td>
            </tr>
        `;
    }

}


// =========================================
// Open Edit Modal
// =========================================

function openEditModal(expense) {

    document.getElementById(
        "editExpenseId"
    ).value = expense.id;


    document.getElementById(
        "editExpenseName"
    ).value =
        expense.title || "";


    document.getElementById(
        "editCategory"
    ).value =
        expense.category || "Other";


    document.getElementById(
        "editAmount"
    ).value =
        expense.amount || "";


    document.getElementById(
        "editDescription"
    ).value =
        expense.description || "";


    document.getElementById(
        "editDate"
    ).value =
        getDateForInput(expense.date);


    editMessage.textContent = "";


    editModal.style.display = "flex";
}


// =========================================
// Close Modal
// =========================================

closeModal.addEventListener(
    "click",
    () => {

        editModal.style.display = "none";

    }
);


// Close when clicking outside
editModal.addEventListener(
    "click",
    (event) => {

        if (event.target === editModal) {

            editModal.style.display =
                "none";

        }

    }
);


// =========================================
// Save Edited Expense
// =========================================

editExpenseForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const expenseId =
            document.getElementById(
                "editExpenseId"
            ).value;


        const title =
            document.getElementById(
                "editExpenseName"
            ).value.trim();


        const category =
            document.getElementById(
                "editCategory"
            ).value;


        const amount =
            Number(
                document.getElementById(
                    "editAmount"
                ).value
            );


        const description =
            document.getElementById(
                "editDescription"
            ).value.trim();


        const date =
            document.getElementById(
                "editDate"
            ).value;


        if (
            !title ||
            !category ||
            amount <= 0 ||
            !date
        ) {

            editMessage.textContent =
                "Please fill all required fields.";

            return;
        }


        try {

            await updateDoc(
                doc(
                    db,
                    "expenses",
                    expenseId
                ),
                {
                    title: title,
                    category: category,
                    amount: amount,
                    description: description,
                    date: new Date(date)
                }
            );


            editMessage.textContent =
                "Expense updated successfully!";


            setTimeout(() => {

                editModal.style.display =
                    "none";

                loadExpenses(
                    festivalYear.value
                );

            }, 700);


        } catch (error) {

            console.error(
                "Error updating expense:",
                error
            );


            editMessage.textContent =
                "Failed to update expense.";
        }

    }
);


// =========================================
// Delete Expense
// =========================================

async function deleteExpense(expenseId) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this expense?"
        );


    if (!confirmDelete) {

        return;
    }


    try {

        await deleteDoc(
            doc(
                db,
                "expenses",
                expenseId
            )
        );


        alert(
            "Expense deleted successfully."
        );


        loadExpenses(
            festivalYear.value
        );


    } catch (error) {

        console.error(
            "Error deleting expense:",
            error
        );


        alert(
            "Failed to delete expense."
        );
    }

}


// =========================================
// Festival Year Change
// =========================================

festivalYear.addEventListener(
    "change",
    () => {

        loadExpenses(
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

        await signOut(auth);

        window.location.href =
            "../login.html";

    }
);


// =========================================
// Helpers
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


function formatDate(dateValue) {

    const date =
        convertToDate(dateValue);


    if (!date) {

        return "-";

    }


    return date.toLocaleDateString(
        "en-IN"
    );

}


function getDateValue(dateValue) {

    const date =
        convertToDate(dateValue);


    return date
        ? date.getTime()
        : 0;

}


function convertToDate(value) {

    if (!value) {

        return null;

    }


    if (
        typeof value.toDate ===
        "function"
    ) {

        return value.toDate();

    }


    if (value instanceof Date) {

        return value;

    }


    const date =
        new Date(value);


    return isNaN(date.getTime())
        ? null
        : date;

}


function getDateForInput(value) {

    const date =
        convertToDate(value);


    if (!date) {

        return "";

    }


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


// Prevent HTML injection
function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}

