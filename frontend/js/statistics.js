const components = [

    {
        id: 1,
        name: "JWT Authentication",
        category: "Authentication",
        type: "Code",
        language: "Python",
        usage: 24
    },

    {
        id: 2,
        name: "Login Form",
        category: "Frontend",
        type: "Code",
        language: "JavaScript",
        usage: 18
    },

    {
        id: 3,
        name: "MySQL CRUD Module",
        category: "Database",
        type: "Code",
        language: "Python",
        usage: 31
    },

    {
        id: 4,
        name: "REST API Client",
        category: "API & Integration",
        type: "Code",
        language: "Python",
        usage: 16
    },

    {
        id: 5,
        name: "Navigation Bar",
        category: "Frontend",
        type: "Code",
        language: "JavaScript",
        usage: 27
    },

    {
        id: 6,
        name: "Password Hashing",
        category: "Authentication",
        type: "Code",
        language: "Python",
        usage: 22
    },

    {
        id: 7,
        name: "Database ER Diagram",
        category: "Database",
        type: "Design",
        language: "SQL",
        usage: 11
    },

    {
        id: 8,
        name: "File Upload Handler",
        category: "File Handling",
        type: "Code",
        language: "Python",
        usage: 14
    },

    {
        id: 9,
        name: "Search Bar",
        category: "Frontend",
        type: "Code",
        language: "JavaScript",
        usage: 35
    },

    {
        id: 10,
        name: "API Error Handler",
        category: "API & Integration",
        type: "Code",
        language: "Python",
        usage: 19
    },

    {
        id: 11,
        name: "Pagination Utility",
        category: "Utilities",
        type: "Code",
        language: "Python",
        usage: 12
    },

    {
        id: 12,
        name: "Class Diagram Template",
        category: "Database",
        type: "Design",
        language: "SQL",
        usage: 9
    }

];


/* =========================
   SUMMARY STATISTICS
========================= */

const totalComponents =
    components.length;


const totalUsage =
    components.reduce(
        (total, component) =>
            total + component.usage,
        0
    );


const categories =
    new Set(
        components.map(
            component => component.category
        )
    ).size;


const averageUsage =
    Math.round(
        totalUsage / totalComponents
    );


const summaryGrid =
    document.getElementById("summaryGrid");


summaryGrid.innerHTML = `

    <div class="summary-card">

        <div class="summary-top">

            <div class="summary-icon">
                <i data-lucide="box"></i>
            </div>

        </div>

        <div class="summary-label">
            Total Components
        </div>

        <div class="summary-value">
            ${totalComponents}
        </div>

    </div>


    <div class="summary-card">

        <div class="summary-top">

            <div class="summary-icon">
                <i data-lucide="layers"></i>
            </div>

        </div>

        <div class="summary-label">
            Categories
        </div>

        <div class="summary-value">
            ${categories}
        </div>

    </div>


    <div class="summary-card">

        <div class="summary-top">

            <div class="summary-icon">
                <i data-lucide="activity"></i>
            </div>

        </div>

        <div class="summary-label">
            Total Usage
        </div>

        <div class="summary-value">
            ${totalUsage}
        </div>

    </div>


    <div class="summary-card">

        <div class="summary-top">

            <div class="summary-icon">
                <i data-lucide="bar-chart-3"></i>
            </div>

        </div>

        <div class="summary-label">
            Average Usage
        </div>

        <div class="summary-value">
            ${averageUsage}
        </div>

    </div>

`;


/* =========================
   CATEGORY STATISTICS
========================= */

const categoryCounts = {};


components.forEach(component => {

    if (!categoryCounts[component.category]) {

        categoryCounts[component.category] = 0;

    }

    categoryCounts[component.category]++;

});


const categoryStats =
    document.getElementById("categoryStats");


const maxCategoryCount =
    Math.max(
        ...Object.values(categoryCounts)
    );


Object.entries(categoryCounts)
    .forEach(([category, count]) => {

        const percentage =
            (count / maxCategoryCount) * 100;


        const row =
            document.createElement("div");

        row.className =
            "category-row";


        row.innerHTML = `

            <div class="category-info">

                <span>
                    ${category}
                </span>

                <span class="category-count">
                    ${count}
                </span>

            </div>

            <div class="progress">

                <div
                    class="progress-bar"
                    style="width: ${percentage}%"
                ></div>

            </div>

        `;


        categoryStats.appendChild(row);

    });


/* =========================
   MOST USED COMPONENTS
========================= */

const usageList =
    document.getElementById("usageList");


const mostUsed =
    [...components]
        .sort(
            (a, b) =>
                b.usage - a.usage
        )
        .slice(0, 5);


mostUsed.forEach(component => {

    const item =
        document.createElement("div");

    item.className =
        "usage-item";


    item.innerHTML = `

        <div class="usage-icon">
            ${component.name.charAt(0)}
        </div>

        <div class="usage-info">

            <div class="usage-name">
                ${component.name}
            </div>

            <div class="usage-category">
                ${component.category}
            </div>

        </div>

        <div class="usage-number">
            ${component.usage}
        </div>

    `;


    usageList.appendChild(item);

});


/* =========================
   COMPONENT TABLE
========================= */

const componentTable =
    document.getElementById("componentTable");


components.forEach(component => {

    const row =
        document.createElement("tr");


    row.innerHTML = `

        <td>
            ${component.name}
        </td>

        <td>
            <span class="table-tag">
                ${component.category}
            </span>
        </td>

        <td>
            ${component.type}
        </td>

        <td>
            ${component.language}
        </td>

        <td>
            ${component.usage}
        </td>

    `;


    componentTable.appendChild(row);

});


lucide.createIcons();