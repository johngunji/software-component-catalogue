const categories = [
    { name: "Frontend", parent: null },
    { name: "UI Components", parent: "Frontend" },
    { name: "CSS Frameworks", parent: "Frontend" },
    { name: "Forms", parent: "Frontend" },
    { name: "HTTP Clients", parent: "Frontend" },
    { name: "State Management", parent: "Frontend" },
    { name: "Routing", parent: "Frontend" },
    { name: "Backend & API", parent: null },
    { name: "Web Frameworks", parent: "Backend & API" },
    { name: "Middleware", parent: "Backend & API" },
    { name: "API Utilities", parent: "Backend & API" },
    { name: "Validation", parent: "Backend & API" },
    { name: "Authentication & Security", parent: null },
    { name: "Authentication", parent: "Authentication & Security" },
    { name: "Authorization", parent: "Authentication & Security" },
    { name: "Security Utilities", parent: "Authentication & Security" },
    { name: "Database & Data", parent: null },
    { name: "SQL", parent: "Database & Data" },
    { name: "ORM", parent: "Database & Data" },
    { name: "Data Processing", parent: "Database & Data" },
    { name: "Caching", parent: "Database & Data" },
    { name: "Software Design", parent: null },
    { name: "UML", parent: "Software Design" },
    { name: "ERD", parent: "Software Design" },
    { name: "DFD", parent: "Software Design" },
    { name: "Architecture", parent: "Software Design" },
    { name: "Design Patterns", parent: "Software Design" },
    { name: "API Design", parent: "Software Design" },
    { name: "Testing", parent: null },
    { name: "Unit Testing", parent: "Testing" },
    { name: "Integration Testing", parent: "Testing" },
    { name: "API Testing", parent: "Testing" },
    { name: "Mocking", parent: "Testing" },
    { name: "DevOps & Deployment", parent: null },
    { name: "Containers", parent: "DevOps & Deployment" },
    { name: "CI/CD", parent: "DevOps & Deployment" },
    { name: "Deployment", parent: "DevOps & Deployment" },
    { name: "Configuration", parent: "DevOps & Deployment" }
];

