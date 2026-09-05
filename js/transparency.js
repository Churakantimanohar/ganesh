import { db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ===============================
// HTML ELEMENTS
// ===============================

const festivalYear = document.getElementById("festivalYear");

const totalDonations = document.getElementById("totalDonations");
const totalExpenses = document.getElementById("totalExpenses");
const remainingBalance = document.getElementById("remainingBalance");

const donationsTable = document.getElementById("donationTable");
const expensesTable = document.getElementById("expenseTable");


// ===============================
// LOAD TRANSPARENCY
// ===============================

async function loadTransparency(year) {

  try {

    // ===============================
    // LOAD PUBLIC DONATIONS
    // ===============================

    const donationsQuery = query(
      collection(db, "publicDonations"),
      where("festivalYear", "==", year)
    );

    const donationsSnapshot = await getDocs(donationsQuery);

    let donationTotal = 0;

    const donations = [];

    donationsSnapshot.forEach((doc) => {

      const data = doc.data();

      donationTotal += Number(data.amount || 0);

      donations.push({
        id: doc.id,
        ...data
      });

    });


    // ===============================
    // LOAD PUBLIC EXPENSES
    // ===============================

    const expensesQuery = query(
      collection(db, "publicExpenses"),
      where("festivalYear", "==", year)
    );

    const expensesSnapshot = await getDocs(expensesQuery);

    let expenseTotal = 0;

    const expenses = [];

    expensesSnapshot.forEach((doc) => {

      const data = doc.data();

      expenseTotal += Number(data.amount || 0);

      expenses.push({
        id: doc.id,
        ...data
      });

    });


    // ===============================
    // CALCULATE BALANCE
    // ===============================

    const balance = donationTotal - expenseTotal;


    // ===============================
    // DISPLAY SUMMARY
    // ===============================

    totalDonations.textContent =
      formatCurrency(donationTotal);

    totalExpenses.textContent =
      formatCurrency(expenseTotal);

    remainingBalance.textContent =
      formatCurrency(balance);


    // ===============================
    // SORT DONATIONS
    // ===============================

    donations.sort((a, b) => {

      const dateA = getDateValue(a.date);
      const dateB = getDateValue(b.date);

      return dateB - dateA;

    });


    // ===============================
    // SORT EXPENSES
    // ===============================

    expenses.sort((a, b) => {

      const dateA = getDateValue(a.date);
      const dateB = getDateValue(b.date);

      return dateB - dateA;

    });


    // ===============================
    // DISPLAY DONATIONS
    // ===============================

    if (donations.length === 0) {

      donationsTable.innerHTML = `
        <tr>
          <td colspan="4">
            No donations found.
          </td>
        </tr>
      `;

    } else {

      donationsTable.innerHTML = donations.map((donation) => {

        return `
          <tr>

            <td>
              ${formatDate(donation.date)}
            </td>

            <td>
              ${escapeHTML(donation.donorName || "Anonymous")}
            </td>

            <td>
              ${formatCurrency(Number(donation.amount || 0))}
            </td>

            <td>
              ${escapeHTML(donation.paymentMethod || "-")}
            </td>

          </tr>
        `;

      }).join("");

    }


    // ===============================
    // DISPLAY EXPENSES
    // ===============================

    if (expenses.length === 0) {

      expensesTable.innerHTML = `
        <tr>
          <td colspan="5">
            No expenses found.
          </td>
        </tr>
      `;

    } else {

      expensesTable.innerHTML = expenses.map((expense) => {

        return `
          <tr>

            <td>
              ${formatDate(expense.date)}
            </td>

            <td>
              ${escapeHTML(expense.title || "-")}
            </td>

            <td>
              ${escapeHTML(expense.category || "-")}
            </td>

            <td>
              ${formatCurrency(Number(expense.amount || 0))}
            </td>

            <td>
              ${escapeHTML(expense.description || "-")}
            </td>

          </tr>
        `;

      }).join("");

    }

  } catch (error) {

    console.error("Error loading transparency:", error);

    totalDonations.textContent = "₹0.00";
    totalExpenses.textContent = "₹0.00";
    remainingBalance.textContent = "₹0.00";

    donationsTable.innerHTML = `
      <tr>
        <td colspan="4">
          Unable to load donations.
        </td>
      </tr>
    `;

    expensesTable.innerHTML = `
      <tr>
        <td colspan="5">
          Unable to load expenses.
        </td>
      </tr>
    `;

  }

}


// ===============================
// FESTIVAL YEAR CHANGE
// ===============================

festivalYear.addEventListener("change", () => {

  loadTransparency(festivalYear.value);

});


// ===============================
// FORMAT CURRENCY
// ===============================

function formatCurrency(amount) {

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2
  }).format(amount);

}


// ===============================
// FORMAT DATE
// ===============================

function formatDate(dateValue) {

  if (!dateValue) {
    return "-";
  }

  let date;

  if (dateValue?.toDate) {

    date = dateValue.toDate();

  } else if (dateValue instanceof Date) {

    date = dateValue;

  } else {

    date = new Date(dateValue);

  }

  if (isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN");

}


// ===============================
// GET DATE VALUE
// ===============================

function getDateValue(dateValue) {

  if (!dateValue) {
    return 0;
  }

  if (dateValue?.toDate) {
    return dateValue.toDate().getTime();
  }

  if (dateValue instanceof Date) {
    return dateValue.getTime();
  }

  const date = new Date(dateValue);

  return isNaN(date.getTime())
    ? 0
    : date.getTime();

}


// ===============================
// HTML SECURITY
// ===============================

function escapeHTML(value) {

  const div = document.createElement("div");

  div.textContent = value;

  return div.innerHTML;

}


// ===============================
// INITIAL LOAD
// ===============================

loadTransparency(festivalYear.value);