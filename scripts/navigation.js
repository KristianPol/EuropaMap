document.addEventListener("DOMContentLoaded", () => {
    const navBar = document.createElement("nav");
    navBar.id = "main-nav";
    navBar.className = "navbar";

    const buttons = [
        { text: "Europe Map", href: "../webpages/index.html" },
        { text: "Brochacho Task Manager", href: "../webpages/brochacho.html" },
        { text: "About", href: "../webpages/about.html" }
    ];

    buttons.forEach(({ text, href }) => {
        const btn = document.createElement("button");
        btn.textContent = text;
        btn.onclick = () => window.location.href = href;
        navBar.appendChild(btn);
    });

    document.body.insertBefore(navBar, document.body.firstChild);
});