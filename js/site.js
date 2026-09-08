const adminArea = window.location.pathname.includes("/admin/");
const transparencyPage = document.body.classList.contains("transparency-page");
const root = adminArea ? "../" : "";
let navbar = document.querySelector(".navbar");

// Bust stale local stylesheet caches after visual updates.
const sharedStylesheet = document.querySelector('link[rel="stylesheet"][href*="css/style.css"]');
if (sharedStylesheet) {
    sharedStylesheet.href = `${sharedStylesheet.href.split("?")[0]}?v=club-ui-20260908`;
}

function link(path, label, className = "") {
    return `<a href="${root}${path}" class="${className}">${label}</a>`;
}

// Some pages (such as Login and Register) do not contain navigation markup.
// Create it here so every page uses this one shared navigation component.
if (!navbar) {
    navbar = document.createElement("header");
    navbar.className = "navbar";
    document.body.prepend(navbar);
}

if (navbar) {
    navbar.querySelectorAll(".brand-logo").forEach((image) => {
        image.src = `${root}assets/club-emblem.png`;
        image.alt = "Reddy's Youth Associations club emblem";
    });

    const navigation = adminArea
        ? `${link("admin/dashboard.html", "Dashboard")}${link("admin/manage-donations.html", "Manage Donations")}${link("admin/expenses.html", "Add Expense")}${link("admin/manage-expenses.html", "Manage Expenses")}${link("transparency.html", "Transparency")}<button type="button" class="site-logout nav-button">Logout</button>`
        : `${transparencyPage ? "" : link("index.html", "Home")}${link("transparency.html", "Transparency")}<span class="authenticated-links" hidden>${link("dashboard.html", "Dashboard")}${link("donations.html", "Donations")}${link("donation-history.html", "Donation History")}${link("expenses.html", "Expenses")}</span><a class="guest-link" href="${root}login.html">Login</a><a class="guest-link nav-button" href="${root}register.html">Register</a><button type="button" class="site-logout nav-button authenticated-links" hidden>Logout</button>`;

    if (!navbar.querySelector(".logo")) {
        navbar.insertAdjacentHTML(
            "afterbegin",
            `<a class="logo" href="${root}index.html" aria-label="Reddy's Youth Associations home"><img class="brand-logo" src="${root}assets/logo.svg" alt=""><span>Reddy's Youth Associations</span></a>`
        );
    }

    const existingLinks = navbar.querySelector("nav, .nav-links");
    const links = existingLinks || document.createElement("nav");
    links.className = "nav-links";
    links.setAttribute("aria-label", "Main navigation");
    links.innerHTML = navigation;
    if (!existingLinks) navbar.appendChild(links);

    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    links.querySelectorAll("a").forEach((anchor) => {
        if (anchor.getAttribute("href")?.split("/").pop() === currentPage) {
            anchor.setAttribute("aria-current", "page");
        }
    });
}

const footer = document.querySelector("footer") || document.body.appendChild(document.createElement("footer"));
footer.innerHTML = `<div class="footer-brand"><img src="${root}assets/club-emblem.png" alt="Reddy's Youth Associations club emblem"><div><strong>Reddy's Youth Associations</strong><span>Ganapathi Festival transparency information</span></div></div><nav class="footer-links">${transparencyPage ? "" : link("index.html", "Home")}${link("transparency.html", "Transparency")}${link("login.html", "Login")}</nav><small>&copy; ${new Date().getFullYear()} Reddy's Youth Associations</small>`;

import("./firebase-config.js").then(async ({ auth, db }) => {
    const { onAuthStateChanged, signOut } = await import("https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js");
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js");

    onAuthStateChanged(auth, async (user) => {
        const profile = user ? await getDoc(doc(db, "users", user.uid)) : null;
        const isAdmin = profile?.exists() && profile.data().role === "admin";
        document.querySelectorAll(".authenticated-links").forEach((element) => {
            element.hidden = !user;
        });
        document.querySelectorAll(".guest-link").forEach((element) => {
            element.hidden = Boolean(user);
        });
        if (adminArea && user && !isAdmin) {
            window.location.href = "../dashboard.html";
        }
    });

    document.querySelectorAll(".site-logout").forEach((button) => {
        button.addEventListener("click", async () => {
            await signOut(auth);
            window.location.href = `${root}index.html`;
        });
    });
}).catch((error) => console.error("Shared site initialization failed:", error));