const components = [
    {
        name: "Express.js",
        type: "Code",
        tech: "JavaScript",
        category: ["Backend & API", "Web Frameworks"],
        description: "Express is a minimal Node.js web framework for handling routes, middleware, and HTTP responses. Developers use it as a straightforward foundation for websites and REST APIs that need a flexible server structure.",
        keywords: ["nodejs", "express", "backend", "api", "web", "javascript"],
        url: "https://github.com/expressjs/express"
    },
    {
        name: "Flask",
        type: "Code",
        tech: "Python",
        category: ["Backend & API", "Web Frameworks"],
        description: "Flask is a lightweight Python framework for building web applications and REST APIs. Its small core lets beginners add only the extensions they need while keeping request handling easy to understand.",
        keywords: ["python", "flask", "backend", "web", "api", "rest"],
        url: "https://github.com/pallets/flask"
    },
    {
        name: "React",
        type: "Code",
        tech: "JavaScript",
        category: ["Frontend", "UI Components"],
        description: "React is a component-based JavaScript library for building interactive user interfaces. It helps teams split a screen into reusable pieces whose output updates when application data changes.",
        keywords: ["react", "javascript", "ui", "frontend", "components", "spa"],
        url: "https://github.com/facebook/react"
    },
    {
        name: "Bootstrap",
        type: "Code",
        tech: "HTML/CSS/JavaScript",
        category: ["Frontend", "UI Components"],
        description: "Bootstrap is a front-end toolkit with responsive layout utilities and ready-made interface components. It is useful when a project needs a consistent, mobile-friendly starting point without designing every control from scratch.",
        keywords: ["bootstrap", "css", "frontend", "ui", "responsive", "components"],
        url: "https://github.com/twbs/bootstrap"
    },
    {
        name: "Axios",
        type: "Code",
        tech: "JavaScript",
        category: ["Frontend", "HTTP Clients"],
        description: "Axios is a promise-based HTTP client for browser and Node.js applications. It provides a reusable way to send API requests, configure headers, parse responses, and handle failures in one place.",
        keywords: ["axios", "http", "api", "javascript", "client", "rest"],
        url: "https://github.com/axios/axios"
    },
    {
        name: "OpenCV",
        type: "Code",
        tech: "C++/Python",
        category: ["Database & Data", "Data Processing"],
        description: "OpenCV provides reusable algorithms for image processing, computer vision, and video analysis. It is useful when an application needs to detect, transform, or measure visual data rather than implement those algorithms itself.",
        keywords: ["opencv", "computer-vision", "image-processing", "python", "cpp", "video"],
        url: "https://github.com/opencv/opencv"
    },
    {
        name: "Lodash",
        type: "Code",
        tech: "JavaScript",
        category: ["Database & Data", "Data Processing"],
        description: "Lodash offers well-tested helpers for arrays, objects, strings, and common functional-programming tasks. Developers use it to make data transformation code clearer and avoid repeatedly writing utility functions.",
        keywords: ["lodash", "javascript", "utility", "arrays", "objects", "data"],
        url: "https://github.com/lodash/lodash"
    },
    {
        name: "Multer",
        type: "Code",
        tech: "JavaScript",
        category: ["Backend & API", "Middleware"],
        description: "Multer is Express middleware for receiving multipart/form-data, including uploaded files. It is useful for profile images, document attachments, and other endpoints that need controlled file handling.",
        keywords: ["multer", "express", "upload", "files", "middleware", "multipart"],
        url: "https://github.com/expressjs/multer"
    },
    {
        name: "JSON Web Token",
        type: "Code",
        tech: "JavaScript",
        category: ["Authentication & Security", "Authentication"],
        description: "JSON Web Token is a JavaScript implementation for creating and verifying signed tokens. It is useful for carrying authenticated user claims between a client and API when a stateless session approach is appropriate.",
        keywords: ["jwt", "authentication", "security", "token", "javascript", "authorization"],
        url: "https://github.com/auth0/node-jsonwebtoken"
    },
    {
        name: "Tailwind CSS",
        type: "Code",
        tech: "CSS",
        category: ["Frontend", "CSS Frameworks"],
        description: "Tailwind CSS is a utility-first CSS framework that provides low-level classes for composing custom interfaces. It helps developers build consistent responsive layouts directly in markup without maintaining a large set of bespoke selectors.",
        keywords: ["tailwind", "css", "frontend", "responsive", "utility", "design"],
        url: "https://github.com/tailwindlabs/tailwindcss"
    },
    {
        name: "Material UI",
        type: "Code",
        tech: "React/TypeScript",
        category: ["Frontend", "UI Components"],
        description: "Material UI is a React component library implementing Google's Material Design language. It gives applications accessible buttons, dialogs, forms, and layout primitives that can be themed and reused.",
        keywords: ["react", "material-ui", "components", "frontend", "accessibility", "typescript"],
        url: "https://github.com/mui/material-ui"
    },
    {
        name: "React Hook Form",
        type: "Code",
        tech: "React/TypeScript",
        category: ["Frontend", "Forms"],
        description: "React Hook Form manages form state and validation with a small amount of React code. It is useful for reusable forms that need efficient updates, field errors, and straightforward submission handling.",
        keywords: ["react", "forms", "validation", "frontend", "typescript", "inputs"],
        url: "https://github.com/react-hook-form/react-hook-form"
    },
    {
        name: "Zod",
        type: "Code",
        tech: "TypeScript",
        category: ["Backend & API", "Validation"],
        description: "Zod lets developers describe data schemas and validate unknown input at runtime while inferring TypeScript types. It is useful at API boundaries, form submissions, and configuration loading where untrusted data needs clear errors.",
        keywords: ["zod", "typescript", "validation", "schema", "api", "forms"],
        url: "https://github.com/colinhacks/zod"
    },
    {
        name: "React Router",
        type: "Code",
        tech: "React/JavaScript",
        category: ["Frontend", "Routing"],
        description: "React Router maps browser URLs to React screens and nested layouts. It is useful for single-page applications that need navigation, route parameters, protected pages, and browser history support.",
        keywords: ["react", "routing", "frontend", "spa", "navigation", "javascript"],
        url: "https://github.com/remix-run/react-router"
    },
    {
        name: "Redux Toolkit",
        type: "Code",
        tech: "JavaScript/TypeScript",
        category: ["Frontend", "State Management"],
        description: "Redux Toolkit provides recommended helpers for creating predictable global application state. It reduces boilerplate for actions and reducers and is useful when many screens must coordinate shared data.",
        keywords: ["redux", "state-management", "react", "frontend", "typescript", "javascript"],
        url: "https://github.com/reduxjs/redux-toolkit"
    },
    {
        name: "Node.js",
        type: "Code",
        tech: "JavaScript",
        category: ["Backend & API", "Web Frameworks"],
        description: "Node.js is a JavaScript runtime for building server applications and command-line tools outside the browser. Its asynchronous I/O model is useful for APIs and services that handle many network or file operations.",
        keywords: ["nodejs", "javascript", "runtime", "backend", "server", "api"],
        url: "https://github.com/nodejs/node"
    },
    {
        name: "Django",
        type: "Code",
        tech: "Python",
        category: ["Backend & API", "Web Frameworks"],
        description: "Django is a batteries-included Python web framework with routing, models, administration, and security features. It helps teams build data-driven websites quickly while following established project conventions.",
        keywords: ["python", "django", "backend", "web", "rest", "framework"],
        url: "https://github.com/django/django"
    },
    {
        name: "FastAPI",
        type: "Code",
        tech: "Python",
        category: ["Backend & API", "Web Frameworks"],
        description: "FastAPI is a modern Python framework for typed web APIs that generates interactive documentation from endpoint definitions. It is useful when a service needs validation, asynchronous handlers, and a clear OpenAPI contract.",
        keywords: ["python", "fastapi", "api", "rest", "async", "openapi"],
        url: "https://github.com/fastapi/fastapi"
    },
    {
        name: "CORS Middleware",
        type: "Code",
        tech: "JavaScript",
        category: ["Backend & API", "Middleware"],
        description: "The Express CORS middleware adds controlled Cross-Origin Resource Sharing headers to HTTP responses. It is useful when a browser frontend and API run on different origins and the server must explicitly allow safe requests.",
        keywords: ["cors", "express", "middleware", "security", "api", "browser"],
        url: "https://github.com/expressjs/cors"
    },
    {
        name: "Pino",
        type: "Code",
        tech: "Node.js",
        category: ["Backend & API", "Middleware"],
        description: "Pino is a fast structured logger for Node.js applications. It helps services record searchable JSON events, errors, and request context consistently instead of relying on ad hoc console output.",
        keywords: ["pino", "logging", "nodejs", "backend", "observability", "json"],
        url: "https://github.com/pinojs/pino"
    },
    {
        name: "OpenAPI Specification",
        type: "Code",
        tech: "YAML/JSON",
        category: ["Backend & API", "API Utilities"],
        description: "OpenAPI is a machine-readable description format for HTTP APIs. Teams use it to agree on request and response contracts, generate documentation, and create client or server tooling before implementation is complete.",
        keywords: ["openapi", "swagger", "api", "rest", "documentation", "contract"],
        url: "https://github.com/OAI/OpenAPI-Specification"
    },
    {
        name: "Swagger UI",
        type: "Code",
        tech: "JavaScript",
        category: ["Backend & API", "API Utilities"],
        description: "Swagger UI renders an OpenAPI document as interactive API documentation. It is useful for exploring endpoints, trying requests, and giving frontend developers a reliable reference for backend behavior.",
        keywords: ["swagger", "openapi", "api", "documentation", "testing", "rest"],
        url: "https://github.com/swagger-api/swagger-ui"
    },
    {
        name: "Bcrypt",
        type: "Code",
        tech: "JavaScript",
        category: ["Authentication & Security", "Security Utilities"],
        description: "Bcrypt hashes passwords with a deliberately expensive one-way algorithm and verifies entered passwords against those hashes. It is useful for storing passwords without retaining the original secret, when configured with an appropriate work factor.",
        keywords: ["bcrypt", "password", "hashing", "security", "authentication", "nodejs"],
        url: "https://github.com/kelektiv/node.bcrypt.js"
    },
    {
        name: "Passport.js",
        type: "Code",
        tech: "JavaScript",
        category: ["Authentication & Security", "Authentication"],
        description: "Passport.js provides a middleware-based framework for plugging authentication strategies into Node.js applications. It is useful when a service needs reusable local, OAuth, or token authentication flows without mixing them into route handlers.",
        keywords: ["passport", "authentication", "oauth", "nodejs", "middleware", "security"],
        url: "https://github.com/jaredhanson/passport"
    },
    {
        name: "CASL",
        type: "Code",
        tech: "JavaScript/TypeScript",
        category: ["Authentication & Security", "Authorization"],
        description: "CASL defines permission rules and checks whether a user can perform an action on a resource. It is useful for keeping role- and attribute-based authorization consistent across UI controls and backend services.",
        keywords: ["casl", "authorization", "permissions", "roles", "security", "typescript"],
        url: "https://github.com/stalniy/casl"
    },
    {
        name: "Helmet",
        type: "Code",
        tech: "Node.js",
        category: ["Authentication & Security", "Security Utilities"],
        description: "Helmet configures a collection of HTTP security headers for Express applications. It provides sensible protection against several browser-side attacks and is useful as one layer of a broader application security strategy.",
        keywords: ["helmet", "security", "express", "headers", "nodejs", "middleware"],
        url: "https://github.com/helmetjs/helmet"
    },
    {
        name: "Knex.js",
        type: "Code",
        tech: "JavaScript",
        category: ["Database & Data", "SQL"],
        description: "Knex.js is a SQL query builder that supports several relational databases and parameterized queries. It is useful when a project wants readable database access and migrations without adopting a full ORM.",
        keywords: ["knex", "sql", "database", "query-builder", "nodejs", "migrations"],
        url: "https://github.com/knex/knex"
    },
    {
        name: "Prisma",
        type: "Code",
        tech: "TypeScript",
        category: ["Database & Data", "ORM"],
        description: "Prisma is a type-safe database toolkit with a schema, generated client, and migration workflow. It helps application developers query relational data with editor assistance while keeping models and database changes explicit.",
        keywords: ["prisma", "orm", "database", "typescript", "sql", "migrations"],
        url: "https://github.com/prisma/prisma"
    },
    {
        name: "Sequelize",
        type: "Code",
        tech: "JavaScript",
        category: ["Database & Data", "ORM"],
        description: "Sequelize is a promise-based ORM for Node.js that models tables, relationships, and queries in JavaScript. It is useful for applications that need reusable data-access models across supported SQL databases.",
        keywords: ["sequelize", "orm", "database", "sql", "nodejs", "models"],
        url: "https://github.com/sequelize/sequelize"
    },
    {
        name: "SQLite",
        type: "Code",
        tech: "SQL/C",
        category: ["Database & Data", "SQL"],
        description: "SQLite is a small embedded relational database stored in a single file. It is useful for prototypes, desktop tools, tests, and modest services that need reliable SQL without a separate database server.",
        keywords: ["sqlite", "sql", "database", "embedded", "storage", "testing"],
        url: "https://github.com/sqlite/sqlite"
    },
    {
        name: "Redis",
        type: "Code",
        tech: "C",
        category: ["Database & Data", "Caching"],
        description: "Redis is an in-memory data store commonly used for caching, queues, counters, and short-lived sessions. It can reduce database load and speed up repeated reads when an application can tolerate an external service.",
        keywords: ["redis", "cache", "caching", "database", "sessions", "queue"],
        url: "https://github.com/redis/redis"
    },
    {
        name: "node-cache",
        type: "Code",
        tech: "JavaScript",
        category: ["Database & Data", "Caching"],
        description: "node-cache provides a simple in-process key-value cache for Node.js. It is useful for small applications that need to avoid repeated calculations or lookups without operating a separate cache server.",
        keywords: ["node-cache", "cache", "caching", "nodejs", "performance", "javascript"],
        url: "https://github.com/node-cache/node-cache"
    },
    {
        name: "Papa Parse",
        type: "Code",
        tech: "JavaScript",
        category: ["Database & Data", "Data Processing"],
        description: "Papa Parse parses and generates CSV data in browsers and Node.js, including large files and streaming workflows. It is useful for import/export features, spreadsheet data, and simple data-processing pipelines.",
        keywords: ["csv", "parsing", "data", "javascript", "import", "export"],
        url: "https://github.com/mholt/PapaParse"
    },
    {
        name: "Zustand",
        type: "Code",
        tech: "React/TypeScript",
        category: ["Frontend", "State Management"],
        description: "Zustand is a small state-management library that exposes simple stores as hooks. It is useful when a React application needs shared state without the ceremony of a large action and reducer architecture.",
        keywords: ["zustand", "react", "state-management", "frontend", "typescript", "store"],
        url: "https://github.com/pmndrs/zustand"
    },
    {
        name: "Jest",
        type: "Code",
        tech: "JavaScript/TypeScript",
        category: ["Testing", "Unit Testing"],
        description: "Jest is a JavaScript testing framework with assertions, mocks, snapshots, and a test runner. It is useful for fast unit tests that verify functions and components in isolation.",
        keywords: ["jest", "testing", "unit-testing", "javascript", "typescript", "mocking"],
        url: "https://github.com/jestjs/jest"
    },
    {
        name: "Vitest",
        type: "Code",
        tech: "JavaScript/TypeScript",
        category: ["Testing", "Unit Testing"],
        description: "Vitest is a fast unit-test framework designed to work naturally with modern Vite projects. It provides familiar assertions, mocking, and watch mode for testing JavaScript and TypeScript modules close to their build setup.",
        keywords: ["vitest", "testing", "unit-testing", "vite", "javascript", "typescript"],
        url: "https://github.com/vitest-dev/vitest"
    },
    {
        name: "pytest",
        type: "Code",
        tech: "Python",
        category: ["Testing", "Unit Testing"],
        description: "pytest is a Python testing framework with readable test functions, fixtures, and useful failure output. It is useful for testing application logic from small units through broader suites without excessive boilerplate.",
        keywords: ["pytest", "python", "testing", "unit-testing", "fixtures", "quality"],
        url: "https://github.com/pytest-dev/pytest"
    },
    {
        name: "Supertest",
        type: "Code",
        tech: "JavaScript",
        category: ["Testing", "API Testing"],
        description: "Supertest sends HTTP-like requests to Node.js servers and checks their responses. It is useful for integration tests that verify routes, status codes, headers, and JSON payloads without requiring a deployed server.",
        keywords: ["supertest", "api-testing", "nodejs", "http", "integration-testing", "rest"],
        url: "https://github.com/ladjs/supertest"
    },
    {
        name: "Postman",
        type: "Code",
        tech: "HTTP/JSON",
        category: ["Testing", "API Testing"],
        description: "Postman is a workspace for sending requests, organizing API collections, and checking responses. It is useful for learning and manually testing REST endpoints before automated tests are written.",
        keywords: ["postman", "api-testing", "rest", "http", "json", "requests"],
        url: "https://github.com/postmanlabs/postman-app-support"
    },
    {
        name: "Sinon",
        type: "Code",
        tech: "JavaScript",
        category: ["Testing", "Mocking"],
        description: "Sinon provides spies, stubs, and fake timers for JavaScript tests. It is useful for isolating a unit from network calls, clocks, or other dependencies and then verifying how those dependencies were used.",
        keywords: ["sinon", "mocking", "stubs", "spies", "testing", "javascript"],
        url: "https://github.com/sinonjs/sinon"
    },
    {
        name: "Docker",
        type: "Code",
        tech: "Container",
        category: ["DevOps & Deployment", "Containers"],
        description: "Docker packages an application and its dependencies into reproducible containers. It is useful for making development, testing, and deployment environments behave consistently across machines.",
        keywords: ["docker", "containers", "devops", "deployment", "images", "infrastructure"],
        url: "https://github.com/docker/docs"
    },
    {
        name: "GitHub Actions",
        type: "Code",
        tech: "YAML",
        category: ["DevOps & Deployment", "CI/CD"],
        description: "GitHub Actions runs automated workflows in response to repository events or schedules. Teams use it to lint, test, build, publish, and deploy software consistently from version control.",
        keywords: ["github-actions", "ci-cd", "automation", "testing", "deployment", "devops"],
        url: "https://github.com/actions/runner"
    },
    {
        name: "dotenv",
        type: "Code",
        tech: "JavaScript",
        category: ["DevOps & Deployment", "Configuration"],
        description: "dotenv loads configuration values from a local .env file into a Node.js process environment. It is useful for keeping environment-specific settings out of source code while developing locally, alongside secure production secret management.",
        keywords: ["dotenv", "configuration", "environment", "nodejs", "secrets", "deployment"],
        url: "https://github.com/motdotla/dotenv"
    },
    {
        name: "PM2",
        type: "Code",
        tech: "Node.js",
        category: ["DevOps & Deployment", "Deployment"],
        description: "PM2 is a process manager for Node.js applications that supports restarts, clustering, logs, and startup configuration. It is useful for keeping a service available on a server and observing its basic runtime state.",
        keywords: ["pm2", "nodejs", "process-manager", "deployment", "production", "monitoring"],
        url: "https://github.com/Unitech/pm2"
    },
    {
        name: "Nodemailer",
        type: "Code",
        tech: "Node.js",
        category: ["Backend & API", "API Utilities"],
        description: "Nodemailer sends email from Node.js through SMTP or supported transports. It is useful for reusable account workflows such as verification messages, password resets, and notifications.",
        keywords: ["nodemailer", "email", "nodejs", "smtp", "notifications", "authentication"],
        url: "https://github.com/nodemailer/nodemailer"
    },
    {
        name: "node-postgres",
        type: "Code",
        tech: "JavaScript",
        category: ["Database & Data", "SQL"],
        description: "node-postgres provides PostgreSQL connections, parameterized queries, and pooling for Node.js. It is useful when an API needs reliable access to PostgreSQL without hiding SQL behind a full ORM.",
        keywords: ["postgresql", "nodejs", "sql", "database", "queries", "pooling"],
        url: "https://github.com/brianc/node-postgres"
    },
    {
        name: "Marshmallow",
        type: "Code",
        tech: "Python",
        category: ["Backend & API", "Validation"],
        description: "Marshmallow serializes Python objects and validates or deserializes external data. It is useful for defining clear JSON boundaries in Python APIs and reporting malformed input to callers.",
        keywords: ["python", "marshmallow", "validation", "serialization", "json", "api"],
        url: "https://github.com/marshmallow-code/marshmallow"
    },
    {
        name: "Pydantic",
        type: "Code",
        tech: "Python",
        category: ["Backend & API", "Validation"],
        description: "Pydantic validates data using Python type hints and produces structured model objects. It is useful for request validation, configuration, and dependable data contracts in Python services.",
        keywords: ["python", "pydantic", "validation", "types", "schema", "api"],
        url: "https://github.com/pydantic/pydantic"
    },
    {
        name: "UML Class Diagram Template",
        type: "Design",
        tech: "UML",
        category: ["Software Design", "UML"],
        description: "A UML class diagram models classes, attributes, operations, and relationships between objects. Developers use it to clarify domain structure and responsibilities before implementing models and services.",
        keywords: ["uml", "class-diagram", "software-design", "object-oriented", "domain-model"],
        url: ""
    },
    {
        name: "UML Sequence Diagram Template",
        type: "Design",
        tech: "UML",
        category: ["Software Design", "UML"],
        description: "A UML sequence diagram shows participants and the messages they exchange over time. It is useful for planning API calls, authentication flows, and service interactions before implementation.",
        keywords: ["uml", "sequence-diagram", "api", "workflow", "software-design"],
        url: ""
    },
    {
        name: "UML Use Case Diagram Template",
        type: "Design",
        tech: "UML",
        category: ["Software Design", "UML"],
        description: "A UML use case diagram connects actors to the goals they accomplish in a system. It helps teams capture user-facing requirements and define the scope of features before choosing implementation details.",
        keywords: ["uml", "use-case", "requirements", "actors", "software-design"],
        url: ""
    },
    {
        name: "UML Activity Diagram Template",
        type: "Design",
        tech: "UML",
        category: ["Software Design", "UML"],
        description: "A UML activity diagram models the steps, decisions, and parallel paths in a business or software process. It is useful for explaining workflows such as checkout, approval, onboarding, and error handling before implementation.",
        keywords: ["uml", "activity-diagram", "workflow", "process", "requirements"],
        url: ""
    },
    {
        name: "UML Component Diagram Template",
        type: "Design",
        tech: "UML",
        category: ["Software Design", "UML"],
        description: "A UML component diagram shows replaceable software components and the interfaces they provide or require. It helps developers reason about service boundaries, dependencies, and integration points in a growing application.",
        keywords: ["uml", "component-diagram", "architecture", "interfaces", "dependencies"],
        url: ""
    },
    {
        name: "UML State Diagram Template",
        type: "Design",
        tech: "UML",
        category: ["Software Design", "UML"],
        description: "A UML state diagram models the lifecycle of an entity and the events that move it between valid states. It is useful for orders, payments, accounts, and other objects whose transitions need explicit business rules and guards.",
        keywords: ["uml", "state-diagram", "workflow", "lifecycle", "transitions"],
        url: "https://mermaid.js.org/syntax/stateDiagram.html"
    },
    {
        name: "Entity Relationship Diagram Template",
        type: "Design",
        tech: "ERD",
        category: ["Software Design", "ERD"],
        description: "An entity relationship diagram represents entities, attributes, and cardinality in a data model. It is useful for planning tables and relationships before writing migrations or database queries.",
        keywords: ["erd", "database", "entity", "relationship", "schema", "sql"],
        url: "https://mermaid.js.org/syntax/entityRelationshipDiagram.html"
    },
    {
        name: "Data Flow Diagram Template",
        type: "Design",
        tech: "DFD",
        category: ["Software Design", "DFD"],
        description: "A data flow diagram shows how information moves between external actors, processes, and data stores. It helps developers and stakeholders understand system boundaries and identify missing or unnecessary data flows.",
        keywords: ["dfd", "data-flow", "processes", "architecture", "requirements"],
        url: ""
    },
    {
        name: "C4 Architecture Example",
        type: "Design",
        tech: "C4",
        category: ["Software Design", "Architecture"],
        description: "A C4 architecture model describes a system at context, container, component, and code levels. It is useful for communicating architecture at the amount of detail appropriate for each audience.",
        keywords: ["c4", "architecture", "system-design", "containers", "components", "documentation"],
        url: "https://c4model.com/"
    },
    {
        name: "Deployment Diagram Template",
        type: "Design",
        tech: "UML",
        category: ["Software Design", "Architecture"],
        description: "A deployment diagram maps software artifacts to servers, devices, containers, and network connections. It helps teams reason about where services run and what infrastructure a release requires.",
        keywords: ["uml", "deployment", "architecture", "infrastructure", "servers"],
        url: ""
    },
    {
        name: "REST API Design Checklist",
        type: "Design",
        tech: "REST/OpenAPI",
        category: ["Software Design", "API Design"],
        description: "A REST API design checklist captures resource naming, HTTP methods, status codes, pagination, errors, and versioning decisions. It gives developers a reusable review aid for making endpoints predictable before coding.",
        keywords: ["rest", "api", "design", "http", "openapi", "endpoints"],
        url: "https://github.com/microsoft/api-guidelines"
    },
    {
        name: "Repository Pattern Template",
        type: "Design",
        tech: "Design Pattern",
        category: ["Software Design", "Design Patterns"],
        description: "The repository pattern separates application logic from persistence operations behind a focused interface. It is useful when a project wants testable services and the ability to change or mock database access cleanly.",
        keywords: ["repository", "design-pattern", "database", "architecture", "testing"],
        url: "https://martinfowler.com/eaaCatalog/repository.html"
    },
    {
        name: "MVC Architecture Template",
        type: "Design",
        tech: "Design Pattern",
        category: ["Software Design", "Design Patterns"],
        description: "The MVC pattern separates a user interface, application controller, and data or domain model. It is useful as a beginner-friendly way to organize web features and keep request handling from absorbing every responsibility.",
        keywords: ["mvc", "design-pattern", "architecture", "web", "separation-of-concerns"],
        url: "https://martinfowler.com/eaaDev/uiArchs.html"
    }
];

