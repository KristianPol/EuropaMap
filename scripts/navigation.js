function appendNavbar() {
    const navbarHtml = `
    <style>
    .nav-link {
        margin: 3px;
        position: relative;
        padding: 5px 10px;
        text-decoration: none;
        color: #007bff; /* Default text color */
        border: 2px solid transparent; /* Initial border */
        border-color: #007bff; /* Darker blue border on hover */
        border-radius: 5px; /* Rounded corners */
        transition: background-color 0.3s ease, box-shadow 0.3s ease;
    }

    .nav-link:hover {
        background-color: #007bff; /* Blue background on hover */
        color: white; /* White text on hover */
        border-color: #0056b3; /* Darker blue border on hover */
        box-shadow: 0 0 10px rgba(0, 123, 255, 0.5); /* Glowing blue outline */
    }
</style>

    <div style="padding: 30px"></div>

    <nav class="navbar navbar-light bg-light fixed-top">
    <div class="container-fluid d-flex justify-content-between">
        <div class="d-flex">
            <a class="nav-link" href="../webpages/index.html">Europe Map</a>
            <a class="nav-link" href="../webpages/brochacho.html">Brochacho Travel Planner</a>
        </div>
        <a class="nav-link" href="../webpages/about.html">About</a> <!-- This one will be on the opposite side -->
    </div>
</nav>

    `;

    // Append the navbar to the body of the document
    document.body.insertAdjacentHTML('afterbegin', navbarHtml);
}

// Call the function to append the navbar
appendNavbar();
    