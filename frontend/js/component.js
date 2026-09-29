const components = [

    {
        id: 1,
        name: "JWT Authentication",
        description:
            "Reusable JWT-based authentication module for securing web applications.",
        category: "Authentication",
        type: "Code",
        language: "Python",
        keywords: ["JWT", "Auth", "Security"],
        usage: 24
    },

    {
        id: 2,
        name: "Login Form",
        description:
            "Responsive login form component with email and password fields.",
        category: "Frontend",
        type: "Code",
        language: "JavaScript",
        keywords: ["Login", "Form", "UI"],
        usage: 18
    },

    {
        id: 3,
        name: "MySQL CRUD Module",
        description:
            "Reusable module for performing common CRUD operations with MySQL.",
        category: "Database",
        type: "Code",
        language: "Python",
        keywords: ["MySQL", "CRUD", "Database"],
        usage: 31
    },

    {
        id: 4,
        name: "REST API Client",
        description:
            "Utility for communicating with REST APIs using HTTP requests.",
        category: "API",
        type: "Code",
        language: "Python",
        keywords: ["REST", "API", "HTTP"],
        usage: 16
    },

    {
        id: 5,
        name: "Navigation Bar",
        description:
            "Responsive navigation bar suitable for modern web applications.",
        category: "Frontend",
        type: "Code",
        language: "JavaScript",
        keywords: ["Navbar", "Navigation", "UI"],
        usage: 27
    },

    {
        id: 6,
        name: "Password Hashing",
        description:
            "Reusable password hashing and verification utility.",
        category: "Authentication",
        type: "Code",
        language: "Python",
        keywords: ["Password", "Hash", "Security"],
        usage: 22
    },

    {
        id: 7,
        name: "Database ER Diagram",
        description:
            "Reusable entity relationship diagram template for database design.",
        category: "Database",
        type: "Design",
        language: "SQL",
        keywords: ["ER", "Database", "Design"],
        usage: 11
    },

    {
        id: 8,
        name: "File Upload Handler",
        description:
            "Backend utility for validating and processing uploaded files.",
        category: "Utilities",
        type: "Code",
        language: "Python",
        keywords: ["File", "Upload", "Validation"],
        usage: 14
    },

    {
        id: 9,
        name: "Search Bar",
        description:
            "Reusable search input component with responsive styling.",
        category: "Frontend",
        type: "Code",
        language: "JavaScript",
        keywords: ["Search", "UI", "Input"],
        usage: 35
    },

    {
        id: 10,
        name: "API Error Handler",
        description:
            "Standardised error handling utility for REST API responses.",
        category: "API",
        type: "Code",
        language: "Python",
        keywords: ["API", "Error", "REST"],
        usage: 19
    },

    {
        id: 11,
        name: "Pagination Utility",
        description:
            "Reusable pagination logic for displaying large datasets.",
        category: "Utilities",
        type: "Code",
        language: "Python",
        keywords: ["Pagination", "Utility", "Data"],
        usage: 12
    },

    {
        id: 12,
        name: "Class Diagram Template",
        description:
            "Reusable UML class diagram structure for software design.",
        category: "Database",
        type: "Design",
        language: "SQL",
        keywords: ["UML", "Class", "Design"],
        usage: 9
    }

];


const params =
    new URLSearchParams(window.location.search);

const id =
    Number(params.get("id"));


const component =
    components.find(item => item.id === id);


const container =
    document.getElementById("componentContainer");


function displayComponent(component) {

    container.innerHTML = `

        <div class="details-card">

            <div class="details-header">

                <div class="details-title">

                    <div class="details-icon">
                        ${component.name.charAt(0)}
                    </div>

                    <div>

                        <h1>
                            ${component.name}
                        </h1>

                        <p>
                            ${component.category}
                        </p>

                    </div>

                </div>


                <span class="type-badge">
                    ${component.type}
                </span>

            </div>


            <div class="details-section">

                <h2>
                    Description
                </h2>

                <p class="description">
                    ${component.description}
                </p>

            </div>


            <div class="details-section">

                <h2>
                    Component Information
                </h2>


                <div class="info-grid">

                    <div class="info-box">

                        <span>
                            Category
                        </span>

                        <strong>
                            ${component.category}
                        </strong>

                    </div>


                    <div class="info-box">

                        <span>
                            Type
                        </span>

                        <strong>
                            ${component.type}
                        </strong>

                    </div>


                    <div class="info-box">

                        <span>
                            Language
                        </span>

                        <strong>
                            ${component.language}
                        </strong>

                    </div>

                </div>

            </div>


            <div class="details-section">

                <h2>
                    Keywords
                </h2>


                <div class="tags">

                    ${component.keywords
                        .map(keyword =>
                            `<span class="tag">${keyword}</span>`
                        )
                        .join("")
                    }

                </div>

            </div>


            <div class="details-section">

                <h2>
                    Usage
                </h2>


                <div class="usage-box">

                    <div class="usage-number">
                        ${component.usage}
                    </div>

                    <div class="usage-text">
                        times this component has been used
                        in the catalogue.
                    </div>

                </div>

            </div>


            <div class="actions">

                <button
                    class="btn btn-primary"
                    onclick="useComponent()"
                >
                    Use Component
                </button>


                <button
                    class="btn btn-secondary"
                    onclick="window.location.href='browse.html'"
                >
                    Back to Browse
                </button>

            </div>

        </div>

    `;

}


function useComponent() {

    alert(
        `Using ${component.name}`
    );

}


if (component) {

    displayComponent(component);

} else {

    container.innerHTML = `

        <div class="details-card not-found">

            <h2>
                Component Not Found
            </h2>

            <p>
                The requested component does not exist.
            </p>

            <br>

            <button
                class="btn btn-primary"
                onclick="window.location.href='browse.html'"
            >
                Back to Browse
            </button>

        </div>

    `;

}


lucide.createIcons();