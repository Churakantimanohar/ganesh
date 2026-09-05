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
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =================================
// ELEMENTS
// =================================

const festivalYear =
    document.getElementById("festivalYear");

const totalDonations =
    document.getElementById("totalDonations");

const totalExpenses =
    document.getElementById("totalExpenses");

const remainingBalance =
    document.getElementById("remainingBalance");

const pendingDonations =
    document.getElementById("pendingDonations");

const recentDonationTable =
    document.getElementById(
        "recentDonationTable"
    );

const recentExpenseTable =
    document.getElementById(
        "recentExpenseTable"
    );

const logoutBtn =
    document.getElementById("logoutBtn");


// =================================
// ADMIN AUTH CHECK
// =================================

onAuthStateChanged(
    auth,
    async (user) => {

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


            const userSnapshot =
                await getDoc(
                    userRef
                );


            if (
                !userSnapshot.exists()
            ) {

                await auth.signOut();

                window.location.href =
                    "../login.html";

                return;
            }


            const userData =
                userSnapshot.data();


            if (
                userData.role !==
                "admin"
            ) {

                alert(
                    "Access denied. Admin account required."
                );

                window.location.href =
                    "../dashboard.html";

                return;
            }


            loadDashboard();

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

    }
);


// =================================
// LOAD DASHBOARD
// =================================

async function loadDashboard() {

    const year =
        festivalYear.value;


    await Promise.all([
        loadDonations(year),
        loadExpenses(year)
    ]);
}


// =================================
// LOAD DONATIONS
// =================================

async function loadDonations(
    year
) {

    try {

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


        const snapshot =
            await getDocs(
                donationsQuery
            );


        let confirmedTotal =
            0;

        let pendingTotal =
            0;


        const donations = [];


        snapshot.forEach(
            (donationDoc) => {

                const data =
                    donationDoc.data();


                donations.push({
                    id:
                        donationDoc.id,
                    ...data
                });


                const amount =
                    Number(
                        data.amount || 0
                    );


                if (
                    data.status ===
                    "confirmed"
                ) {

                    confirmedTotal +=
                        amount;
                }


                if (
                    data.status ===
                    "pending"
                ) {

                    pendingTotal +=
                        amount;
                }

            }
        );


        totalDonations.textContent =
            formatCurrency(
                confirmedTotal
            );


        pendingDonations.textContent =
            formatCurrency(
                pendingTotal
            );


        // Recent donations
        donations.sort(
            (a, b) =>
                getDateValue(b.date) -
                getDateValue(a.date)
        );


        renderRecentDonations(
            donations.slice(0, 5)
        );


        // Store for balance calculation
        window.confirmedDonationTotal =
            confirmedTotal;


        updateBalance();


    } catch (error) {

        console.error(
            "Error loading donations:",
            error
        );


        totalDonations.textContent =
            "₹0.00";

        pendingDonations.textContent =
            "₹0.00";
    }
}


// =================================
// LOAD EXPENSES
// =================================

async function loadExpenses(
    year
) {

    try {

        const expensesQuery =
            query(
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


        const snapshot =
            await getDocs(
                expensesQuery
            );


        let expenseTotal =
            0;


        const expenses = [];


        snapshot.forEach(
            (expenseDoc) => {

                const data =
                    expenseDoc.data();


                expenses.push({
                    id:
                        expenseDoc.id,
                    ...data
                });


                expenseTotal +=
                    Number(
                        data.amount || 0
                    );

            }
        );


        totalExpenses.textContent =
            formatCurrency(
                expenseTotal
            );


        expenses.sort(
            (a, b) =>
                getDateValue(b.date) -
                getDateValue(a.date)
        );


        renderRecentExpenses(
            expenses.slice(0, 5)
        );


        window.expenseTotal =
            expenseTotal;


        updateBalance();


    } catch (error) {

        console.error(
            "Error loading expenses:",
            error
        );


        totalExpenses.textContent =
            "₹0.00";
    }
}


// =================================
// UPDATE BALANCE
// =================================

function updateBalance() {

    const donations =
        Number(
            window.confirmedDonationTotal ||
            0
        );


    const expenses =
        Number(
            window.expenseTotal ||
            0
        );


    const balance =
        donations - expenses;


    remainingBalance.textContent =
        formatCurrency(
            balance
        );
}


// =================================
// RECENT DONATIONS
// =================================

function renderRecentDonations(
    donations
) {

    if (
        donations.length === 0
    ) {

        recentDonationTable.innerHTML = `
            <tr>
                <td colspan="4">
                    No donations found.
                </td>
            </tr>
        `;

        return;
    }


    recentDonationTable.innerHTML =
        donations.map(
            (donation) => {

                const status =
                    donation.status ||
                    "pending";


                return `
                    <tr>

                        <td>
                            ${formatDate(
                                donation.date
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                donation.donorName ||
                                "Anonymous"
                            )}
                        </td>

                        <td>
                            ${formatCurrency(
                                Number(
                                    donation.amount ||
                                    0
                                )
                            )}
                        </td>

                        <td>

                            <span
                                class="status ${status}">
                                ${status}
                            </span>

                        </td>

                    </tr>
                `;

            }
        ).join("");
}


// =================================
// RECENT EXPENSES
// =================================

function renderRecentExpenses(
    expenses
) {

    if (
        expenses.length === 0
    ) {

        recentExpenseTable.innerHTML = `
            <tr>
                <td colspan="4">
                    No expenses found.
                </td>
            </tr>
        `;

        return;
    }


    recentExpenseTable.innerHTML =
        expenses.map(
            (expense) => {

                return `
                    <tr>

                        <td>
                            ${formatDate(
                                expense.date
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                expense.title ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                expense.category ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${formatCurrency(
                                Number(
                                    expense.amount ||
                                    0
                                )
                            )}
                        </td>

                    </tr>
                `;

            }
        ).join("");
}


// =================================
// YEAR CHANGE
// =================================

festivalYear.addEventListener(
    "change",
    () => {

        window.confirmedDonationTotal =
            0;

        window.expenseTotal =
            0;

        loadDashboard();

    }
);


// =================================
// LOGOUT
// =================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async (event) => {

            event.preventDefault();

            try {

                await auth.signOut();

                window.location.href =
                    "../login.html";

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

                alert(
                    "Unable to logout."
                );
            }

        }
    );

}


// =================================
// HELPERS
// =================================

function formatCurrency(
    amount
) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR"
        }
    ).format(amount);
}


function formatDate(
    date
) {

    if (!date) {
        return "-";
    }


    let value;


    if (date.toDate) {

        value =
            date.toDate();

    } else if (date.seconds) {

        value =
            new Date(
                date.seconds * 1000
            );

    } else {

        value =
            new Date(date);

    }


    if (
        isNaN(
            value.getTime()
        )
    ) {

        return "-";
    }


    return value.toLocaleDateString(
        "en-IN"
    );
}


function getDateValue(
    date
) {

    if (!date) {
        return 0;
    }


    if (date.toDate) {

        return date
            .toDate()
            .getTime();
    }


    if (date.seconds) {

        return (
            date.seconds *
            1000
        );
    }


    const value =
        new Date(date);


    return isNaN(
        value.getTime()
    )
        ? 0
        : value.getTime();
}


function escapeHTML(
    value
) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}