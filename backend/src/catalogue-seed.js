const categories = [
    { name: "Frontend", parent: null },
    { name: "UI Components", parent: "Frontend" },
    { name: "HTTP Clients", parent: "Frontend" },
    { name: "Backend & API", parent: null },
    { name: "Web Frameworks", parent: "Backend & API" },
    { name: "Middleware", parent: "Backend & API" },
    { name: "Authentication & Security", parent: null },
    { name: "Authentication", parent: "Authentication & Security" },
    { name: "Database & Data", parent: null },
    { name: "Computer Vision / Data Utilities", parent: "Database & Data" },
    { name: "Software Design", parent: null },
    { name: "UML", parent: "Software Design" },
    { name: "ERD", parent: "Software Design" },
    { name: "Architecture", parent: "Software Design" }
];

const components = [
    {
        name: "Express.js",
        type: "Code",
        tech: "JavaScript",
        category: ["Backend & API", "Web Frameworks"],
        description: "Fast, minimalist web framework for Node.js applications and HTTP APIs.",
        keywords: ["nodejs", "express", "backend", "api", "web"],
        url: "https://github.com/expressjs/express"
    },
    {
        name: "Flask",
        type: "Code",
        tech: "Python",
        category: ["Backend & API", "Web Frameworks"],
        description: "Lightweight Python web framework for building web applications and REST APIs.",
        keywords: ["python", "flask", "backend", "web", "api"],
        url: "https://github.com/pallets/flask"
    },
    {
        name: "React",
        type: "Code",
        tech: "JavaScript",
        category: ["Frontend", "UI Components"],
        description: "Component-based JavaScript library for building interactive user interfaces.",
        keywords: ["react", "javascript", "ui", "frontend", "components"],
        url: "https://github.com/react/react"
    },
    {
        name: "Bootstrap",
        type: "Code",
        tech: "HTML/CSS/JavaScript",
        category: ["Frontend", "UI Components"],
        description: "Responsive front-end toolkit with reusable UI components and layout utilities.",
        keywords: ["bootstrap", "css", "frontend", "ui", "responsive"],
        url: "https://github.com/twbs/bootstrap"
    },
    {
        name: "Axios",
        type: "Code",
        tech: "JavaScript",
        category: ["Frontend", "HTTP Clients"],
        description: "Promise-based HTTP client for browser and Node.js applications.",
        keywords: ["axios", "http", "api", "javascript", "client"],
        url: "https://github.com/axios/axios"
    },
    {
        name: "OpenCV",
        type: "Code",
        tech: "C++/Python",
        category: ["Database & Data", "Computer Vision / Data Utilities"],
        description: "Open-source computer vision library providing reusable image and video processing functionality.",
        keywords: ["opencv", "computer-vision", "image-processing", "python", "c++"],
        url: "https://github.com/opencv/opencv"
    },
    {
        name: "Lodash",
        type: "Code",
        tech: "JavaScript",
        category: ["Database & Data", "Computer Vision / Data Utilities"],
        description: "Utility library providing reusable functions for arrays, objects, strings, and functional programming.",
        keywords: ["lodash", "javascript", "utility", "arrays", "objects"],
        url: "https://github.com/lodash/lodash"
    },
    {
        name: "Multer",
        type: "Code",
        tech: "JavaScript",
        category: ["Backend & API", "Middleware"],
        description: "Express middleware for handling multipart/form-data and file uploads.",
        keywords: ["multer", "express", "upload", "files", "middleware"],
        url: "https://github.com/expressjs/multer"
    },
    {
        name: "JSON Web Token",
        type: "Code",
        tech: "JavaScript",
        category: ["Authentication & Security", "Authentication"],
        description: "JavaScript implementation of JSON Web Tokens for authentication and secure token-based communication.",
        keywords: ["jwt", "authentication", "security", "token", "javascript"],
        url: "https://github.com/auth0/node-jsonwebtoken"
    },
    {
        name: "UML Class Diagram Template",
        type: "Design",
        tech: "UML",
        category: ["Software Design", "UML"],
        description: "Reusable starting point for modelling classes, attributes, operations, and relationships in software design.",
        keywords: ["uml", "class-diagram", "software-design", "modelling"],
        url: "https://github.com/jgraph/drawio"
    },
    {
        name: "ER Diagram Template",
        type: "Design",
        tech: "ERD",
        category: ["Software Design", "ERD"],
        description: "Reusable diagramming resource for modelling entities, attributes, and relationships in database design.",
        keywords: ["erd", "database", "entity", "relationship", "schema"],
        url: "https://github.com/jgraph/drawio"
    },
    {
        name: "C4 Architecture Example",
        type: "Design",
        tech: "C4",
        category: ["Software Design", "Architecture"],
        description: "Reusable architecture modelling example showing system context, containers, components, and deployment views.",
        keywords: ["c4", "architecture", "system-design", "containers", "deployment"],
        url: "https://www.structurizr.com/public/1"
    }
];

const seedCatalogue = (db, createdBy) => {
    const categoryIds = new Map();
    const insertCategory = db.prepare(`
        INSERT INTO categories(name, parent_id)
        VALUES(?, ?)
    `);

    for (const category of categories) {
        const parentId = category.parent
            ? categoryIds.get(category.parent)
            : null;

        if (category.parent && !parentId) {
            throw new Error(`Missing parent category: ${category.parent}`);
        }

        const id = insertCategory.run(category.name, parentId).lastInsertRowid;
        categoryIds.set(category.name, Number(id));
    }

    const insertComponent = db.prepare(`
        INSERT INTO components(
            name, description, category_id, type, tech, url,
            used_count, queried_not_used_count, added_on, created_by
        )
        VALUES(?, ?, ?, ?, ?, ?, 0, 0, date('now'), ?)
    `);
    const insertKeyword = db.prepare(`
        INSERT OR IGNORE INTO keywords(word) VALUES(?)
    `);
    const findKeyword = db.prepare(`
        SELECT id FROM keywords WHERE word=?
    `);
    const linkKeyword = db.prepare(`
        INSERT INTO component_keywords(component_id, keyword_id)
        VALUES(?, ?)
    `);

    for (const component of components) {
        const categoryId = categoryIds.get(component.category[1]);
        if (!categoryId) {
            throw new Error(`Missing component category: ${component.category.join(" > ")}`);
        }

        const id = insertComponent.run(
            component.name,
            component.description,
            categoryId,
            component.type,
            component.tech,
            component.url,
            createdBy
        ).lastInsertRowid;

        for (const word of component.keywords) {
            insertKeyword.run(word);
            linkKeyword.run(id, findKeyword.get(word).id);
        }
    }
};

module.exports = {
    categories,
    components,
    seedCatalogue
};
