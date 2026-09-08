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
    runTransaction,
    updateDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =================================
// ELEMENTS
// =================================

const festivalYear =
    document.getElementById("festivalYear");

const statusFilter =
    document.getElementById("statusFilter");

const donationTableBody =
    document.getElementById("donationTableBody");

const totalDonations =
    document.getElementById("totalDonations");

const confirmedTotal =
    document.getElementById("confirmedTotal");

const pendingTotal =
    document.getElementById("pendingTotal");


// =================================
// EDIT ELEMENTS
// =================================

const editDonationSection =
    document.getElementById("editDonationSection");

const editDonationForm =
    document.getElementById("editDonationForm");

const editDonorName =
    document.getElementById("editDonorName");

const editDonationAmount =
    document.getElementById("editDonationAmount");

const editPaymentMethod =
    document.getElementById("editPaymentMethod");

const editFestivalYear =
    document.getElementById("editFestivalYear");

const editDonationDate =
    document.getElementById("editDonationDate");

const cancelEditBtn =
    document.getElementById("cancelEditBtn");

const manualDonationForm = document.getElementById("manualDonationForm");
const manualDonationMessage = document.getElementById("manualDonationMessage");
const manualDonationDate = document.getElementById("manualDonationDate");


// =================================
// VARIABLES
// =================================

let allDonations = [];

let editingDonationId = null;

if (manualDonationDate) {
    manualDonationDate.value = new Date().toISOString().slice(0, 10);
}


// =================================
// CHECK ADMIN
// =================================

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


        loadDonations();


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

if (manualDonationForm) {
    manualDonationForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const donorName = document.getElementById("manualDonorName").value.trim();
        const amount = Number(document.getElementById("manualDonationAmount").value);
        const paymentMethod = document.getElementById("manualPaymentMethod").value;
        const year = document.getElementById("manualFestivalYear").value;

        if (!donorName || amount <= 0 || !paymentMethod || !manualDonationDate.value) {
            manualDonationMessage.textContent = "Complete all donation details with a valid amount.";
            return;
        }

        const donationRef = doc(collection(db, "donations"));
        const publicDonationRef = doc(collection(db, "publicDonations"));
        const donationDate = new Date(`${manualDonationDate.value}T00:00:00`);

        try {
            // The deployed rules require every new donation to start pending.
            await setDoc(donationRef, {
                donorId: auth.currentUser?.uid || "admin",
                donorName,
                amount,
                paymentMethod,
                festivalYear: year,
                date: donationDate,
                status: "pending",
                source: "in-person",
                createdAt: serverTimestamp()
            });

            // Admin verification promotes the offline receipt before publishing it.
            await updateDoc(donationRef, { status: "confirmed" });

            await setDoc(publicDonationRef, {
                privateDonationId: donationRef.id,
                donorName,
                amount,
                paymentMethod,
                festivalYear: year,
                date: donationDate,
                status: "confirmed"
            });

            manualDonationMessage.textContent = "Confirmed donation added and published successfully.";
            manualDonationForm.reset();
            manualDonationDate.value = new Date().toISOString().slice(0, 10);
            await loadDonations();
        } catch (error) {
            console.error("Error adding in-person donation:", error);
            manualDonationMessage.textContent = "Unable to add donation. Please try again.";
        }
    });
}


// =================================
// LOAD DONATIONS
// =================================

