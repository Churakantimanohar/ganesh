import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const festivalYear = document.getElementById("festivalYear");
const expenseTableBody = document.getElementById("expenseTableBody");

const editExpenseSection =
    document.getElementById("editExpenseSection");

const editExpenseForm =
    document.getElementById("editExpenseForm");

const editExpenseName =
    document.getElementById("editExpenseName");

const editCategory =
    document.getElementById("editCategory");

const editAmount =
    document.getElementById("editAmount");

const editDescription =
    document.getElementById("editDescription");

const editFestivalYear =
    document.getElementById("editFestivalYear");

const editExpenseDate =
    document.getElementById("editExpenseDate");

const cancelEditBtn =
    document.getElementById("cancelEditBtn");

let allExpenses = [];
let editingExpenseId = null;


// =================================
// ADMIN CHECK
// =================================

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

        const userSnapshot =
            await getDoc(userRef);

        if (!userSnapshot.exists()) {

            await auth.signOut();

            window.location.href =
                "../login.html";

            return;
        }

        const userData =
            userSnapshot.data();

        if (userData.role !== "admin") {

            alert(
                "Access denied. Admin account required."
            );

            window.location.href =
                "../dashboard.html";

            return;
        }

        loadExpenses();

    } catch (error) {

        console.error(
            "Admin verification error:",
            error
        );

        alert(
            "Unable to verify admin access."
        );

        window.location.href =
            "../dashboard.html";
    }

});


// =================================
// LOAD EXPENSES
// =================================

async function loadExpenses() {

    try {

        const year = festivalYear.value;

        const expensesQuery = query(
            collection(db, "expenses"),
            where("festivalYear", "==", year)
        );

        const snapshot =
            await getDocs(expensesQuery);

        allExpenses = [];

        snapshot.forEach((expenseDoc) => {

            allExpenses.push({
                id: expenseDoc.id,
                ...expenseDoc.data()
            });

        });

        allExpenses.sort(
            (a, b) =>
                getDateValue(b.date) -
                getDateValue(a.date)
        );

        renderExpenses();

    } catch (error) {

        console.error(
            "Error loading expenses:",
            error
        );

        expenseTableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    Unable to load expenses.
                </td>
            </tr>
        `;
    }
}


// =================================
// RENDER EXPENSES
// =================================

function renderExpenses() {

    if (allExpenses.length === 0) {

        expenseTableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    No expenses found.
                </td>
            </tr>
        `;

        return;
    }

    expenseTableBody.innerHTML =
        allExpenses.map((expense) => {

            return `
                <tr>

                    <td>
                        ${formatDate(expense.date)}
                    </td>

                    <td>
                        ${escapeHTML(
                            expense.title || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            expense.category || "-"
                        )}
                    </td>

                    <td>
                        ${formatCurrency(
                            Number(expense.amount || 0)
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            expense.description || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            expense.festivalYear || "-"
                        )}
                    </td>

                    <td>

                        <button
                            type="button"
                            class="edit-btn"
                            data-id="${expense.id}">
                            ✏️ Edit
                        </button>

                        <button
                            type="button"
                            class="delete-btn"
                            data-id="${expense.id}">
                            🗑️ Delete
                        </button>

                    </td>

                </tr>
            `;

        }).join("");


    document
        .querySelectorAll(".edit-btn")
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {
                    startEdit(
                        button.dataset.id
                    );
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

}


// =================================
// START EDIT
// =================================

function startEdit(expenseId) {

    const expense =
        allExpenses.find(
            item => item.id === expenseId
        );

    if (!expense) {

        alert("Expense not found.");

        return;
    }

    editingExpenseId = expenseId;

    editExpenseName.value =
        expense.title || "";

    editCategory.value =
        expense.category || "";

    editAmount.value =
        expense.amount || "";

    editDescription.value =
        expense.description || "";

    editFestivalYear.value =
        expense.festivalYear || festivalYear.value;

    editExpenseDate.value =
        getInputDate(expense.date);

    editExpenseSection.style.display =
        "block";

    editExpenseSection.scrollIntoView({
        behavior: "smooth"
    });
}


// =================================
// UPDATE EXPENSE
// =================================

editExpenseForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        if (!editingExpenseId) {
            return;
        }

        const title =
            editExpenseName.value.trim();

        const category =
            editCategory.value.trim();

        const amount =
            Number(editAmount.value);

        const description =
            editDescription.value.trim();

        const year =
            editFestivalYear.value;

        const selectedDate =
            editExpenseDate.value;


        if (!title) {

            alert(
                "Enter expense name."
            );

            return;
        }

        if (!category) {

            alert(
                "Enter category."
            );

            return;
        }

        if (!amount || amount <= 0) {

            alert(
                "Enter a valid amount."
            );

            return;
        }

        if (!selectedDate) {

            alert(
                "Select expense date."
            );

            return;
        }


        try {

            // Find the original expense
            const originalExpense =
                allExpenses.find(
                    expense =>
                        expense.id ===
                        editingExpenseId
                );

            if (!originalExpense) {

                alert(
                    "Original expense not found."
                );

                return;
            }


            // -----------------------------
            // UPDATE PRIVATE EXPENSE
            // -----------------------------

            const expenseRef =
                doc(
                    db,
                    "expenses",
                    editingExpenseId
                );

            await updateDoc(
                expenseRef,
                {
                    title,
                    category,
                    amount,
                    description,
                    festivalYear: year,
                    date: new Date(selectedDate)
                }
            );


            // -----------------------------
            // FIND PUBLIC EXPENSE BY ID
            // -----------------------------

            const publicQuery = query(
                collection(db, "publicExpenses"),
                where(
                    "privateExpenseId",
                    "==",
                    editingExpenseId
                )
            );

            const publicSnapshot =
                await getDocs(publicQuery);


            // -----------------------------
            // UPDATE PUBLIC EXPENSE
            // -----------------------------

            if (!publicSnapshot.empty) {

                for (
                    const publicDoc
                    of publicSnapshot.docs
                ) {

                    await updateDoc(
                        publicDoc.ref,
                        {
                            title,
                            category,
                            amount,
                            description,
                            festivalYear: year,
                            date: new Date(selectedDate)
                        }
                    );

                }

            } else {

                /*
                 * If the public record does not exist,
                 * create it.
                 */

                await addPublicExpense(
                    editingExpenseId,
                    title,
                    category,
                    amount,
                    description,
                    year,
                    selectedDate
                );
            }


            alert(
                "Expense updated successfully! ✅"
            );

            editingExpenseId = null;

            editExpenseSection.style.display =
                "none";

            editExpenseForm.reset();

            await loadExpenses();

        } catch (error) {

            console.error(
                "Error updating expense:",
                error
            );

            alert(
                "Unable to update expense.\n\n" +
                error.message
            );
        }

    }
);


