import { auth, db } from "./firebase-config.js";


import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    collection,
    query,
    where,
    getDocs,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";



const tableBody =
    document.getElementById(
        "donationTableBody"
    );


const totalElement =
    document.getElementById(
        "myTotalDonations"
    );


const logoutButton =
    document.getElementById(
        "logoutButton"
    );



/* ========================================
   CHECK AUTHENTICATION
======================================== */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        await loadDonations(user.uid);

    }
);



/* ========================================
   LOAD USER DONATIONS
======================================== */

async function loadDonations(userId) {

    try {

        const donationsRef =
            collection(
                db,
                "donations"
            );


        const donationsQuery =
            query(
                donationsRef,

                where(
                    "donorId",
                    "==",
                    userId
                ),

                orderBy(
                    "date",
                    "desc"
                )
            );


        const snapshot =
            await getDocs(
                donationsQuery
            );


        tableBody.innerHTML = "";


        let total = 0;


        if (snapshot.empty) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="5">
                        You have not made any donations yet.
                    </td>
                </tr>
            `;

            totalElement.textContent =
                "₹0";

            return;

        }


        snapshot.forEach(
            (documentSnapshot) => {

                const donation =
                    documentSnapshot.data();


                total +=
                    Number(
                        donation.amount
                    );


                let date = "N/A";


                if (donation.date) {

                    date =
                        donation.date
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
                        ₹${Number(
                            donation.amount
                        ).toLocaleString("en-IN")}
                    </td>

                    <td>
                        ${donation.paymentMethod || "N/A"}
                    </td>

                    <td>
                        ${donation.festivalYear || "N/A"}
                    </td>

                    <td>
                        ${donation.status || "N/A"}
                    </td>

                `;


                tableBody.appendChild(row);

            }
        );


        totalElement.textContent =
            "₹" +
            total.toLocaleString(
                "en-IN"
            );


    } catch (error) {

        console.error(
            "Error loading donations:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    Unable to load donations.
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