async function loadDonations() {

    try {

        const selectedYear =
            festivalYear.value;


        const donationsQuery =
            query(
                collection(
                    db,
                    "donations"
                ),
                where(
                    "festivalYear",
                    "==",
                    selectedYear
                )
            );


        const snapshot =
            await getDocs(
                donationsQuery
            );


        allDonations = [];


        snapshot.forEach(
            (donationDoc) => {

                const data =
                    donationDoc.data();


                allDonations.push({

                    id:
                        donationDoc.id,

                    ...data

                });

            }
        );


        // Newest first

        allDonations.sort(
            (a, b) =>
                getDateValue(b.date) -
                getDateValue(a.date)
        );


        updateSummary();

        renderDonations();


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


// =================================
// SUMMARY
// =================================

function updateSummary() {

    let confirmedAmount = 0;

    let pendingAmount = 0;


    allDonations.forEach(
        (donation) => {

            const amount =
                Number(
                    donation.amount || 0
                );


            if (
                donation.status ===
                "confirmed"
            ) {

                confirmedAmount +=
                    amount;
            }


            if (
                donation.status ===
                "pending"
            ) {

                pendingAmount +=
                    amount;
            }

        }
    );


    confirmedTotal.textContent =
        formatCurrency(
            confirmedAmount
        );


    pendingTotal.textContent =
        formatCurrency(
            pendingAmount
        );


    // Official donation total
    // contains confirmed donations only

    totalDonations.textContent =
        formatCurrency(
            confirmedAmount
        );
}


// =================================
// RENDER DONATIONS
// =================================

function renderDonations() {

    const filter =
        statusFilter.value;


    let donations =
        allDonations;


    if (filter !== "all") {

        donations =
            allDonations.filter(
                donation =>
                    donation.status ===
                    filter
            );
    }


    if (donations.length === 0) {

        donationTableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    No donations found.
                </td>
            </tr>
        `;

        return;
    }


    donationTableBody.innerHTML =
        donations.map(
            (donation) => {

                const status =
                    donation.status ||
                    "pending";


                let actionHTML = "";


                // -----------------------------
                // PENDING
                // -----------------------------

                if (
                    status ===
                    "pending"
                ) {

                    actionHTML = `

                        <button
                            type="button"
                            class="verify-btn"
                            data-id="${donation.id}">
                            ✅ Verify & Publish
                        </button>

                        <button
                            type="button"
                            class="reject-btn"
                            data-id="${donation.id}">
                            ❌ Reject
                        </button>

                    `;

                }


                // -----------------------------
                // CONFIRMED
                // -----------------------------

                else if (
                    status ===
                    "confirmed"
                ) {

                    actionHTML = `

                        <button
                            type="button"
                            class="edit-btn"
                            data-id="${donation.id}">
                            ✏️ Edit
                        </button>

                        <span class="published-status">
                            Published
                        </span>

                    `;

                }


                // -----------------------------
                // REJECTED
                // -----------------------------

                else if (
                    status ===
                    "rejected"
                ) {

                    actionHTML = `

                        <button
                            type="button"
                            class="edit-btn"
                            data-id="${donation.id}">
                            ✏️ Edit
                        </button>

                        <span class="rejected-status">
                            Rejected
                        </span>

                    `;

                }


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
                            ${escapeHTML(
                                donation.paymentMethod ||
                                "-"
                            )}
                        </td>


                        <td>
                            ${escapeHTML(
                                donation.festivalYear ||
                                "-"
                            )}
                        </td>


                        <td>

                            <span
                                class="status ${status}">
                                ${status}
                            </span>

                        </td>


                        <td>
                            ${actionHTML}
                        </td>

                    </tr>

                `;

            }
        ).join("");


    // =================================
    // VERIFY BUTTONS
    // =================================

    document
        .querySelectorAll(".verify-btn")
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


    // =================================
    // REJECT BUTTONS
    // =================================

    document
        .querySelectorAll(".reject-btn")
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        rejectDonation(
                            button.dataset.id
                        );

                    }
                );

            }
        );


    // =================================
    // EDIT BUTTONS
    // =================================

    document
        .querySelectorAll(".edit-btn")
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        startEditDonation(
                            button.dataset.id
                        );

                    }
                );

            }
        );

}


// =================================
// VERIFY DONATION
// =================================