// =================================
// ADD PUBLIC EXPENSE
// =================================

async function addPublicExpense(
    privateExpenseId,
    title,
    category,
    amount,
    description,
    year,
    selectedDate
) {

    const publicExpenseRef =
        doc(
            collection(db, "publicExpenses")
        );

    await setDoc(
        publicExpenseRef,
        {
            privateExpenseId,
            title,
            category,
            amount,
            description,
            festivalYear: year,
            date: new Date(selectedDate)
        }
    );
}


// =================================
// DELETE EXPENSE
// =================================

async function deleteExpense(expenseId) {

    const expense =
        allExpenses.find(
            item => item.id === expenseId
        );

    if (!expense) {

        alert(
            "Expense not found."
        );

        return;
    }


    const confirmed = confirm(
        `Delete "${expense.title}" for ${formatCurrency(
            Number(expense.amount || 0)
        )}?

This will remove the expense from the transparency page as well.`
    );

    if (!confirmed) {
        return;
    }


    try {

        // -----------------------------
        // DELETE PRIVATE EXPENSE
        // -----------------------------

        const expenseRef =
            doc(
                db,
                "expenses",
                expenseId
            );

        await deleteDoc(
            expenseRef
        );


        // -----------------------------
        // FIND PUBLIC EXPENSE BY ID
        // -----------------------------

        const publicQuery = query(
            collection(db, "publicExpenses"),
            where(
                "privateExpenseId",
                "==",
                expenseId
            )
        );

        const publicSnapshot =
            await getDocs(publicQuery);


        // -----------------------------
        // DELETE PUBLIC EXPENSE
        // -----------------------------

        for (
            const publicDoc
            of publicSnapshot.docs
        ) {

            await deleteDoc(
                publicDoc.ref
            );

        }


        alert(
            "Expense deleted successfully! 🗑️"
        );

        await loadExpenses();

    } catch (error) {

        console.error(
            "Error deleting expense:",
            error
        );

        alert(
            "Unable to delete expense.\n\n" +
            error.message
        );
    }
}


// =================================
// CANCEL EDIT
// =================================

cancelEditBtn.addEventListener(
    "click",
    () => {

        editingExpenseId = null;

        editExpenseSection.style.display =
            "none";

        editExpenseForm.reset();

    }
);


// =================================
// YEAR CHANGE
// =================================

festivalYear.addEventListener(
    "change",
    () => {

        editExpenseSection.style.display =
            "none";

        editingExpenseId = null;

        loadExpenses();

    }
);


// =================================
// HELPERS
// =================================

function formatCurrency(amount) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR"
        }
    ).format(amount);

}


function formatDate(date) {

    if (!date) {
        return "-";
    }

    let value;

    if (date.toDate) {

        value = date.toDate();

    } else if (date.seconds) {

        value = new Date(
            date.seconds * 1000
        );

    } else {

        value = new Date(date);

    }

    if (isNaN(value.getTime())) {
        return "-";
    }

    return value.toLocaleDateString(
        "en-IN"
    );
}


function getInputDate(date) {

    if (!date) {
        return "";
    }

    let value;

    if (date.toDate) {

        value = date.toDate();

    } else if (date.seconds) {

        value = new Date(
            date.seconds * 1000
        );

    } else {

        value = new Date(date);

    }

    if (isNaN(value.getTime())) {
        return "";
    }

    const year =
        value.getFullYear();

    const month =
        String(
            value.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            value.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function getDateValue(date) {

    if (!date) {
        return 0;
    }

    if (date.toDate) {

        return date.toDate().getTime();

    }

    if (date.seconds) {

        return date.seconds * 1000;

    }

    const value =
        new Date(date);

    return isNaN(value.getTime())
        ? 0
        : value.getTime();
}


function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}