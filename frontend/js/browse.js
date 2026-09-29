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
        category: "File Handling",
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


const grid =
    document.getElementById("componentsGrid");

const searchInput =
    document.getElementById("searchInput");

const categoryFilter =
    document.getElementById("categoryFilter");

const typeFilter =
    document.getElementById("typeFilter");

const languageFilter =
    document.getElementById("languageFilter");

const sortFilter =
    document.getElementById("sortFilter");

const totalCount =
    document.getElementById("totalCount");

const noResults =
    document.getElementById("noResults");


function renderComponents(data) {

    grid.innerHTML = "";

    totalCount.textContent =
        `${data.length} components`;


    if (data.length === 0) {

        noResults.style.display = "block";

        return;
    }


    noResults.style.display = "none";


    data.forEach(component => {

        const card =
            document.createElement("div");

        card.className =
            "component-card";


        card.innerHTML = `

            <div class="component-top">

                <div class="component-icon">
                    ${component.name.charAt(0)}
                </div>

                <span class="component-type">
                    ${component.type}
                </span>

            </div>


            <h3>
                ${component.name}
            </h3>


            <p class="component-description">
                ${component.description}
            </p>


            <div class="component-meta">

                <span class="tag">
                    ${component.category}
                </span>

                <span class="tag">
                    ${component.language}
                </span>

                ${component.keywords
                    .map(keyword =>
                        `<span class="tag">${keyword}</span>`
                    )
                    .join("")
                }

            </div>


            <div class="component-footer">

                <span class="usage">
                    Used ${component.usage} times
                </span>

                <button
                    class="view-button"
                    onclick="viewComponent(${component.id})"
                >
                    View Details →
                </button>

            </div>

        `;


        grid.appendChild(card);

    });

}


function filterComponents() {

    const search =
        searchInput.value
            .toLowerCase()
            .trim();

    const category =
        categoryFilter.value;

    const type =
        typeFilter.value;

    const language =
        languageFilter.value;


    let filtered =
        components.filter(component => {

            const matchesSearch =

                component.name
                    .toLowerCase()
                    .includes(search)

                ||

                component.description
                    .toLowerCase()
                    .includes(search)

                ||

                component.keywords.some(keyword =>
                    keyword
                        .toLowerCase()
                        .includes(search)
                );


            const matchesCategory =
                category === "all" ||
                component.category === category;


            const matchesType =
                type === "all" ||
                component.type === type;


            const matchesLanguage =
                language === "all" ||
                component.language === language;


            return (
                matchesSearch &&
                matchesCategory &&
                matchesType &&
                matchesLanguage
            );

        });


    filtered =
        sortComponents(filtered);

    renderComponents(filtered);
}


function sortComponents(data) {

    const sort =
        sortFilter.value;


    const sorted =
        [...data];


    if (sort === "name") {

        sorted.sort((a, b) =>
            a.name.localeCompare(b.name)
        );

    }


    if (sort === "usage") {

        sorted.sort((a, b) =>
            b.usage - a.usage
        );

    }


    if (sort === "newest") {

        sorted.reverse();

    }


    return sorted;
}


function viewComponent(id) {

    window.location.href =
        `component.html?id=${id}`;

}


/* Event listeners */

searchInput.addEventListener(
    "input",
    filterComponents
);

categoryFilter.addEventListener(
    "change",
    filterComponents
);

typeFilter.addEventListener(
    "change",
    filterComponents
);

languageFilter.addEventListener(
    "change",
    filterComponents
);

sortFilter.addEventListener(
    "change",
    filterComponents
);


/* Initial render */

const categoryAliases = {
    "UI / Frontend": "Frontend",
    "API & Integration": "API"
};

const requestedCategory =
    new URLSearchParams(window.location.search)
        .get("category");

const initialCategory =
    categoryAliases[requestedCategory] || requestedCategory;

if (
    initialCategory &&
    Array.from(categoryFilter.options)
        .some(option => option.value === initialCategory)
) {

    categoryFilter.value = initialCategory;

    filterComponents();

} else {

    renderComponents(components);

}


/* Initialize icons */

lucide.createIcons();