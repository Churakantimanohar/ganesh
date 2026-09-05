
import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =========================================
// Elements
// =========================================

const festivalYear =
    document.getElementById("festivalYear");

const totalDonations =
    document.getElementById("totalDonations");

const totalExpenses =
    document.getElementById("totalExpenses");

const remainingBalance =
    document.getElementById("remainingBalance");

const donationTableBody =
    document.getElementById("donationTableBody");

const expenseTableBody =
    document.getElementById("expenseTableBody");


// =========================================
// Load Transparency Data
// =========================================

async function loadTransparency(year) {

    // Reset display

    totalDonations.textContent = "₹0";

    totalExpenses.textContent = "₹0";

    remainingBalance.textContent = "₹0";


    donationTableBody.innerHTML = `
        <tr>
            <td colspan="4">
                Loading donations...
            </td>
        </tr>
    `;


    expenseTableBody.innerHTML = `
        <tr>
            <td colspan="5">
                Loading expenses...
            </td>
        </tr>
    `;


    try {

        // =================================
        // Donations
        // =================================

        const donationQuery =
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


        const donationSnapshot =
            await getDocs(
                donationQuery
            );


        let donationTotal = 0;


        donationTableBody.innerHTML = "";


        if (donationSnapshot.empty) {

            donationTableBody.innerHTML = `
                <tr>
                    <td colspan="4">
                        No donations recorded.
                    </td>
                </tr>
            `;

        } else {

            const donations = [];


            donationSnapshot.forEach(
                (donationDoc) => {

                    const data =
                        donationDoc.data();


                    donations.push(data);

                }
            );


            // Newest first

            donations.sort(
                (a, b) => {

                    return (
                        getDateValue(b.date) -
                        getDateValue(a.date)
                    );

                }
            );


            donations.forEach(
                (donation) => {

                    const amount =
                        Number(
                            donation.amount
                        ) || 0;


                    donationTotal +=
                        amount;


                    const row =
                        document.createElement(
                            "tr"
                        );


                    row.innerHTML = `

                        <td>
                            ${formatDate(
                                donation.date
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                donation.donorName || "-"
                            )}
                        </td>

                        <td>
                            ${formatCurrency(
                                amount
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                donation.paymentMethod || "-"
                            )}
                        </td>

                    `;


                    donationTableBody.appendChild(
                        row
                    );

                }
            );

        }


        // =================================
        // Expenses
        // =================================

        const expenseQuery =
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


        const expenseSnapshot =
            await getDocs(
                expenseQuery
            );


        let expenseTotal = 0;


        expenseTableBody.innerHTML = "";


        if (expenseSnapshot.empty) {

            expenseTableBody.innerHTML = `
                <tr>
                    <td colspan="5">
                        No expenses recorded.
                    </td>
                </tr>
            `;

        } else {

            const expenses = [];


            expenseSnapshot.forEach(
                (expenseDoc) => {

                    const data =
                        expenseDoc.data();


                    expenses.push(data);

                }
            );


            // Newest first

            expenses.sort(
                (a, b) => {

                    return (
                        getDateValue(b.date) -
                        getDateValue(a.date)
                    );

                }
            );


            expenses.forEach(
                (expense) => {

                    const amount =
                        Number(
                            expense.amount
                        ) || 0;


                    expenseTotal +=
                        amount;


                    const row =
                        document.createElement(
                            "tr"
                        );


                    row.innerHTML = `

                        <td>
                            ${formatDate(
                                expense.date
                            )}
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
                            ${formatCurrency(
                                amount
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                expense.description || "-"
                            )}
                        </td>

                    `;


                    expenseTableBody.appendChild(
                        row
                    );

                }
            );

        }


        // =================================
        // Financial Balance
        // =================================

        const balance =
            donationTotal -
            expenseTotal;


        totalDonations.textContent =
            formatCurrency(
                donationTotal
            );


        totalExpenses.textContent =
            formatCurrency(
                expenseTotal
            );


        remainingBalance.textContent =
            formatCurrency(
                balance
            );


    } catch (error) {

        console.error(
            "Transparency loading error:",
            error
        );


        donationTableBody.innerHTML = `
            <tr>
                <td colspan="4">
                    Unable to load donation information.
                </td>
            </tr>
        `;


        expenseTableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    Unable to load expense information.
                </td>
            </tr>
        `;

    }

}


// =========================================
// Festival Year Change
// =========================================

festivalYear.addEventListener(
    "change",
    () => {

        loadTransparency(
            festivalYear.value
        );

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


function formatDate(value) {

    const date =
        convertToDate(value);


    if (!date) {

        return "-";

    }


    return date.toLocaleDateString(
        "en-IN"
    );

}


function getDateValue(value) {

    const date =
        convertToDate(value);


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


    return isNaN(
        date.getTime()
    )
        ? null
        : date;

}


// Prevent HTML injection
function escapeHtml(value) {

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


// =========================================
// Initial Load
// =========================================

loadTransparency(
    festivalYear.value
);