const designArtifacts = {
    "UML Class Diagram Template": {
        format: "mermaid",
        content: `classDiagram
    class User {
        +id
        +name
        +email
        +authenticate()
    }
    class Service {
        +processRequest()
    }
    class Repository {
        +save()
        +findById()
    }
    User --> Service
    Service --> Repository`,
        notes: "Use this when documenting domain objects and their responsibilities before implementation. Rename the classes and operations to match the target domain, then add inheritance or multiplicity only where the code needs it.",
        example: "For an order system, replace User with Customer, Service with OrderService, and Repository with OrderRepository. Add Product and OrderLine classes when those relationships matter."
    },
    "UML Sequence Diagram Template": {
        format: "mermaid",
        content: `sequenceDiagram
    actor Client
    participant API
    participant Service
    participant Repository
    participant Database
    Client->>API: Send request
    API->>Service: Validate and handle
    Service->>Repository: Load or save data
    Repository->>Database: Execute query
    Database-->>Repository: Return result
    Repository-->>Service: Return entity
    Service-->>API: Build response
    API-->>Client: Return response`,
        notes: "Use this to explain the time-ordered messages in one operation, especially authentication, checkout, or API workflows. Replace participants and messages with the concrete services in the system.",
        example: "For login, change the request to Submit credentials, add an AuthService and TokenProvider participant, and show both the success and invalid-credentials branches."
    },
    "UML Use Case Diagram Template": {
        format: "mermaid",
        content: `flowchart LR
    User((User))
    Admin((Administrator))
    subgraph System[Application]
        Login([Sign in])
        Browse([Browse catalogue])
        Manage([Manage records])
        Report([View reports])
    end
    User --- Login
    User --- Browse
    Admin --- Manage
    Admin --- Report
    Manage -. includes .-> Login`,
        notes: "Use this during requirements discovery to define actors, goals, and system scope. Keep use cases outcome-oriented and avoid turning implementation details into user goals.",
        example: "Rename the actors and goals for a library, booking, or retail system. Add external actors such as a payment provider when they interact with the system."
    },
    "UML Activity Diagram Template": {
        format: "mermaid",
        content: `flowchart TD
    Start([Start]) --> Input[Receive request]
    Input --> Valid{Valid input?}
    Valid -- Yes --> Process[Process request]
    Valid -- No --> Error[Return validation error]
    Process --> Saved{Saved successfully?}
    Saved -- Yes --> Success[Return success]
    Saved -- No --> Failure[Return failure]
    Error --> End([End])
    Success --> End
    Failure --> End`,
        notes: "Use this for business workflows with decisions, alternate paths, and clear start and end points. Keep each activity a meaningful step a stakeholder can understand.",
        example: "Adapt it for onboarding by replacing Process with Create account and adding an email-verification decision before Success."
    },
    "UML Component Diagram Template": {
        format: "mermaid",
        content: `flowchart LR
    Web[Web Client] --> API[API Gateway]
    API --> Auth[Authentication Service]
    API --> Core[Application Service]
    Core --> Repo[Repository Adapter]
    Repo --> DB[(Database)]
    Core --> Queue[Message Queue]
    Queue --> Worker[Background Worker]`,
        notes: "Use this to show deployable or replaceable software components and their interfaces. Replace the generic services with real boundaries and label important protocols such as HTTPS or AMQP.",
        example: "For a reporting system, replace Worker with Report Worker and Queue with Job Queue, then add an Object Storage component for generated files."
    },
    "UML State Diagram Template": {
        format: "mermaid",
        content: `stateDiagram-v2
    [*] --> Draft
    Draft --> Submitted: submit
    Submitted --> Approved: approve
    Submitted --> Rejected: reject
    Rejected --> Draft: revise
    Approved --> Completed: complete
    Completed --> [*]`,
        notes: "Use this when an entity has a finite lifecycle and transitions must be explicit. Name transitions with events or commands and add guards when a transition depends on a rule.",
        example: "Adapt it for a payment by using Pending, Authorized, Failed, Refunded, and Cancelled states with gateway events as transitions."
    },
    "Entity Relationship Diagram Template": {
        format: "mermaid",
        content: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : appears_in
    CUSTOMER {
        int id PK
        string email UK
    }
    ORDER {
        int id PK
        date created_at
        string status
    }
    ORDER_ITEM {
        int order_id FK
        int product_id FK
        int quantity
    }
    PRODUCT {
        int id PK
        string name
        decimal price
    }`,
        notes: "Use this before creating relational tables or migrations. Review cardinality, primary keys, foreign keys, uniqueness, and optional relationships with the team.",
        example: "Replace the commerce entities with Student, Course, and Enrollment for an education system, retaining the associative entity where a many-to-many relationship exists."
    },
    "Data Flow Diagram Template": {
        format: "mermaid",
        content: `flowchart LR
    User[External User] -->|Request| Process[Application Process]
    Process -->|Read/write| Store[(Data Store)]
    Store -->|Data| Process
    Process -->|Response| User
    Process -->|Notification| External[External Service]
    External -->|Result| Process`,
        notes: "Use this to clarify system boundaries and the movement of information, not internal class structure. Name flows with the data being exchanged and keep stores and external actors distinct.",
        example: "For payments, rename External Service to Payment Provider and label flows with Payment Request, Authorization Result, and Receipt."
    },
    "C4 Architecture Example": {
        format: "mermaid",
        content: `flowchart TB
    User[Person: User] --> System[Software System: Application]
    System --> Web[Container: Web Application]
    System --> API[Container: API]
    API --> DB[(Container: Database)]
    API --> Email[External System: Email Provider]`,
        notes: "Use the C4 levels to communicate architecture at the right zoom level: system context first, then containers and components. Replace the generic names and add only dependencies that help explain the design.",
        example: "Rename Application to the product being designed, split API into bounded services when necessary, and document protocols on the connecting edges."
    },
    "Deployment Diagram Template": {
        format: "mermaid",
        content: `flowchart TB
    User[User Device] --> CDN[CDN / Load Balancer]
    CDN --> App[Application Container]
    App --> DB[(Database Server)]
    App --> Cache[(Cache)]
    App --> Worker[Worker Container]
    Worker --> Queue[(Message Queue)]`,
        notes: "Use this to show where software runs and how infrastructure nodes communicate. Add regions, replicas, ports, and trust boundaries only when they affect deployment or operations.",
        example: "Replace Application Container with the deployed service names and add a second replica or managed database when documenting production topology."
    },
    "REST API Design Checklist": {
        format: "markdown",
        content: `# REST API design template

## Resource
- Name: /resources
- Identifier: /resources/{id}

## Operations
- GET /resources
- POST /resources
- GET /resources/{id}
- PUT/PATCH /resources/{id}
- DELETE /resources/{id}

## Contract
- Validate request bodies and query parameters.
- Return consistent success and error envelopes.
- Define pagination, filtering, authentication, and versioning.
- Document status codes and idempotency.`,
        notes: "Use this before implementing endpoints to agree on nouns, methods, representations, errors, and operational concerns. Keep the public contract stable even if the internal implementation changes.",
        example: "Replace resources with orders or projects, add fields and validation rules, then publish the completed contract as an OpenAPI document."
    },
    "Repository Pattern Template": {
        format: "typescript",
        content: `interface Repository<T> {
    findById(id: string): Promise<T | null>;
    save(entity: T): Promise<T>;
    delete(id: string): Promise<void>;
}

class Service {
    constructor(private repository: Repository<Entity>) {}
    async execute(id: string) {
        return this.repository.findById(id);
    }
}`,
        notes: "Use this when domain or application services should not depend directly on a database driver. Keep persistence details inside an adapter and use an in-memory implementation for focused tests.",
        example: "Replace Entity with Order or User, define only operations the use cases need, and implement the interface with PostgreSQL, SQLite, or an in-memory store."
    },
    "MVC Architecture Template": {
        format: "mermaid",
        content: `flowchart LR
    Request[HTTP Request] --> Controller[Controller]
    Controller --> Model[Model / Service]
    Model --> Database[(Database)]
    Model --> View[View / Serializer]
    View --> Response[HTTP Response]`,
        notes: "Use MVC to separate request coordination, domain or persistence logic, and presentation. Keep controllers thin and place business rules in models or services that can be tested independently.",
        example: "Rename Model to the domain service used by the application and replace View with a JSON serializer for an API or a template renderer for a server-rendered site."
    }
};

const erdVariants = [
    {
        name: "General ER Diagram Template",
        description: "A reusable relational database starting point showing entities, attributes, primary keys, foreign keys, and cardinality.",
        entities: ["Customer", "Order", "OrderItem", "Product"],
        mermaid: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : included_in
    CUSTOMER {
        int customer_id PK
        string email
    }
    ORDER {
        int order_id PK
        int customer_id FK
    }
    ORDER_ITEM {
        int order_item_id PK
        int order_id FK
        int product_id FK
    }
    PRODUCT {
        int product_id PK
        string name
    }`
    },
    {
        name: "E-Commerce ER Diagram",
        description: "Models customers placing orders that contain products, with categories and payment records for an online store.",
        entities: ["Customer", "Order", "OrderItem", "Product", "Category", "Payment"],
        mermaid: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : appears_in
    CATEGORY ||--o{ PRODUCT : groups
    ORDER ||--|| PAYMENT : has
    CUSTOMER {
        int customer_id PK
        string email
    }
    ORDER { int order_id PK
        int customer_id FK
    }
    ORDER_ITEM { int order_item_id PK
        int order_id FK
        int product_id FK
    }
    PRODUCT { int product_id PK
        int category_id FK
        decimal price
    }
    CATEGORY { int category_id PK
        string name
    }
    PAYMENT { int payment_id PK
        int order_id FK
        string status
    }`
    },
    {
        name: "Healthcare ER Diagram",
        description: "Models patients receiving care from doctors through appointments, prescriptions, and medical records.",
        entities: ["Patient", "Doctor", "Appointment", "Prescription", "MedicalRecord"],
        mermaid: `erDiagram
    PATIENT ||--o{ APPOINTMENT : books
    DOCTOR ||--o{ APPOINTMENT : conducts
    PATIENT ||--o{ PRESCRIPTION : receives
    PATIENT ||--o{ MEDICAL_RECORD : has
    PATIENT { int patient_id PK
        string name
    }
    DOCTOR { int doctor_id PK
        string specialty
    }
    APPOINTMENT { int appointment_id PK
        int patient_id FK
        int doctor_id FK
    }
    PRESCRIPTION { int prescription_id PK
        int patient_id FK
    }
    MEDICAL_RECORD { int record_id PK
        int patient_id FK
    }`
    },
    {
        name: "Library Management ER Diagram",
        description: "Models library members borrowing books, with authors and loan records separated so the design supports repeat borrowing.",
        entities: ["Member", "Book", "Author", "Loan"],
        mermaid: `erDiagram
    MEMBER ||--o{ LOAN : makes
    BOOK ||--o{ LOAN : appears_in
    AUTHOR ||--o{ BOOK : writes
    MEMBER { int member_id PK
        string name
    }
    BOOK { int book_id PK
        int author_id FK
        string title
    }
    AUTHOR { int author_id PK
        string name
    }
    LOAN { int loan_id PK
        int member_id FK
        int book_id FK
        date due_date
    }`
    },
    {
        name: "University Management ER Diagram",
        description: "Models students enrolling in courses taught by instructors and organized into academic departments.",
        entities: ["Student", "Course", "Instructor", "Enrollment", "Department"],
        mermaid: `erDiagram
    DEPARTMENT ||--o{ COURSE : offers
    DEPARTMENT ||--o{ INSTRUCTOR : employs
    INSTRUCTOR ||--o{ COURSE : teaches
    STUDENT ||--o{ ENROLLMENT : creates
    COURSE ||--o{ ENROLLMENT : receives
    STUDENT { int student_id PK
        string name
    }
    COURSE { int course_id PK
        int department_id FK
        int instructor_id FK
    }
    INSTRUCTOR { int instructor_id PK
        int department_id FK
    }
    ENROLLMENT { int enrollment_id PK
        int student_id FK
        int course_id FK
    }
    DEPARTMENT { int department_id PK
        string name
    }`
    },
    {
        name: "Banking ER Diagram",
        description: "Models customers holding accounts at branches and recording deposits, withdrawals, and transfers as transactions.",
        entities: ["Customer", "Account", "Transaction", "Branch"],
        mermaid: `erDiagram
    CUSTOMER ||--o{ ACCOUNT : owns
    BRANCH ||--o{ ACCOUNT : services
    ACCOUNT ||--o{ TRANSACTION : records
    CUSTOMER { int customer_id PK
        string name
    }
    ACCOUNT { int account_id PK
        int customer_id FK
        int branch_id FK
        decimal balance
    }
    TRANSACTION { int transaction_id PK
        int account_id FK
        decimal amount
        string type
    }
    BRANCH { int branch_id PK
        string name
    }`
    }
];

const escapeXml = value => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const erdRelationships = {
    "General ER Diagram Template": [
        { from: "CUSTOMER", to: "ORDER", label: "places" },
        { from: "ORDER", to: "ORDER_ITEM", label: "contains" },
        { from: "PRODUCT", to: "ORDER_ITEM", label: "included_in" }
    ],
    "E-Commerce ER Diagram": [
        { from: "CUSTOMER", to: "ORDER", label: "places" },
        { from: "ORDER", to: "ORDER_ITEM", label: "contains" },
        { from: "PRODUCT", to: "ORDER_ITEM", label: "appears_in" },
        { from: "CATEGORY", to: "PRODUCT", label: "groups" },
        { from: "ORDER", to: "PAYMENT", label: "has" }
    ],
    "Healthcare ER Diagram": [
        { from: "PATIENT", to: "APPOINTMENT", label: "books" },
        { from: "DOCTOR", to: "APPOINTMENT", label: "conducts" },
        { from: "PATIENT", to: "PRESCRIPTION", label: "receives" },
        { from: "PATIENT", to: "MEDICAL_RECORD", label: "has" }
    ],
    "Library Management ER Diagram": [
        { from: "MEMBER", to: "LOAN", label: "makes" },
        { from: "BOOK", to: "LOAN", label: "appears_in" },
        { from: "AUTHOR", to: "BOOK", label: "writes" }
    ],
    "University Management ER Diagram": [
        { from: "DEPARTMENT", to: "COURSE", label: "offers" },
        { from: "DEPARTMENT", to: "INSTRUCTOR", label: "employs" },
        { from: "INSTRUCTOR", to: "COURSE", label: "teaches" },
        { from: "STUDENT", to: "ENROLLMENT", label: "creates" },
        { from: "COURSE", to: "ENROLLMENT", label: "receives" }
    ],
    "Banking ER Diagram": [
        { from: "CUSTOMER", to: "ACCOUNT", label: "owns" },
        { from: "BRANCH", to: "ACCOUNT", label: "services" },
        { from: "ACCOUNT", to: "TRANSACTION", label: "records" }
    ]
};

const erdSvg = variant => {
    const labels = variant.entities;
    const rels = erdRelationships[variant.name] || [];

    // Positions map
    const posMap = {};
    labels.forEach((label, index) => {
        const norm = label.toUpperCase().replace(/[^A-Z0-9]/g, "_");
        const x = 40 + (index % 3) * 220;
        const y = 40 + Math.floor(index / 3) * 140;
        posMap[norm] = { x, y, width: 170, height: 64, label };
    });

    let edgeMarkup = "";
    rels.forEach(rel => {
        const fromPos = posMap[rel.from] || Object.values(posMap).find(p => p.label.toUpperCase() === rel.from);
        const toPos = posMap[rel.to] || Object.values(posMap).find(p => p.label.toUpperCase() === rel.to);
        if (fromPos && toPos) {
            const x1 = fromPos.x + fromPos.width / 2;
            const y1 = fromPos.y + fromPos.height / 2;
            const x2 = toPos.x + toPos.width / 2;
            const y2 = toPos.y + toPos.height / 2;
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;
            edgeMarkup += `<g>
                <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#2563eb" stroke-width="1.8" stroke-dasharray="4,2" marker-end="url(#arr-erd)"/>
                <rect x="${mx - 28}" y="${my - 9}" width="56" height="18" rx="3" fill="#ffffff" stroke="#cbd5e1"/>
                <text x="${mx}" y="${my + 4}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#2563eb">${escapeXml(rel.label)}</text>
            </g>`;
        }
    });

    const nodes = labels.map(label => {
        const norm = label.toUpperCase().replace(/[^A-Z0-9]/g, "_");
        const { x, y, width, height } = posMap[norm];
        return `<g>
            <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="6" fill="#ffffff" stroke="#315fdb" stroke-width="1.5"/>
            <rect x="${x}" y="${y}" width="${width}" height="24" rx="6" fill="#315fdb"/>
            <text x="${x + width / 2}" y="${y + 16}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#ffffff">${escapeXml(label)}</text>
            <text x="${x + 10}" y="${y + 44}" font-family="monospace" font-size="11" fill="#475569">id : int [PK]</text>
        </g>`;
    }).join("");

    return `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="340" viewBox="0 0 700 340">
        <title>${escapeXml(variant.name)}</title>
        <defs>
            <marker id="arr-erd" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563eb"/>
            </marker>
        </defs>
        ${edgeMarkup}
        ${nodes}
    </svg>`;
};

const erdDrawio = variant => {
    const labels = variant.entities;
    const rels = erdRelationships[variant.name] || [];

    const nodeCells = labels.map((label, index) => {
        const norm = label.toUpperCase().replace(/[^A-Z0-9]/g, "_");
        const x = 40 + (index % 3) * 220;
        const y = 40 + Math.floor(index / 3) * 140;
        return `<mxCell id="node-${norm}" value="${escapeXml(label)}&#xa;id: int [PK]" style="swimlane;fontStyle=1;childLayout=stackLayout;horizontal=1;startSize=26;fillColor=#eef3ff;strokeColor=#315fdb;rounded=1;" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="160" height="70" as="geometry"/></mxCell>`;
    }).join("");

    const edgeCells = rels.map((rel, index) => {
        return `<mxCell id="edge-${index + 1}" value="${escapeXml(rel.label)}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#315fdb;" edge="1" source="node-${rel.from}" target="node-${rel.to}" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell>`;
    }).join("");

    return `<mxfile host="ComponentHub"><diagram name="${escapeXml(variant.name)}"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>${nodeCells}${edgeCells}</root></mxGraphModel></diagram></mxfile>`;
};

const seedErdArtifacts = (db, componentId) => {
    const insertArtifact = db.prepare(`
        INSERT INTO component_artifacts(
            component_id, name, description, variant_type, delivery_method,
            artifact_format, content, download_filename, reuse_method,
            is_primary, sort_order
        ) VALUES(?,?,?,?,?,?,?,?,?,?,?)
    `);
    erdVariants.forEach((variant, variantIndex) => {
        const slug = variant.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const files = [
            [variant.name, "mermaid", variant.mermaid, `${slug}.mmd`, "Editable Source", "Copy and edit"],
            [variant.name, "svg", erdSvg(variant), `${slug}.svg`, "Downloadable File", "Download and edit"],
            [variant.name, "drawio", erdDrawio(variant), `${slug}.drawio`, "Editable Source", "Import into Draw.io"]
        ];
        files.forEach(([name, format, content, filename, delivery, reuse], formatIndex) => {
            insertArtifact.run(
                componentId,
                name,
                `${variant.description} This ${format} version is ready to reuse.`,
                variantIndex === 0
                    ? "General Template"
                    : variant.name
                        .replace(/ ER Diagram$/, "")
                        .replace(/ Management$/, "") + " Example",
                delivery,
                format,
                content,
                filename,
                reuse,
                variantIndex === 0 && formatIndex === 0 ? 1 : 0,
                variantIndex * 10 + formatIndex
            );
        });
    });
};

const getDesignArtifactFiles = (name, artifact) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const mmdContent = artifact.content;

    switch (name) {
        case "UML Class Diagram Template": {
            const puml = `@startuml
class User {
    +id: string
    +name: string
    +email: string
    +authenticate(): boolean
}
class Service {
    +processRequest(): void
}
class Repository {
    +save(entity): void
    +findById(id): entity
}
User --> Service : uses
Service --> Repository : calls
@enduml`;
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="220" viewBox="0 0 700 220"><title>UML Class Diagram Template</title><defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#315fdb"/></marker></defs><g><rect x="40" y="30" width="160" height="130" rx="6" fill="#eef3ff" stroke="#315fdb" stroke-width="1.5"/><rect x="40" y="30" width="160" height="30" rx="6" fill="#315fdb"/><text x="120" y="50" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff">User</text><text x="52" y="80" font-family="monospace" font-size="12" fill="#1e293b">+ id</text><text x="52" y="100" font-family="monospace" font-size="12" fill="#1e293b">+ name</text><text x="52" y="120" font-family="monospace" font-size="12" fill="#1e293b">+ email</text><text x="52" y="140" font-family="monospace" font-size="12" fill="#1e293b">+ authenticate()</text></g><g><rect x="270" y="30" width="160" height="100" rx="6" fill="#eef3ff" stroke="#315fdb" stroke-width="1.5"/><rect x="270" y="30" width="160" height="30" rx="6" fill="#315fdb"/><text x="350" y="50" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff">Service</text><text x="282" y="80" font-family="monospace" font-size="12" fill="#1e293b">+ processRequest()</text></g><g><rect x="500" y="30" width="160" height="110" rx="6" fill="#eef3ff" stroke="#315fdb" stroke-width="1.5"/><rect x="500" y="30" width="160" height="30" rx="6" fill="#315fdb"/><text x="580" y="50" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff">Repository</text><text x="512" y="80" font-family="monospace" font-size="12" fill="#1e293b">+ save()</text><text x="512" y="100" font-family="monospace" font-size="12" fill="#1e293b">+ findById()</text></g><line x1="200" y1="75" x2="270" y2="75" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr)"/><text x="235" y="70" text-anchor="middle" font-family="Arial" font-size="11" fill="#475569">uses</text><line x1="430" y1="75" x2="500" y2="75" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr)"/><text x="465" y="70" text-anchor="middle" font-family="Arial" font-size="11" fill="#475569">calls</text></svg>`;
            const drawio = `<mxfile host="ComponentHub"><diagram name="UML Class Diagram"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="node-1" value="User&#xa;+ id&#xa;+ name&#xa;+ email&#xa;+ authenticate()" style="swimlane;fontStyle=0;childLayout=stackLayout;horizontal=1;startSize=26;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="160" height="110" as="geometry"/></mxCell><mxCell id="node-2" value="Service&#xa;+ processRequest()" style="swimlane;fontStyle=0;childLayout=stackLayout;horizontal=1;startSize=26;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="260" y="40" width="160" height="90" as="geometry"/></mxCell><mxCell id="node-3" value="Repository&#xa;+ save()&#xa;+ findById()" style="swimlane;fontStyle=0;childLayout=stackLayout;horizontal=1;startSize=26;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="480" y="40" width="160" height="90" as="geometry"/></mxCell><mxCell id="edge-1" value="uses" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#315fdb;" edge="1" source="node-1" target="node-2" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell><mxCell id="edge-2" value="calls" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#315fdb;" edge="1" source="node-2" target="node-3" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell></root></mxGraphModel></diagram></mxfile>`;
            return [
                [name, "mermaid", mmdContent, `${slug}.mmd`, "Editable Source", "Copy and edit"],
                [name, "svg", svg, `${slug}.svg`, "Downloadable File", "Download and preview"],
                [name, "drawio", drawio, `${slug}.drawio`, "Editable Source", "Import into Draw.io"],
                [name, "plantuml", puml, `${slug}.puml`, "Editable Source", "Render with PlantUML"]
            ];
        }
        case "UML Sequence Diagram Template": {
            const puml = `@startuml
actor Client
participant API
participant Service
participant Repository
database Database
Client -> API : Send request
API -> Service : Validate and handle
Service -> Repository : Load or save data
Repository -> Database : Execute query
Database --> Repository : Return result
Repository --> Service : Return entity
Service --> API : Build response
API --> Client : Return response
@enduml`;
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="280" viewBox="0 0 700 280"><title>UML Sequence Diagram Template</title><defs><marker id="arr2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#315fdb"/></marker></defs><g><rect x="30" y="20" width="100" height="40" rx="6" fill="#eef3ff" stroke="#315fdb"/><text x="80" y="45" text-anchor="middle" font-family="Arial" font-size="13">Client</text><line x1="80" y1="60" x2="80" y2="250" stroke="#94a3b8" stroke-dasharray="4,4"/></g><g><rect x="160" y="20" width="100" height="40" rx="6" fill="#eef3ff" stroke="#315fdb"/><text x="210" y="45" text-anchor="middle" font-family="Arial" font-size="13">API</text><line x1="210" y1="60" x2="210" y2="250" stroke="#94a3b8" stroke-dasharray="4,4"/></g><g><rect x="290" y="20" width="100" height="40" rx="6" fill="#eef3ff" stroke="#315fdb"/><text x="340" y="45" text-anchor="middle" font-family="Arial" font-size="13">Service</text><line x1="340" y1="60" x2="340" y2="250" stroke="#94a3b8" stroke-dasharray="4,4"/></g><g><rect x="420" y="20" width="110" height="40" rx="6" fill="#eef3ff" stroke="#315fdb"/><text x="475" y="45" text-anchor="middle" font-family="Arial" font-size="13">Repository</text><line x1="475" y1="60" x2="475" y2="250" stroke="#94a3b8" stroke-dasharray="4,4"/></g><g><rect x="560" y="20" width="100" height="40" rx="6" fill="#eef3ff" stroke="#315fdb"/><text x="610" y="45" text-anchor="middle" font-family="Arial" font-size="13">Database</text><line x1="610" y1="60" x2="610" y2="250" stroke="#94a3b8" stroke-dasharray="4,4"/></g><line x1="80" y1="90" x2="210" y2="90" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr2)"/><text x="145" y="84" text-anchor="middle" font-family="Arial" font-size="11" fill="#475569">Request</text><line x1="210" y1="120" x2="340" y2="120" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr2)"/><text x="275" y="114" text-anchor="middle" font-family="Arial" font-size="11" fill="#475569">Validate</text><line x1="340" y1="150" x2="475" y2="150" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr2)"/><text x="407" y="144" text-anchor="middle" font-family="Arial" font-size="11" fill="#475569">Query</text><line x1="475" y1="180" x2="610" y2="180" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr2)"/><text x="542" y="174" text-anchor="middle" font-family="Arial" font-size="11" fill="#475569">Execute</text></svg>`;
            const drawio = `<mxfile host="ComponentHub"><diagram name="UML Sequence Diagram"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="p1" value="Client" style="shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="100" height="200" as="geometry"/></mxCell><mxCell id="p2" value="API" style="shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="180" y="40" width="100" height="200" as="geometry"/></mxCell><mxCell id="p3" value="Service" style="shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="320" y="40" width="100" height="200" as="geometry"/></mxCell><mxCell id="p4" value="Repository" style="shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="460" y="40" width="100" height="200" as="geometry"/></mxCell><mxCell id="p5" value="Database" style="shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="580" y="40" width="100" height="200" as="geometry"/></mxCell><mxCell id="msg1" value="Request" style="html=1;verticalAlign=bottom;endArrow=block;edgeStyle=elbowEdgeStyle;elbow=vertical;curved=0;rounded=0;strokeColor=#315fdb;" edge="1" parent="1" source="p1" target="p2"><mxGeometry relative="1" as="geometry"><mxPoint y="80" as="offset"/></mxGeometry></mxCell><mxCell id="msg2" value="Validate" style="html=1;verticalAlign=bottom;endArrow=block;edgeStyle=elbowEdgeStyle;elbow=vertical;curved=0;rounded=0;strokeColor=#315fdb;" edge="1" parent="1" source="p2" target="p3"><mxGeometry relative="1" as="geometry"><mxPoint y="110" as="offset"/></mxGeometry></mxCell><mxCell id="msg3" value="Query" style="html=1;verticalAlign=bottom;endArrow=block;edgeStyle=elbowEdgeStyle;elbow=vertical;curved=0;rounded=0;strokeColor=#315fdb;" edge="1" parent="1" source="p3" target="p4"><mxGeometry relative="1" as="geometry"><mxPoint y="140" as="offset"/></mxGeometry></mxCell><mxCell id="msg4" value="Execute" style="html=1;verticalAlign=bottom;endArrow=block;edgeStyle=elbowEdgeStyle;elbow=vertical;curved=0;rounded=0;strokeColor=#315fdb;" edge="1" parent="1" source="p4" target="p5"><mxGeometry relative="1" as="geometry"><mxPoint y="170" as="offset"/></mxGeometry></mxCell></root></mxGraphModel></diagram></mxfile>`;
            return [
                [name, "mermaid", mmdContent, `${slug}.mmd`, "Editable Source", "Copy and edit"],
                [name, "svg", svg, `${slug}.svg`, "Downloadable File", "Download and preview"],
                [name, "drawio", drawio, `${slug}.drawio`, "Editable Source", "Import into Draw.io"],
                [name, "plantuml", puml, `${slug}.puml`, "Editable Source", "Render with PlantUML"]
            ];
        }
        case "UML Use Case Diagram Template": {
            const puml = `@startuml
left to right direction
actor User
actor Admin
rectangle Application {
    usecase "Sign in" as UC1
    usecase "Browse catalogue" as UC2
    usecase "Manage records" as UC3
    usecase "View reports" as UC4
}
User --> UC1
User --> UC2
Admin --> UC3
Admin --> UC4
UC3 .> UC1 : <<includes>>
@enduml`;
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="260" viewBox="0 0 700 260"><title>UML Use Case Diagram Template</title><defs><marker id="arr-uc" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#315fdb"/></marker></defs><rect x="180" y="20" width="340" height="220" rx="8" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/><text x="350" y="44" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="#334155">Application System</text><g><ellipse cx="60" cy="90" rx="25" ry="25" fill="#eef3ff" stroke="#315fdb"/><text x="60" y="135" text-anchor="middle" font-family="Arial" font-size="13">User</text></g><g><ellipse cx="60" cy="190" rx="25" ry="25" fill="#eef3ff" stroke="#315fdb"/><text x="60" y="235" text-anchor="middle" font-family="Arial" font-size="13">Administrator</text></g><g><rect x="220" y="60" width="130" height="40" rx="20" fill="#eef3ff" stroke="#315fdb"/><text x="285" y="85" text-anchor="middle" font-family="Arial" font-size="12">Sign in</text></g><g><rect x="220" y="115" width="130" height="40" rx="20" fill="#eef3ff" stroke="#315fdb"/><text x="285" y="140" text-anchor="middle" font-family="Arial" font-size="12">Browse catalogue</text></g><g><rect x="370" y="115" width="130" height="40" rx="20" fill="#eef3ff" stroke="#315fdb"/><text x="435" y="140" text-anchor="middle" font-family="Arial" font-size="12">Manage records</text></g><g><rect x="370" y="170" width="130" height="40" rx="20" fill="#eef3ff" stroke="#315fdb"/><text x="435" y="195" text-anchor="middle" font-family="Arial" font-size="12">View reports</text></g><line x1="85" y1="90" x2="220" y2="80" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr-uc)"/><line x1="85" y1="90" x2="220" y2="135" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr-uc)"/><line x1="85" y1="190" x2="370" y2="135" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr-uc)"/><line x1="85" y1="190" x2="370" y2="190" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr-uc)"/><line x1="370" y1="135" x2="350" y2="85" stroke="#315fdb" stroke-width="1.5" stroke-dasharray="4,3" marker-end="url(#arr-uc)"/></svg>`;
            const drawio = `<mxfile host="ComponentHub"><diagram name="UML Use Case Diagram"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="box" value="Application System" style="shape=folder;fontStyle=1;tabWidth=140;tabHeight=30;tabPosition=left;html=1;boundedLbl=1;fillColor=#f8fafc;strokeColor=#94a3b8;" vertex="1" parent="1"><mxGeometry x="180" y="30" width="360" height="230" as="geometry"/></mxCell><mxCell id="act1" value="User" style="shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="40" y="70" width="30" height="60" as="geometry"/></mxCell><mxCell id="act2" value="Administrator" style="shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="40" y="170" width="30" height="60" as="geometry"/></mxCell><mxCell id="uc1" value="Sign in" style="ellipse;whiteSpace=wrap;html=1;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="220" y="60" width="120" height="45" as="geometry"/></mxCell><mxCell id="uc2" value="Browse catalogue" style="ellipse;whiteSpace=wrap;html=1;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="220" y="130" width="120" height="45" as="geometry"/></mxCell><mxCell id="uc3" value="Manage records" style="ellipse;whiteSpace=wrap;html=1;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="380" y="130" width="120" height="45" as="geometry"/></mxCell><mxCell id="uc4" value="View reports" style="ellipse;whiteSpace=wrap;html=1;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="380" y="190" width="120" height="45" as="geometry"/></mxCell><mxCell id="edge-1" value="" style="endArrow=block;html=1;strokeColor=#315fdb;" edge="1" source="act1" target="uc1" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell><mxCell id="edge-2" value="" style="endArrow=block;html=1;strokeColor=#315fdb;" edge="1" source="act1" target="uc2" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell><mxCell id="edge-3" value="" style="endArrow=block;html=1;strokeColor=#315fdb;" edge="1" source="act2" target="uc3" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell><mxCell id="edge-4" value="" style="endArrow=block;html=1;strokeColor=#315fdb;" edge="1" source="act2" target="uc4" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell><mxCell id="edge-5" value="&amp;lt;&amp;lt;includes&amp;gt;&amp;gt;" style="endArrow=open;dashed=1;html=1;strokeColor=#315fdb;" edge="1" source="uc3" target="uc1" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell></root></mxGraphModel></diagram></mxfile>`;
            return [
                [name, "mermaid", mmdContent, `${slug}.mmd`, "Editable Source", "Copy and edit"],
                [name, "svg", svg, `${slug}.svg`, "Downloadable File", "Download and preview"],
                [name, "drawio", drawio, `${slug}.drawio`, "Editable Source", "Import into Draw.io"],
                [name, "plantuml", puml, `${slug}.puml`, "Editable Source", "Render with PlantUML"]
            ];
        }
        case "UML Activity Diagram Template": {
            const puml = `@startuml
start
:Receive request;
if (Valid input?) then (yes)
    :Process request;
    if (Saved successfully?) then (yes)
        :Return success;
    else (no)
        :Return failure;
    endif
else (no)
    :Return validation error;
endif
stop
@enduml`;
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="280" viewBox="0 0 700 280"><title>UML Activity Diagram Template</title><defs><marker id="arr3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#315fdb"/></marker></defs><circle cx="60" cy="140" r="14" fill="#315fdb"/><rect x="110" y="115" width="120" height="50" rx="10" fill="#eef3ff" stroke="#315fdb"/><text x="170" y="145" text-anchor="middle" font-family="Arial" font-size="12">Receive request</text><polygon points="280,140 310,115 340,140 310,165" fill="#fef3c7" stroke="#d97706"/><text x="310" y="144" text-anchor="middle" font-family="Arial" font-size="10">Valid?</text><rect x="380" y="115" width="120" height="50" rx="10" fill="#eef3ff" stroke="#315fdb"/><text x="440" y="145" text-anchor="middle" font-family="Arial" font-size="12">Process request</text><rect x="540" y="115" width="100" height="50" rx="10" fill="#dcfce7" stroke="#16a34a"/><text x="590" y="145" text-anchor="middle" font-family="Arial" font-size="12">Success</text><line x1="74" y1="140" x2="110" y2="140" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr3)"/><line x1="230" y1="140" x2="280" y2="140" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr3)"/><line x1="340" y1="140" x2="380" y2="140" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr3)"/><text x="360" y="132" font-family="Arial" font-size="10" fill="#16a34a">yes</text><line x1="500" y1="140" x2="540" y2="140" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr3)"/></svg>`;
            const drawio = `<mxfile host="ComponentHub"><diagram name="UML Activity Diagram"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="start" value="" style="ellipse;fillColor=#315fdb;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="40" y="100" width="30" height="30" as="geometry"/></mxCell><mxCell id="act1" value="Receive request" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="110" y="90" width="120" height="50" as="geometry"/></mxCell><mxCell id="dec" value="Valid input?" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fef3c7;strokeColor=#d97706;" vertex="1" parent="1"><mxGeometry x="270" y="85" width="80" height="60" as="geometry"/></mxCell><mxCell id="act2" value="Process request" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="390" y="90" width="120" height="50" as="geometry"/></mxCell><mxCell id="succ" value="Success" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dcfce7;strokeColor=#16a34a;" vertex="1" parent="1"><mxGeometry x="550" y="90" width="100" height="50" as="geometry"/></mxCell><mxCell id="e1" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=#315fdb;" edge="1" source="start" target="act1" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell><mxCell id="e2" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=#315fdb;" edge="1" source="act1" target="dec" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell><mxCell id="e3" value="yes" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=#315fdb;" edge="1" source="dec" target="act2" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell><mxCell id="e4" value="yes" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=#315fdb;" edge="1" source="act2" target="succ" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell></root></mxGraphModel></diagram></mxfile>`;
            return [
                [name, "mermaid", mmdContent, `${slug}.mmd`, "Editable Source", "Copy and edit"],
                [name, "svg", svg, `${slug}.svg`, "Downloadable File", "Download and preview"],
                [name, "drawio", drawio, `${slug}.drawio`, "Editable Source", "Import into Draw.io"],
                [name, "plantuml", puml, `${slug}.puml`, "Editable Source", "Render with PlantUML"]
            ];
        }
        case "UML Component Diagram Template": {
            const puml = `@startuml
package "Client Tier" {
    [Web Client]
}
package "API Tier" {
    [API Gateway]
    [Authentication Service]
    [Application Service]
}
package "Data Tier" {
    [Repository Adapter]
    database "Database"
}
[Web Client] --> [API Gateway]
[API Gateway] --> [Authentication Service]
[API Gateway] --> [Application Service]
[Application Service] --> [Repository Adapter]
[Repository Adapter] --> [Database]
@enduml`;
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="240" viewBox="0 0 700 240"><title>UML Component Diagram Template</title><defs><marker id="arr4" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#315fdb"/></marker></defs><g><rect x="30" y="40" width="120" height="60" rx="4" fill="#eef3ff" stroke="#315fdb"/><text x="90" y="75" text-anchor="middle" font-family="Arial" font-size="12">Web Client</text></g><g><rect x="190" y="40" width="120" height="60" rx="4" fill="#eef3ff" stroke="#315fdb"/><text x="250" y="75" text-anchor="middle" font-family="Arial" font-size="12">API Gateway</text></g><g><rect x="350" y="40" width="140" height="60" rx="4" fill="#eef3ff" stroke="#315fdb"/><text x="420" y="75" text-anchor="middle" font-family="Arial" font-size="12">App Service</text></g><g><rect x="530" y="40" width="140" height="60" rx="4" fill="#eef3ff" stroke="#315fdb"/><text x="600" y="75" text-anchor="middle" font-family="Arial" font-size="12">Repository</text></g><line x1="150" y1="70" x2="190" y2="70" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr4)"/><line x1="310" y1="70" x2="350" y2="70" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr4)"/><line x1="490" y1="70" x2="530" y2="70" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr4)"/></svg>`;
            const drawio = `<mxfile host="ComponentHub"><diagram name="UML Component Diagram"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="c1" value="«component»&#xa;Web Client" style="shape=module;jettyWidth=8;jettyHeight=4;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="120" height="60" as="geometry"/></mxCell><mxCell id="c2" value="«component»&#xa;API Gateway" style="shape=module;jettyWidth=8;jettyHeight=4;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="200" y="40" width="120" height="60" as="geometry"/></mxCell><mxCell id="c3" value="«component»&#xa;App Service" style="shape=module;jettyWidth=8;jettyHeight=4;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="360" y="40" width="130" height="60" as="geometry"/></mxCell><mxCell id="c4" value="«component»&#xa;Repository" style="shape=module;jettyWidth=8;jettyHeight=4;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="530" y="40" width="130" height="60" as="geometry"/></mxCell><mxCell id="e1" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=#315fdb;" edge="1" source="c1" target="c2" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell><mxCell id="e2" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=#315fdb;" edge="1" source="c2" target="c3" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell><mxCell id="e3" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=#315fdb;" edge="1" source="c3" target="c4" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell></root></mxGraphModel></diagram></mxfile>`;
            return [
                [name, "mermaid", mmdContent, `${slug}.mmd`, "Editable Source", "Copy and edit"],
                [name, "svg", svg, `${slug}.svg`, "Downloadable File", "Download and preview"],
                [name, "drawio", drawio, `${slug}.drawio`, "Editable Source", "Import into Draw.io"],
                [name, "plantuml", puml, `${slug}.puml`, "Editable Source", "Render with PlantUML"]
            ];
        }
        case "UML State Diagram Template": {
            const puml = `@startuml
[*] --> Draft
Draft --> Submitted : submit
Submitted --> Approved : approve
Submitted --> Rejected : reject
Rejected --> Draft : revise
Approved --> Completed : complete
Completed --> [*]
@enduml`;
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="200" viewBox="0 0 700 200"><title>UML State Diagram Template</title><defs><marker id="arr5" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#315fdb"/></marker></defs><circle cx="50" cy="100" r="12" fill="#315fdb"/><g><rect x="90" y="75" width="100" height="50" rx="12" fill="#eef3ff" stroke="#315fdb"/><text x="140" y="105" text-anchor="middle" font-family="Arial" font-size="12">Draft</text></g><g><rect x="240" y="75" width="110" height="50" rx="12" fill="#eef3ff" stroke="#315fdb"/><text x="295" y="105" text-anchor="middle" font-family="Arial" font-size="12">Submitted</text></g><g><rect x="400" y="75" width="110" height="50" rx="12" fill="#eef3ff" stroke="#315fdb"/><text x="455" y="105" text-anchor="middle" font-family="Arial" font-size="12">Approved</text></g><g><rect x="560" y="75" width="110" height="50" rx="12" fill="#dcfce7" stroke="#16a34a"/><text x="615" y="105" text-anchor="middle" font-family="Arial" font-size="12">Completed</text></g><line x1="62" y1="100" x2="90" y2="100" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr5)"/><line x1="190" y1="100" x2="240" y2="100" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr5)"/><text x="215" y="94" text-anchor="middle" font-family="Arial" font-size="10" fill="#475569">submit</text><line x1="350" y1="100" x2="400" y2="100" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr5)"/><text x="375" y="94" text-anchor="middle" font-family="Arial" font-size="10" fill="#475569">approve</text><line x1="510" y1="100" x2="560" y2="100" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr5)"/><text x="535" y="94" text-anchor="middle" font-family="Arial" font-size="10" fill="#475569">complete</text></svg>`;
            const drawio = `<mxfile host="ComponentHub"><diagram name="UML State Diagram"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="s0" value="" style="ellipse;fillColor=#315fdb;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="40" y="60" width="25" height="25" as="geometry"/></mxCell><mxCell id="s1" value="Draft" style="rounded=1;arcSize=40;whiteSpace=wrap;html=1;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="100" y="50" width="100" height="45" as="geometry"/></mxCell><mxCell id="s2" value="Submitted" style="rounded=1;arcSize=40;whiteSpace=wrap;html=1;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="250" y="50" width="100" height="45" as="geometry"/></mxCell><mxCell id="s3" value="Approved" style="rounded=1;arcSize=40;whiteSpace=wrap;html=1;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="400" y="50" width="100" height="45" as="geometry"/></mxCell><mxCell id="s4" value="Completed" style="rounded=1;arcSize=40;whiteSpace=wrap;html=1;fillColor=#dcfce7;strokeColor=#16a34a;" vertex="1" parent="1"><mxGeometry x="550" y="50" width="100" height="45" as="geometry"/></mxCell><mxCell id="e1" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=#315fdb;" edge="1" source="s0" target="s1" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell><mxCell id="e2" value="submit" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=#315fdb;" edge="1" source="s1" target="s2" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell><mxCell id="e3" value="approve" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=#315fdb;" edge="1" source="s2" target="s3" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell><mxCell id="e4" value="complete" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=#315fdb;" edge="1" source="s3" target="s4" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell></root></mxGraphModel></diagram></mxfile>`;
            return [
                [name, "mermaid", mmdContent, `${slug}.mmd`, "Editable Source", "Copy and edit"],
                [name, "svg", svg, `${slug}.svg`, "Downloadable File", "Download and preview"],
                [name, "drawio", drawio, `${slug}.drawio`, "Editable Source", "Import into Draw.io"],
                [name, "plantuml", puml, `${slug}.puml`, "Editable Source", "Render with PlantUML"]
            ];
        }
        case "Data Flow Diagram Template": {
            const puml = `@startuml
actor "External User" as User
rectangle "Application Process" as Process
database "Data Store" as Store
rectangle "External Service" as External
User -> Process : User Request
Process -> Store : Read / Write
Store -> Process : Query Data
Process -> User : Response
Process -> External : Notification
External -> Process : Result
@enduml`;
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="240" viewBox="0 0 700 240"><title>Data Flow Diagram Template</title><defs><marker id="arr6" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#315fdb"/></marker></defs><g><rect x="30" y="90" width="130" height="55" rx="4" fill="#eef3ff" stroke="#315fdb"/><text x="95" y="122" text-anchor="middle" font-family="Arial" font-size="12">External User</text></g><g><circle cx="300" cy="117" r="45" fill="#f8fafc" stroke="#315fdb" stroke-width="2"/><text x="300" y="115" text-anchor="middle" font-family="Arial" font-size="12">Application</text><text x="300" y="130" text-anchor="middle" font-family="Arial" font-size="12">Process</text></g><g><line x1="450" y1="95" x2="570" y2="95" stroke="#315fdb" stroke-width="2"/><line x1="450" y1="140" x2="570" y2="140" stroke="#315fdb" stroke-width="2"/><text x="510" y="122" text-anchor="middle" font-family="Arial" font-size="12">Data Store</text></g><line x1="160" y1="117" x2="255" y2="117" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr6)"/><text x="207" y="110" text-anchor="middle" font-family="Arial" font-size="10" fill="#475569">Request</text><line x1="345" y1="117" x2="450" y2="117" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr6)"/><text x="397" y="110" text-anchor="middle" font-family="Arial" font-size="10" fill="#475569">Read/Write</text></svg>`;
            const drawio = `<mxfile host="ComponentHub"><diagram name="Data Flow Diagram"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="u" value="External User" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="40" y="80" width="120" height="60" as="geometry"/></mxCell><mxCell id="p" value="1.0&#xa;Application Process" style="ellipse;whiteSpace=wrap;html=1;fillColor=#f8fafc;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="230" y="65" width="110" height="90" as="geometry"/></mxCell><mxCell id="ds" value="D1: Data Store" style="shape=partialRectangle;top=0;bottom=0;fillColor=none;strokeColor=#315fdb;fontStyle=1;" vertex="1" parent="1"><mxGeometry x="420" y="80" width="120" height="60" as="geometry"/></mxCell><mxCell id="ext" value="External Service" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="225" y="200" width="120" height="50" as="geometry"/></mxCell><mxCell id="e1" value="Request" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=#315fdb;" edge="1" source="u" target="p" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell><mxCell id="e2" value="Read / Write" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=#315fdb;" edge="1" source="p" target="ds" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell><mxCell id="e3" value="Notification" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=#315fdb;" edge="1" source="p" target="ext" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell></root></mxGraphModel></diagram></mxfile>`;
            return [
                [name, "mermaid", mmdContent, `${slug}.mmd`, "Editable Source", "Copy and edit"],
                [name, "svg", svg, `${slug}.svg`, "Downloadable File", "Download and preview"],
                [name, "drawio", drawio, `${slug}.drawio`, "Editable Source", "Import into Draw.io"],
                [name, "plantuml", puml, `${slug}.puml`, "Editable Source", "Render with PlantUML"]
            ];
        }
        case "C4 Architecture Example": {
            const puml = `@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml
Person(user, "User", "Application user")
System_Boundary(c1, "Application System") {
    Container(web, "Web Application", "React/HTML", "Delivers front-end UI")
    Container(api, "API Service", "Node/Express", "Provides business logic")
    ContainerDb(db, "Database", "SQLite/PostgreSQL", "Stores component data")
}
System_Ext(email, "Email Service", "Resend API")
Rel(user, web, "Uses", "HTTPS")
Rel(web, api, "Calls", "JSON/HTTPS")
Rel(api, db, "Reads & writes", "SQL")
Rel(api, email, "Sends emails", "HTTPS/REST")
@enduml`;
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="260" viewBox="0 0 700 260"><title>C4 Architecture Example</title><defs><marker id="arr-c4" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#2563eb"/></marker></defs><rect x="160" y="20" width="370" height="220" rx="8" fill="#f8fafc" stroke="#94a3b8" stroke-dasharray="4,4"/><text x="175" y="44" font-family="Arial" font-size="13" font-weight="bold" fill="#64748b">Application System Boundary</text><g><rect x="20" y="90" width="110" height="65" rx="6" fill="#0b1f3a"/><text x="75" y="122" text-anchor="middle" font-family="Arial" font-size="12" fill="#fff">User</text><text x="75" y="138" text-anchor="middle" font-family="Arial" font-size="10" fill="#94a3b8">[Person]</text></g><g><rect x="190" y="80" width="130" height="75" rx="6" fill="#2563eb"/><text x="255" y="112" text-anchor="middle" font-family="Arial" font-size="12" fill="#fff">Web Application</text><text x="255" y="128" text-anchor="middle" font-family="Arial" font-size="10" fill="#cbd5e1">[Container: React]</text></g><g><rect x="370" y="80" width="130" height="75" rx="6" fill="#2563eb"/><text x="435" y="112" text-anchor="middle" font-family="Arial" font-size="12" fill="#fff">API Application</text><text x="435" y="128" text-anchor="middle" font-family="Arial" font-size="10" fill="#cbd5e1">[Container: Express]</text></g><line x1="130" y1="122" x2="190" y2="117" stroke="#2563eb" stroke-width="1.5" marker-end="url(#arr-c4)"/><line x1="320" y1="117" x2="370" y2="117" stroke="#2563eb" stroke-width="1.5" marker-end="url(#arr-c4)"/></svg>`;
            const drawio = `<mxfile host="ComponentHub"><diagram name="C4 Architecture"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="boundary" value="System Boundary" style="shape=rect;fillColor=none;strokeColor=#94a3b8;dashed=1;" vertex="1" parent="1"><mxGeometry x="160" y="40" width="360" height="200" as="geometry"/></mxCell><mxCell id="u" value="User&#xa;[Person]" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0b1f3a;strokeColor=#0b1f3a;fontColor=#ffffff;" vertex="1" parent="1"><mxGeometry x="30" y="90" width="100" height="60" as="geometry"/></mxCell><mxCell id="web" value="Web App&#xa;[Container: React]" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#2563eb;strokeColor=#2563eb;fontColor=#ffffff;" vertex="1" parent="1"><mxGeometry x="190" y="90" width="120" height="60" as="geometry"/></mxCell><mxCell id="api" value="API Service&#xa;[Container: Express]" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#2563eb;strokeColor=#2563eb;fontColor=#ffffff;" vertex="1" parent="1"><mxGeometry x="360" y="90" width="130" height="60" as="geometry"/></mxCell><mxCell id="e1" value="Uses" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=#2563eb;" edge="1" source="u" target="web" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell><mxCell id="e2" value="Calls" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=#2563eb;" edge="1" source="web" target="api" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell></root></mxGraphModel></diagram></mxfile>`;
            return [
                [name, "mermaid", mmdContent, `${slug}.mmd`, "Editable Source", "Copy and edit"],
                [name, "svg", svg, `${slug}.svg`, "Downloadable File", "Download and preview"],
                [name, "drawio", drawio, `${slug}.drawio`, "Editable Source", "Import into Draw.io"],
                [name, "plantuml", puml, `${slug}.puml`, "Editable Source", "Render with PlantUML"]
            ];
        }
        case "Deployment Diagram Template": {
            const puml = `@startuml
node "Client Device" {
    artifact "Web Browser"
}
node "Edge / CDN" {
    component "CDN / Load Balancer"
}
node "Application Server" {
    component "Application Container"
    component "Worker Container"
}
node "Data Server" {
    database "Database Server"
    queue "Message Queue"
}
"Web Browser" --> "CDN / Load Balancer" : HTTPS
"CDN / Load Balancer" --> "Application Container" : HTTP
"Application Container" --> "Database Server" : TCP
"Application Container" --> "Message Queue" : AMQP
@enduml`;
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="220" viewBox="0 0 700 220"><title>Deployment Diagram Template</title><defs><marker id="arr7" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#315fdb"/></marker></defs><g><rect x="30" y="50" width="130" height="80" rx="4" fill="#eef3ff" stroke="#315fdb"/><text x="95" y="80" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold">Client Device</text><text x="95" y="105" text-anchor="middle" font-family="Arial" font-size="11" fill="#64748b">Browser</text></g><g><rect x="200" y="50" width="140" height="80" rx="4" fill="#eef3ff" stroke="#315fdb"/><text x="270" y="80" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold">Edge Server</text><text x="270" y="105" text-anchor="middle" font-family="Arial" font-size="11" fill="#64748b">Load Balancer</text></g><g><rect x="380" y="50" width="140" height="80" rx="4" fill="#eef3ff" stroke="#315fdb"/><text x="450" y="80" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold">App Server</text><text x="450" y="105" text-anchor="middle" font-family="Arial" font-size="11" fill="#64748b">App Container</text></g><g><rect x="560" y="50" width="120" height="80" rx="4" fill="#eef3ff" stroke="#315fdb"/><text x="620" y="80" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold">Data Server</text><text x="620" y="105" text-anchor="middle" font-family="Arial" font-size="11" fill="#64748b">Database</text></g><line x1="160" y1="90" x2="200" y2="90" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr7)"/><text x="180" y="84" text-anchor="middle" font-family="Arial" font-size="10" fill="#475569">HTTPS</text><line x1="340" y1="90" x2="380" y2="90" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr7)"/><text x="360" y="84" text-anchor="middle" font-family="Arial" font-size="10" fill="#475569">HTTP</text><line x1="520" y1="90" x2="560" y2="90" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr7)"/><text x="540" y="84" text-anchor="middle" font-family="Arial" font-size="10" fill="#475569">TCP</text></svg>`;
            const drawio = `<mxfile host="ComponentHub"><diagram name="Deployment Diagram"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="n1" value="«device»&#xa;User Device" style="shape=cube;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;darkOpacity=0.05;darkOpacity2=0.1;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="30" y="40" width="130" height="80" as="geometry"/></mxCell><mxCell id="n2" value="«execution environment»&#xa;App Container" style="shape=cube;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;darkOpacity=0.05;darkOpacity2=0.1;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="220" y="40" width="150" height="80" as="geometry"/></mxCell><mxCell id="n3" value="«database»&#xa;Database Server" style="shape=cube;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;darkOpacity=0.05;darkOpacity2=0.1;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="430" y="40" width="140" height="80" as="geometry"/></mxCell><mxCell id="e1" value="HTTPS" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=#315fdb;" edge="1" source="n1" target="n2" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell><mxCell id="e2" value="TCP" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=#315fdb;" edge="1" source="n2" target="n3" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell></root></mxGraphModel></diagram></mxfile>`;
            return [
                [name, "mermaid", mmdContent, `${slug}.mmd`, "Editable Source", "Copy and edit"],
                [name, "svg", svg, `${slug}.svg`, "Downloadable File", "Download and preview"],
                [name, "drawio", drawio, `${slug}.drawio`, "Editable Source", "Import into Draw.io"],
                [name, "plantuml", puml, `${slug}.puml`, "Editable Source", "Render with PlantUML"]
            ];
        }
        case "MVC Architecture Template": {
            const puml = `@startuml
actor User
boundary View
control Controller
entity Model
database Database
User -> Controller : HTTP Request
Controller -> Model : Invokes logic
Model -> Database : Query / Update
Database --> Model : Data rows
Model --> Controller : Domain entity
Controller -> View : Passes data
View --> User : HTTP Response
@enduml`;
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="220" viewBox="0 0 700 220"><title>MVC Architecture Template</title><defs><marker id="arr8" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#315fdb"/></marker></defs><g><rect x="30" y="60" width="120" height="60" rx="6" fill="#eef3ff" stroke="#315fdb"/><text x="90" y="95" text-anchor="middle" font-family="Arial" font-size="12">HTTP Request</text></g><g><rect x="190" y="60" width="120" height="60" rx="6" fill="#eef3ff" stroke="#315fdb"/><text x="250" y="95" text-anchor="middle" font-family="Arial" font-size="12">Controller</text></g><g><rect x="350" y="60" width="120" height="60" rx="6" fill="#eef3ff" stroke="#315fdb"/><text x="410" y="95" text-anchor="middle" font-family="Arial" font-size="12">Model</text></g><g><rect x="510" y="60" width="120" height="60" rx="6" fill="#eef3ff" stroke="#315fdb"/><text x="570" y="95" text-anchor="middle" font-family="Arial" font-size="12">Database</text></g><line x1="150" y1="90" x2="190" y2="90" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr8)"/><line x1="310" y1="90" x2="350" y2="90" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr8)"/><line x1="470" y1="90" x2="510" y2="90" stroke="#315fdb" stroke-width="1.5" marker-end="url(#arr8)"/></svg>`;
            const drawio = `<mxfile host="ComponentHub"><diagram name="MVC Architecture"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="c" value="Controller" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="180" y="40" width="120" height="50" as="geometry"/></mxCell><mxCell id="m" value="Model" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="340" y="40" width="120" height="50" as="geometry"/></mxCell><mxCell id="v" value="View" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#eef3ff;strokeColor=#315fdb;" vertex="1" parent="1"><mxGeometry x="180" y="130" width="120" height="50" as="geometry"/></mxCell><mxCell id="e1" value="Invokes logic" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=#315fdb;" edge="1" source="c" target="m" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell><mxCell id="e2" value="Passes data" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=#315fdb;" edge="1" source="c" target="v" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell></root></mxGraphModel></diagram></mxfile>`;
            return [
                [name, "mermaid", mmdContent, `${slug}.mmd`, "Editable Source", "Copy and edit"],
                [name, "svg", svg, `${slug}.svg`, "Downloadable File", "Download and preview"],
                [name, "drawio", drawio, `${slug}.drawio`, "Editable Source", "Import into Draw.io"],
                [name, "plantuml", puml, `${slug}.puml`, "Editable Source", "Render with PlantUML"]
            ];
        }
        case "REST API Design Checklist": {
            const yaml = `openapi: 3.0.3
info:
  title: Reusable REST API Contract Template
  description: Standard RESTful API contract template
  version: 1.0.0
paths:
  /resources:
    get:
      summary: List resources with pagination
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: A paginated list of resources
    post:
      summary: Create a new resource
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name]
              properties:
                name:
                  type: string
      responses:
        '201':
          description: Created
  /resources/{id}:
    get:
      summary: Get resource by identifier
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Resource found
        '404':
          description: Resource not found
    delete:
      summary: Delete resource
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Deleted successfully`;
            return [
                [name, "markdown", artifact.content, `${slug}.md`, "Editable Document", "Copy and review"],
                [name, "yaml", yaml, `rest-api-contract-template.yaml`, "Specification File", "Import into Swagger / Postman"]
            ];
        }
        case "Repository Pattern Template": {
            const guide = `# Repository Pattern Implementation Guide

## Purpose
Decouple application services from direct persistence dependencies.

## Key Rules
1. Define generic repository interface \`Repository<T, ID>\` in the domain or core layer.
2. Place database-specific implementations (e.g. \`SqliteUserRepository\`) in the infrastructure/adapter layer.
3. Inject the repository into service constructors to enable in-memory mock testing.
4. Keep transactional boundaries in the application service layer.`;
            return [
                [name, "typescript", artifact.content, `${slug}.ts`, "Editable Source", "Copy and implement"],
                [name, "markdown", guide, `${slug}-guide.md`, "Editable Document", "Read architectural guidance"]
            ];
        }
        default: {
            return [
                [name, artifact.format, artifact.content, `${slug}.${artifact.format === "typescript" ? "ts" : artifact.format === "markdown" ? "md" : "mmd"}`, "Editable Source", "Copy and edit"]
            ];
        }
    }
};

const designVariantProfiles = [
    {
        name: "General Template",
        suffix: "general-template",
        replacements: [],
        componentReplacements: {}
    },
    {
        name: "E-Commerce Example",
        suffix: "e-commerce-example",
        replacements: [
            ["User", "Customer"],
            ["Client", "Shopper"],
            ["Web Application", "Storefront"],
            ["Web Client", "Storefront"],
            ["External Service", "PaymentProvider"],
            ["Data Store", "CommerceDataStore"],
            ["Repository", "OrderRepository"],
            ["Controller", "OrderController"],
            ["Database", "CommerceDatabase"],
            ["Service", "OrderService"],
            ["Model", "OrderModel"]
        ],
        componentReplacements: {
            "UML Sequence Diagram Template": [
                ["API", "CommerceAPI"]
            ],
            "UML Use Case Diagram Template": [
                ["View reports", "Track orders"],
                ["Manage records", "Manage product catalogue"]
            ],
            "UML Activity Diagram Template": [
                ["Receive request", "Receive checkout"],
                ["Process request", "Validate cart"],
                ["Saved successfully?", "Order created?"],
                ["Return validation error", "Show checkout validation error"],
                ["Return success", "Show order confirmation"],
                ["Return failure", "Show checkout failure"]
            ],
            "UML Component Diagram Template": [
                ["API Gateway", "CommerceAPI Gateway"],
                ["Authentication Service", "CustomerAuth Service"],
                ["Application Service", "OrderService"],
                ["Repository Adapter", "OrderRepository"],
                ["Database", "CommerceDatabase"],
                ["Message Queue", "OrderQueue"],
                ["Background Worker", "FulfillmentWorker"]
            ],
            "UML State Diagram Template": [
                ["Draft", "Cart"],
                ["Submitted", "Order Placed"],
                ["Approved", "Paid"],
                ["Rejected", "Payment Failed"],
                ["Completed", "Fulfilled"],
                ["submit", "checkout"],
                ["approve", "capture payment"],
                ["reject", "payment declined"],
                ["revise", "retry payment"],
                ["complete", "ship order"]
            ],
            "Data Flow Diagram Template": [
                ["External User", "Customer"],
                ["Application Process", "Order Processing"],
                ["Data Store", "Order Store"],
                ["External Service", "Payment Provider"],
                ["Request", "Order Request"],
                ["Response", "Order Confirmation"],
                ["Notification", "Payment Notification"]
            ],
            "C4 Architecture Example": [
                ["Person: User", "Person: Customer"],
                ["Software System: Application", "Software System: Commerce Platform"],
                ["Container: Web Application", "Container: Storefront"],
                ["Container: API", "Container: Commerce API"],
                ["Container: Database", "Container: Commerce Database"],
                ["Email Provider", "Notification Service"]
            ],
            "Deployment Diagram Template": [
                ["User Device", "Customer Device"],
                ["Application Container", "Commerce API Container"],
                ["Database Server", "Commerce Database"],
                ["Cache", "Product Cache"],
                ["Worker Container", "Fulfillment Worker"],
                ["Message Queue", "Order Queue"]
            ],
            "REST API Design Checklist": [
                ["# REST API design template", "# REST Order API design template"],
                ["/resources/{id}", "/orders/{id}"],
                ["/resources", "/orders"],
                ["resources", "orders"],
                ["resource", "order"]
            ],
            "Repository Pattern Template": [
                ["# Repository Pattern Implementation Guide", "# Order Repository Pattern Implementation Guide"],
                ["SqliteUserRepository", "SqliteOrderRepository"],
                ["Repository<T, ID>", "OrderRepository<T, ID>"],
                ["Repository<T>", "OrderRepository<T>"],
                ["Repository<Entity>", "OrderRepository<Order>"],
                ["Entity", "Order"]
            ],
            "MVC Architecture Template": [
                ["View", "StorefrontView"]
            ]
        }
    },
    {
        name: "University Example",
        suffix: "university-example",
        replacements: [
            ["User", "Student"],
            ["Client", "StudentPortal"],
            ["Web Application", "StudentPortal"],
            ["Web Client", "StudentPortal"],
            ["External Service", "NotificationService"],
            ["Data Store", "UniversityDataStore"],
            ["Repository", "CourseRepository"],
            ["Controller", "CourseController"],
            ["Database", "UniversityDatabase"],
            ["Service", "CourseService"],
            ["Model", "CourseModel"]
        ],
        componentReplacements: {
            "UML Sequence Diagram Template": [
                ["API", "UniversityAPI"]
            ],
            "UML Use Case Diagram Template": [
                ["View reports", "View grades"],
                ["Manage records", "Manage courses"]
            ],
            "UML Activity Diagram Template": [
                ["Receive request", "Receive enrollment request"],
                ["Process request", "Validate enrollment"],
                ["Saved successfully?", "Enrollment recorded?"],
                ["Return validation error", "Show enrollment validation error"],
                ["Return success", "Show enrollment confirmation"],
                ["Return failure", "Show enrollment failure"]
            ],
            "UML Component Diagram Template": [
                ["API Gateway", "UniversityAPI Gateway"],
                ["Authentication Service", "StudentAuth Service"],
                ["Application Service", "CourseService"],
                ["Repository Adapter", "CourseRepository"],
                ["Database", "UniversityDatabase"],
                ["Message Queue", "NotificationQueue"],
                ["Background Worker", "NotificationWorker"]
            ],
            "UML State Diagram Template": [
                ["Draft", "Course Selection"],
                ["Submitted", "Enrolled"],
                ["Approved", "Confirmed"],
                ["Rejected", "Waitlisted"],
                ["Completed", "Completed"],
                ["submit", "enroll"],
                ["approve", "confirm registration"],
                ["reject", "place on waitlist"],
                ["revise", "change course"],
                ["complete", "complete course"]
            ],
            "Data Flow Diagram Template": [
                ["External User", "Student"],
                ["Application Process", "Enrollment Processing"],
                ["Data Store", "University Data Store"],
                ["External Service", "Notification Service"],
                ["Request", "Enrollment Request"],
                ["Response", "Enrollment Confirmation"],
                ["Notification", "Course Notification"]
            ],
            "C4 Architecture Example": [
                ["Person: User", "Person: Student"],
                ["Software System: Application", "Software System: University Platform"],
                ["Container: Web Application", "Container: Student Portal"],
                ["Container: API", "Container: University API"],
                ["Container: Database", "Container: University Database"],
                ["Email Provider", "Notification Service"]
            ],
            "Deployment Diagram Template": [
                ["User Device", "Student Device"],
                ["Application Container", "University API Container"],
                ["Database Server", "University Database"],
                ["Cache", "Course Cache"],
                ["Worker Container", "Notification Worker"],
                ["Message Queue", "Notification Queue"]
            ],
            "REST API Design Checklist": [
                ["# REST API design template", "# REST Course API design template"],
                ["/resources/{id}", "/courses/{id}"],
                ["/resources", "/courses"],
                ["resources", "courses"],
                ["resource", "course"]
            ],
            "Repository Pattern Template": [
                ["# Repository Pattern Implementation Guide", "# Course Repository Pattern Implementation Guide"],
                ["SqliteUserRepository", "SqliteCourseRepository"],
                ["Repository<T, ID>", "CourseRepository<T, ID>"],
                ["Repository<T>", "CourseRepository<T>"],
                ["Repository<Entity>", "CourseRepository<Course>"],
                ["Entity", "Course"]
            ],
            "MVC Architecture Template": [
                ["View", "StudentView"]
            ]
        }
    }
];

const getDesignVariantReplacements = (componentName, variant) => [
    ...variant.replacements,
    ...(variant.componentReplacements[componentName] || [])
];

const applyDesignVariant = (value, replacements) => {
    if (!replacements.length) return value;

    const ordered = [...replacements].sort(
        ([a], [b]) => b.length - a.length
    );

    const isWord = char =>
        char !== undefined && /[A-Za-z0-9_]/.test(char);

    let result = "";
    let index = 0;

    while (index < value.length) {
        let matched = false;

        for (const [from, to] of ordered) {
            if (!value.startsWith(from, index)) continue;

            const before = value[index - 1];
            const after = value[index + from.length];

            if (isWord(before) || isWord(after)) continue;

            result += to;
            index += from.length;
            matched = true;
            break;
        }

        if (!matched) {
            result += value[index];
            index++;
        }
    }

    return result;
};

const seedDesignArtifact = (db, componentId, component) => {
    const artifact = designArtifacts[component.name];
    if (!artifact) return;

    const insertArtifact = db.prepare(`
        INSERT INTO component_artifacts(
            component_id, name, description, variant_type, delivery_method,
            artifact_format, content, download_filename, reuse_method,
            is_primary, sort_order
        ) VALUES(?,?,?,?,?,?,?,?,?,?,?)
    `);

    const baseFiles = getDesignArtifactFiles(component.name, artifact);

    designVariantProfiles.forEach((variant, variantIndex) => {
        baseFiles.forEach(([baseName, format, baseContent, baseFilename, delivery, reuse], formatIndex) => {
            const content = applyDesignVariant(
                baseContent,
                getDesignVariantReplacements(component.name, variant)
            );

            const extension = baseFilename.includes(".")
                ? baseFilename.slice(baseFilename.lastIndexOf("."))
                : "";

            const baseStem = baseFilename.includes(".")
                ? baseFilename.slice(0, baseFilename.lastIndexOf("."))
                : baseFilename;

            const filename = variantIndex === 0
                ? baseFilename
                : `${baseStem}-${variant.suffix}${extension}`;

            const artifactName =
                variantIndex === 0
                    ? baseName
                    : `${variant.name} — ${format.toUpperCase()}`;

            insertArtifact.run(
                componentId,
                artifactName,
                `${artifact.notes} ${variant.name} for practical reuse. This ${format} version is ready to reuse.`,
                variant.name,
                delivery,
                format,
                content,
                filename,
                reuse,
                variantIndex === 0 && formatIndex === 0 ? 1 : 0,
                variantIndex * 10 + formatIndex
            );
        });
    });
};

// Enrich each seed record with reusable artifact and reuse metadata.
for (const component of components) {
    component.description =
        `${component.description} Use it as a focused starting point, adapt the names and configuration to the project, and keep the integration behind a small, testable boundary. Check the official documentation for supported versions, prerequisites, security considerations, and operational limits before using it in production.`;

    if (component.type === "Design") {
        const artifact = designArtifacts[component.name];
        Object.assign(component, {
            artifactFormat: artifact.format,
            artifactContent: artifact.content,
            usageNotes: artifact.notes,
            exampleContent: artifact.example
        });
        component.deliveryMethod =
            component.artifactFormat === "mermaid"
                ? "Editable Diagram"
                : "Template";
        component.reuseMethod =
            "Copy and edit";
    } else {
        component.artifactFormat = "";
        component.artifactContent = "";
        component.exampleContent =
            `Install the ${component.name} package using its official setup instructions, configure it at the application boundary, and wrap project-specific usage behind a small module. Verify inputs and outputs with tests before sharing the module across features.`;
        component.usageNotes =
            `Use ${component.name} when its ${component.tech} ecosystem and documented trade-offs match the problem. Check the official documentation for prerequisites, supported versions, security guidance, and production limits before adopting it.`;
        component.deliveryMethod = "Package";
        component.reuseMethod = "Install package";
        const packageCommands = {
            Axios: "npm install axios",
            Bcrypt: "npm install bcrypt",
            Bootstrap: "npm install bootstrap",
            "CORS Middleware": "npm install cors",
            CASL: "npm install @casl/ability",
            "Django": "pip install Django",
            dotenv: "npm install dotenv",
            "Express.js": "npm install express",
            "FastAPI": "pip install fastapi",
            Flask: "pip install Flask",
            Helmet: "npm install helmet",
            Jest: "npm install --save-dev jest",
            "Knex.js": "npm install knex",
            Lodash: "npm install lodash",
            "Material UI": "npm install @mui/material @emotion/react @emotion/styled",
            Multer: "npm install multer",
            "node-cache": "npm install node-cache",
            "node-postgres": "npm install pg",
            Nodemailer: "npm install nodemailer",
            OpenCV: "pip install opencv-python",
            "Passport.js": "npm install passport",
            Pino: "npm install pino",
            "PM2": "npm install --global pm2",
            Postman: "",
            "React Hook Form": "npm install react-hook-form",
            "React Router": "npm install react-router-dom",
            Redis: "npm install redis",
            "Redux Toolkit": "npm install @reduxjs/toolkit react-redux",
            Sequelize: "npm install sequelize",
            Sinon: "npm install --save-dev sinon",
            Supertest: "npm install --save-dev supertest",
            "Tailwind CSS": "npm install -D tailwindcss",
            Vitest: "npm install --save-dev vitest",
            Zod: "npm install zod",
            "JSON Web Token": "npm install jsonwebtoken",
            "Marshmallow": "pip install marshmallow",
            "Papa Parse": "npm install papaparse",
            "Pydantic": "pip install pydantic",
            "Prisma": "npm install prisma @prisma/client",
            "pytest": "pip install pytest",
            "React": "npm install react react-dom",
            "SQLite": "",
            "UML": "",
            "OpenAPI Specification": ""
        };
        component.installCommand = packageCommands[component.name] || "";
    }
}

// Insert the seed categories, components, and keywords into an empty database.
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
            artifact_format, artifact_content, usage_notes, example_content,
            delivery_method, reuse_method, install_command,
            used_count, queried_not_used_count, added_on, created_by
        )
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, date('now'), ?)
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
            component.artifactFormat || "",
            component.artifactContent || "",
            component.usageNotes || "",
            component.exampleContent || "",
            component.deliveryMethod || "",
            component.reuseMethod || "",
            component.installCommand || "",
            createdBy
        ).lastInsertRowid;

        for (const word of component.keywords) {
            insertKeyword.run(word);
            linkKeyword.run(id, findKeyword.get(word).id);
        }

        if (component.name === "Entity Relationship Diagram Template") {
            seedErdArtifacts(db, id);
        } else if (component.type === "Design") {
            seedDesignArtifact(db, id, component);
        }
    }
};

module.exports = {
    categories,
    components,
    seedCatalogue,
    seedErdArtifacts,
    seedDesignArtifact,
    erdVariants,
    erdSvg,
    erdDrawio,
    getDesignArtifactFiles,
    designArtifacts,
    designVariantProfiles,
    applyDesignVariant,
    getDesignVariantReplacements
};
