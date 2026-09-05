
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
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =========================================
// HTML Elements
// =========================================

const festivalYear =
    document.getElementById("festivalYear");

const donationTableBody =
    document.getElementById("donationTableBody");

const totalDonations =
    document.getElementById("totalDonations");

const logoutBtn =
    document.getElementById("logoutBtn");


// =========================================
// Check Admin Access
// =========================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href =
            "../login.html";

        return;
    }


    try {

        const userRef =
            doc(db, "users", user.uid);

        const userSnap =
            await getDoc(userRef);


        if (!userSnap.exists()) {

            alert(
                "User profile not found."
            );

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


        loadDonations(
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
// Load Donations
// =========================================

async function loadDonations(year) {

    donationTableBody.innerHTML = `
        <tr>
            <td colspan="6">
                Loading donations...
            </td>
        </tr>
    `;


    try {

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


        const snapshot =
            await getDocs(
                donationQuery
            );


        donationTableBody.innerHTML =
            "";


        let total = 0;


        if (snapshot.empty) {

            donationTableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        No donations found.
                    </td>
                </tr>
            `;

            totalDonations.textContent =
                "₹0";

            return;
        }


        const donations = [];


        snapshot.forEach(
            (donationDoc) => {

                const data =
                    donationDoc.data();


                donations.push({
                    id: donationDoc.id,
                    ...data
                });

            }
        );


        // Sort newest first
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


                total += amount;


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

                    <td>
                        ${escapeHtml(
                            donation.festivalYear || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            donation.status || "-"
                        )}
                    </td>

                `;


                donationTableBody.appendChild(
                    row
                );

            }
        );


        totalDonations.textContent =
            formatCurrency(total);


    } catch (error) {

        console.error(
            "Error loading donations:",
            error
        );


        donationTableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    Unable to load donations.
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

        loadDonations(
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