async function verifyDonation(
    donationId
) {

    const confirmVerification =
        confirm(
            "Are you sure you want to verify and publish this donation?"
        );


    if (!confirmVerification) {
        return;
    }


    try {

        const donationRef =
            doc(
                db,
                "donations",
                donationId
            );


        await runTransaction(
            db,
            async (transaction) => {

                const donationSnapshot =
                    await transaction.get(
                        donationRef
                    );


                if (
                    !donationSnapshot.exists()
                ) {

                    throw new Error(
                        "Donation no longer exists."
                    );
                }


                const donation =
                    donationSnapshot.data();


                if (
                    donation.status ===
                    "confirmed"
                ) {

                    throw new Error(
                        "This donation is already verified."
                    );
                }


                if (
                    donation.status ===
                    "rejected"
                ) {

                    throw new Error(
                        "Rejected donations cannot be verified."
                    );
                }


                const publicDonationRef =
                    doc(
                        collection(
                            db,
                            "publicDonations"
                        )
                    );


                const publicDonation = {

                    privateDonationId:
                        donationId,

                    donorName:
                        donation.donorName ||
                        "Anonymous",

                    amount:
                        Number(
                            donation.amount ||
                            0
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


        await loadDonations();


    } catch (error) {

        console.error(
            "Error verifying donation:",
            error
        );


        alert(
            "Unable to verify donation.\n\n" +
            error.message
        );
    }
}


// =================================
// REJECT DONATION
// =================================

async function rejectDonation(
    donationId
) {

    const donation =
        allDonations.find(
            item =>
                item.id ===
                donationId
        );


    if (!donation) {

        alert(
            "Donation not found."
        );

        return;
    }


    if (
        donation.status !==
        "pending"
    ) {

        alert(
            "Only pending donations can be rejected."
        );

        return;
    }


    const confirmed =
        confirm(
            `Reject donation from "${donation.donorName || "Anonymous"}" for ${formatCurrency(
                Number(
                    donation.amount ||
                    0
                )
            )}?\n\nThis donation will NOT appear on the Transparency page.`
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


        await runTransaction(
            db,
            async (transaction) => {

                const donationSnapshot =
                    await transaction.get(
                        donationRef
                    );


                if (
                    !donationSnapshot.exists()
                ) {

                    throw new Error(
                        "Donation no longer exists."
                    );
                }


                const currentDonation =
                    donationSnapshot.data();


                if (
                    currentDonation.status !==
                    "pending"
                ) {

                    throw new Error(
                        "This donation is no longer pending."
                    );
                }


                transaction.update(
                    donationRef,
                    {
                        status:
                            "rejected"
                    }
                );

            }
        );


        alert(
            "Donation rejected successfully."
        );


        await loadDonations();


    } catch (error) {

        console.error(
            "Error rejecting donation:",
            error
        );


        alert(
            "Unable to reject donation.\n\n" +
            error.message
        );
    }
}


// =================================
// START EDIT
// =================================

function startEditDonation(
    donationId
) {

    const donation =
        allDonations.find(
            item =>
                item.id ===
                donationId
        );


    if (!donation) {

        alert(
            "Donation not found."
        );

        return;
    }


    editingDonationId =
        donationId;


    editDonorName.value =
        donation.donorName ||
        "";


    editDonationAmount.value =
        donation.amount ||
        "";


    editPaymentMethod.value =
        donation.paymentMethod ||
        "";


    editFestivalYear.value =
        donation.festivalYear ||
        festivalYear.value;


    editDonationDate.value =
        getInputDate(
            donation.date
        );


    editDonationSection.style.display =
        "block";


    editDonationSection.scrollIntoView({
        behavior: "smooth"
    });
}


// =================================
// UPDATE DONATION
// =================================

editDonationForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        if (!editingDonationId) {
            return;
        }


        const donorName =
            editDonorName.value.trim();


        const amount =
            Number(
                editDonationAmount.value
            );


        const paymentMethod =
            editPaymentMethod.value.trim();


        const year =
            editFestivalYear.value;


        const selectedDate =
            editDonationDate.value;


        if (!donorName) {

            alert(
                "Enter donor name."
            );

            return;
        }


        if (!amount || amount <= 0) {

            alert(
                "Enter a valid donation amount."
            );

            return;
        }


        if (!paymentMethod) {

            alert(
                "Select payment method."
            );

            return;
        }


        if (!selectedDate) {

            alert(
                "Select donation date."
            );

            return;
        }


        try {

            const donationRef =
                doc(
                    db,
                    "donations",
                    editingDonationId
                );


            const donationSnapshot =
                await getDoc(
                    donationRef
                );


            if (
                !donationSnapshot.exists()
            ) {

                throw new Error(
                    "Donation no longer exists."
                );
            }


            const oldDonation =
                donationSnapshot.data();


            // =================================
            // UPDATE PRIVATE DONATION
            // =================================

            await updateDoc(
                donationRef,
                {
                    donorName,
                    amount,
                    paymentMethod,
                    festivalYear:
                        year,
                    date:
                        new Date(
                            selectedDate
                        )
                }
            );


            // =================================
            // IF CONFIRMED, UPDATE PUBLIC
            // =================================

            if (
                oldDonation.status ===
                "confirmed"
            ) {

                const publicQuery =
                    query(
                        collection(
                            db,
                            "publicDonations"
                        ),
                        where(
                            "privateDonationId",
                            "==",
                            editingDonationId
                        )
                    );


                const publicSnapshot =
                    await getDocs(
                        publicQuery
                    );


                if (
                    !publicSnapshot.empty
                ) {

                    for (
                        const publicDoc
                        of publicSnapshot.docs
                    ) {

                        await updateDoc(
                            publicDoc.ref,
                            {
                                donorName,
                                amount,
                                paymentMethod,
                                festivalYear:
                                    year,
                                date:
                                    new Date(
                                        selectedDate
                                    )
                            }
                        );

                    }

                }

            }


            alert(
                "Donation updated successfully! ✅"
            );


            editingDonationId =
                null;


            editDonationSection.style.display =
                "none";


            editDonationForm.reset();


            await loadDonations();


        } catch (error) {

            console.error(
                "Error updating donation:",
                error
            );


            alert(
                "Unable to update donation.\n\n" +
                error.message
            );
        }

    }
);


// =================================
// CANCEL EDIT
// =================================

cancelEditBtn.addEventListener(
    "click",
    () => {

        editingDonationId =
            null;


        editDonationSection.style.display =
            "none";


        editDonationForm.reset();

    }
);


// =================================
// EVENTS
// =================================

festivalYear.addEventListener(
    "change",
    () => {

        editDonationSection.style.display =
            "none";

        editingDonationId =
            null;

        loadDonations();

    }
);


statusFilter.addEventListener(
    "change",
    renderDonations
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


function getInputDate(date) {

    if (!date) {
        return "";
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


function escapeHTML(value) {

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