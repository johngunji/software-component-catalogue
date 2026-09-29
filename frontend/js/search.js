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


const searchInput =
    document.getElementById("searchInput");

const searchButton =
    document.getElementById("searchButton");

const resultsGrid =
    document.getElementById("resultsGrid");

const resultCount =
    document.getElementById("resultCount");

const resultsTitle =
    document.getElementById("resultsTitle");

const emptyResults =
    document.getElementById("emptyResults");


function searchComponents() {

    const query =
        searchInput.value
            .toLowerCase()
            .trim();


    if (query === "") {

        renderResults(
            components,
            "All Components"
        );

        return;
    }


    const results =
        components.filter(component => {

            const searchableText = [

                component.name,

                component.description,

                component.category,

                component.type,

                component.language,

                ...component.keywords

            ]
                .join(" ")
                .toLowerCase();


            return searchableText.includes(query);

        });


    renderResults(
        results,
        `Search results for "${searchInput.value}"`
    );

}


function renderResults(data, title) {

    resultsGrid.innerHTML = "";

    resultsTitle.textContent = title;

    resultCount.textContent =
        `${data.length} components`;


    if (data.length === 0) {

        emptyResults.style.display =
            "block";

        return;
    }


    emptyResults.style.display =
        "none";


    data.forEach(component => {

        const card =
            document.createElement("div");

        card.className =
            "result-card";


        card.innerHTML = `

            <div class="result-top">

                <div class="result-icon">
                    ${component.name.charAt(0)}
                </div>

                <span class="result-type">
                    ${component.type}
                </span>

            </div>


            <h3>
                ${component.name}
            </h3>


            <p class="result-description">
                ${component.description}
            </p>


            <div class="result-meta">

                <span class="result-tag">
                    ${component.category}
                </span>

                <span class="result-tag">
                    ${component.language}
                </span>

                ${component.keywords
                    .map(keyword =>
                        `<span class="result-tag">${keyword}</span>`
                    )
                    .join("")
                }

            </div>


            <div class="result-footer">

                <span class="result-usage">
                    Used ${component.usage} times
                </span>

                <button
                    class="details-link"
                    onclick="viewComponent(${component.id})"
                >
                    View Details →
                </button>

            </div>

        `;


        resultsGrid.appendChild(card);

    });

}


function viewComponent(id) {

    window.location.href =
        `component.html?id=${id}`;

}


function usePopularSearch(term) {

    searchInput.value = term;

    searchComponents();

}


/* Search button */

searchButton.addEventListener(
    "click",
    searchComponents
);


/* Enter key */

searchInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            searchComponents();

        }

    }
);


/* Popular searches */

document
    .querySelectorAll(".search-tag")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                usePopularSearch(
                    button.textContent.trim()
                );

            }
        );

    });


/* Initial page */

const initialQuery =
    new URLSearchParams(window.location.search)
        .get("q")
        ?.trim();

if (initialQuery) {

    searchInput.value = initialQuery;

    searchComponents();

} else {

    renderResults(
        components,
        "All Components"
    );

}


/* Icons */

lucide.createIcons();