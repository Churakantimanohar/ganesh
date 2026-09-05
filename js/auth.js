import { auth, db } from "./firebase-config.js";


import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";



// =====================================================
// REGISTER
// =====================================================

const registerForm =
    document.getElementById("registerForm");


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const name =
                document
                    .getElementById("name")
                    .value
                    .trim();


            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("password")
                    .value;


            const message =
                document
                    .getElementById("message");


            try {

                // Create Firebase account

                const userCredential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    userCredential.user;


                // Create Firestore user profile

                await setDoc(
                    doc(db, "users", user.uid),
                    {

                        name: name,

                        email: email,

                        role: "user",

                        createdAt:
                            serverTimestamp()

                    }
                );


                message.textContent =
                    "Account created successfully!";


                setTimeout(() => {

                    window.location.href =
                        "login.html";

                }, 1500);


            } catch (error) {

                console.error(
                    "Registration error:",
                    error
                );


                if (
                    error.code ===
                    "auth/email-already-in-use"
                ) {

                    message.textContent =
                        "This email is already registered.";

                }

                else if (
                    error.code ===
                    "auth/weak-password"
                ) {

                    message.textContent =
                        "Password must be at least 6 characters.";

                }

                else {

                    message.textContent =
                        error.message;

                }

            }

        }
    );

}



// =====================================================
// LOGIN
// =====================================================

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const email =
                document
                    .getElementById("loginEmail")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("loginPassword")
                    .value;


            const message =
                document
                    .getElementById("loginMessage");


            try {

                // =========================================
                // LOGIN WITH FIREBASE AUTHENTICATION
                // =========================================

                const userCredential =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    userCredential.user;


                console.log(
                    "Logged in UID:",
                    user.uid
                );


                // =========================================
                // GET USER FROM FIRESTORE
                // =========================================

                const userRef =
                    doc(
                        db,
                        "users",
                        user.uid
                    );


                const userSnapshot =
                    await getDoc(userRef);


                // =========================================
                // USER PROFILE NOT FOUND
                // =========================================

                if (!userSnapshot.exists()) {

                    message.textContent =
                        "User profile not found.";

                    await signOut(auth);

                    return;
                }


                // =========================================
                // GET USER DATA
                // =========================================

                const userData =
                    userSnapshot.data();


                console.log(
                    "User name:",
                    userData.name
                );


                console.log(
                    "User role:",
                    userData.role
                );


                message.textContent =
                    "Login successful!";


                // =========================================
                // ROLE BASED REDIRECT
                // =========================================

                setTimeout(() => {


                    if (
                        userData.role ===
                        "admin"
                    ) {

                        // ADMIN

                        window.location.href =
                            "admin/dashboard.html";

                    }

                    else {

                        // NORMAL USER

                        window.location.href =
                            "dashboard.html";

                    }


                }, 500);


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                message.textContent =
                    "Invalid email or password.";

            }

        }
    );

}