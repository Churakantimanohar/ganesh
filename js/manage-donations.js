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
    addDoc,
    runTransaction
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
// LOAD DONATIONS
// =========================================

async function loadDonations(year) {

    donationTableBody.innerHTML = `
        <tr>
            <td colspan="7">
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
                    <td colspan="7">
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

                    id:
                        donationDoc.id,

                    ...data

                });

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


                total += amount;


                const row =
                    document.createElement(
                        "tr"
                    );


                const status =
                    donation.status ||
                    "pending";


                let actionHTML;


                if (
                    status ===
                    "pending"
                ) {

                    actionHTML = `

                        <button
                            class="btn-primary verify-donation-btn"
                            data-id="${donation.id}">

                            Verify & Publish

                        </button>

                    `;

                } else {

                    actionHTML = `

                        <span class="published-label">
                            Published
                        </span>

                    `;

                }


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
                            status
                        )}
                    </td>

                    <td>
                        ${actionHTML}
                    </td>

                `;


                donationTableBody.appendChild(
                    row
                );

            }
        );


        totalDonations.textContent =
            formatCurrency(total);


        // =========================================
        // VERIFY BUTTONS
        // =========================================

        document
            .querySelectorAll(
                ".verify-donation-btn"
            )
            .forEach(
                (button) => {

                    button.addEventListener(
                        "click",
                        () => {

                            verifyDonation(
                                button.dataset.id
                            );

                        }
                    );

                }
            );


    } catch (error) {

        console.error(
            "Error loading donations:",
            error
        );


        donationTableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    Unable to load donations.
                </td>
            </tr>
        `;

    }

}


// =========================================
// VERIFY + PUBLISH DONATION
// =========================================

async function verifyDonation(
    donationId
) {

    const confirmed =
        confirm(
            "Verify this donation and publish it to Transparency?"
        );


    if (!confirmed) {

        return;
    }


    try {

        const donationRef =
            doc(
                db,
                "donations",
                donationId
            );


        // =========================================
        // FIRESTORE TRANSACTION
        // =========================================

        await runTransaction(
            db,
            async (transaction) => {

                const donationSnap =
                    await transaction.get(
                        donationRef
                    );


                if (
                    !donationSnap.exists()
                ) {

                    throw new Error(
                        "Donation no longer exists."
                    );

                }


                const donation =
                    donationSnap.data();


                // Already verified

                if (
                    donation.status ===
                    "confirmed"
                ) {

                    throw new Error(
                        "This donation is already verified."
                    );

                }


                // =========================================
                // CREATE PUBLIC DONATION
                // =========================================

                const publicDonationRef =
                    doc(
                        collection(
                            db,
                            "publicDonations"
                        )
                    );


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


                transaction.set(
                    publicDonationRef,
                    publicDonation
                );


                // =========================================
                // UPDATE PRIVATE DONATION
                // =========================================

                transaction.update(
                    donationRef,
                    {
                        status:
                            "confirmed"
                    }
                );

            }
        );


        alert(
            "Donation verified and published successfully! ✅"
        );


        loadDonations(
            festivalYear.value
        );


    } catch (error) {

        console.error(
            "Verification error:",
            error
        );


        alert(
            "Unable to verify donation.\n\n" +
            error.message
        );

    }

}


// =========================================
// FESTIVAL YEAR CHANGE
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


// =========================================
// HELPERS
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


// =========================================
// HTML SECURITY
// =========================================

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