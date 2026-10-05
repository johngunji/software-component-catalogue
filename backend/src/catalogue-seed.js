/* Demo catalogue for ComponentHub.

   Categories form a three-level hierarchy. Components cover both
   kinds named in the problem statement: Code (written in different
   programming languages) and Design (built with different notations
   such as UML, ERD, DFD, structured design).

   Each component also carries demo usage figures so that the
   statistics page and the purge report have something to show:
     used    - how many times it was used
     shown   - how many times it came up in a query but was not used
     age     - days since it was added
*/

const categoryTree = [
    {
        name: 'Software Design',
        children: [
            {
                name: 'Modelling Notations',
                children: [
                    {name: 'UML'},
                    {name: 'ERD'},
                    {name: 'DFD'},
                    {name: 'Structured Design'},
                    {name: 'Flowcharts'},
                ],
            },
            {
                name: 'Architecture & Patterns',
                children: [
                    {name: 'Architectural Styles'},
                    {name: 'Design Patterns'},
                ],
            },
        ],
    },
    {
        name: 'Web Development',
        children: [
            {
                name: 'Frontend',
                children: [
                    {name: 'UI Libraries'},
                    {name: 'HTTP Clients'},
                    {name: 'UI Wireframes'},
                ],
            },
            {
                name: 'Backend',
                children: [{name: 'Web Frameworks'}, {name: 'Middleware'}],
            },
        ],
    },
    {
        name: 'Security',
        children: [
            {
                name: 'Authentication',
                children: [{name: 'Token Based'}, {name: 'Password Hashing'}],
            },
            {name: 'Cryptography', children: [{name: 'Encryption Libraries'}]},
        ],
    },
    {
        name: 'Data & Storage',
        children: [
            {
                name: 'Databases',
                children: [{name: 'ORM & Query Builders'}, {name: 'Caching'}],
            },
            {
                name: 'Data Processing',
                children: [{name: 'Tabular Data'}, {name: 'Parsing & Import'}],
            },
        ],
    },
    {
        name: 'Algorithms & Data Structures',
        children: [
            {
                name: 'Searching & Sorting',
                children: [{name: 'Searching'}, {name: 'Sorting'}],
            },
            {
                name: 'Graphs & Trees',
                children: [
                    {name: 'Graph Algorithms'},
                    {name: 'Tree Structures'},
                ],
            },
        ],
    },
    {
        name: 'Utilities & Tooling',
        children: [
            {
                name: 'Logging & Testing',
                children: [{name: 'Logging'}, {name: 'Testing Frameworks'}],
            },
            {
                name: 'Files & Documents',
                children: [{name: 'File Upload'}, {name: 'PDF Generation'}],
            },
        ],
    },
    {
        name: 'Machine Learning & Vision',
        children: [
            {
                name: 'Libraries',
                children: [{name: 'Classical ML'}, {name: 'Computer Vision'}],
            },
        ],
    },
];

const gh = (repo) => `https://github.com/${repo}`;

/* [name, type, tech, leaf category, description, keywords, url, used, shown, age] */
const rows = [
    /* ---------- Web: frontend ---------- */
    [
        'React',
        'Code',
        'JavaScript',
        'UI Libraries',
        'Component-based library for building interactive user interfaces.',
        ['react', 'ui', 'components', 'frontend', 'jsx'],
        gh('facebook/react'),
        38,
        12,
        170,
    ],
    [
        'Vue.js',
        'Code',
        'JavaScript',
        'UI Libraries',
        'Progressive framework for building reactive user interfaces.',
        ['vue', 'ui', 'reactive', 'frontend', 'spa'],
        gh('vuejs/core'),
        21,
        9,
        150,
    ],
    [
        'Bootstrap',
        'Code',
        'HTML/CSS',
        'UI Libraries',
        'Responsive front-end toolkit with ready-made buttons, forms, navbars and grid layout.',
        ['bootstrap', 'css', 'responsive', 'ui', 'layout'],
        gh('twbs/bootstrap'),
        27,
        6,
        160,
    ],
    [
        'Tailwind CSS',
        'Code',
        'HTML/CSS',
        'UI Libraries',
        'Utility-first CSS framework for building custom designs quickly.',
        ['tailwind', 'css', 'utility', 'styling', 'ui'],
        gh('tailwindlabs/tailwindcss'),
        14,
        5,
        90,
    ],
    [
        'Axios',
        'Code',
        'JavaScript',
        'HTTP Clients',
        'Promise-based HTTP client for the browser and Node.js.',
        ['axios', 'http', 'api', 'client', 'promise'],
        gh('axios/axios'),
        31,
        7,
        140,
    ],
    [
        'Requests',
        'Code',
        'Python',
        'HTTP Clients',
        'Simple, elegant HTTP library for calling REST APIs from Python.',
        ['requests', 'http', 'api', 'client', 'rest'],
        gh('psf/requests'),
        25,
        4,
        130,
    ],
    [
        'Retrofit',
        'Code',
        'Java',
        'HTTP Clients',
        'Type-safe REST client for Java and Android.',
        ['retrofit', 'http', 'rest', 'android', 'client'],
        gh('square/retrofit'),
        9,
        3,
        100,
    ],
    [
        'Login Page Wireframe',
        'Design',
        'Wireframe',
        'UI Wireframes',
        'Reusable wireframe of a sign-in screen with validation messages and a password reset link.',
        ['login', 'wireframe', 'ui', 'form', 'authentication'],
        'https://github.com/jgraph/drawio',
        12,
        5,
        80,
    ],
    [
        'Dashboard Wireframe',
        'Design',
        'Wireframe',
        'UI Wireframes',
        'Wireframe for an admin dashboard with summary cards, a chart area and a data table.',
        ['dashboard', 'wireframe', 'ui', 'charts', 'admin'],
        'https://github.com/jgraph/drawio',
        7,
        4,
        70,
    ],

    /* ---------- Web: backend ---------- */
    [
        'Express.js',
        'Code',
        'JavaScript',
        'Web Frameworks',
        'Minimalist web framework for Node.js applications and HTTP APIs.',
        ['express', 'nodejs', 'backend', 'api', 'web'],
        gh('expressjs/express'),
        42,
        10,
        175,
    ],
    [
        'Flask',
        'Code',
        'Python',
        'Web Frameworks',
        'Lightweight Python micro-framework for web applications and REST APIs.',
        ['flask', 'python', 'backend', 'web', 'api'],
        gh('pallets/flask'),
        29,
        8,
        165,
    ],
    [
        'Django',
        'Code',
        'Python',
        'Web Frameworks',
        'Batteries-included Python web framework with ORM, admin and authentication.',
        ['django', 'python', 'backend', 'orm', 'admin'],
        gh('django/django'),
        24,
        11,
        160,
    ],
    [
        'Spring Boot',
        'Code',
        'Java',
        'Web Frameworks',
        'Opinionated Java framework for production-ready stand-alone applications and REST services.',
        ['spring', 'java', 'backend', 'rest', 'microservices'],
        gh('spring-projects/spring-boot'),
        19,
        8,
        155,
    ],
    [
        'FastAPI',
        'Code',
        'Python',
        'Web Frameworks',
        'Modern, fast Python framework for building APIs with type hints and automatic documentation.',
        ['fastapi', 'python', 'api', 'async', 'openapi'],
        gh('fastapi/fastapi'),
        16,
        6,
        60,
    ],
    [
        'CORS Middleware',
        'Code',
        'JavaScript',
        'Middleware',
        'Express middleware that enables Cross-Origin Resource Sharing with configurable options.',
        ['cors', 'middleware', 'express', 'security', 'headers'],
        gh('expressjs/cors'),
        18,
        3,
        120,
    ],
    [
        'Helmet',
        'Code',
        'JavaScript',
        'Middleware',
        'Express middleware that sets secure HTTP response headers.',
        ['helmet', 'middleware', 'security', 'headers', 'express'],
        gh('helmetjs/helmet'),
        13,
        4,
        110,
    ],
    [
        'Morgan',
        'Code',
        'JavaScript',
        'Middleware',
        'HTTP request logger middleware for Node.js.',
        ['morgan', 'logging', 'middleware', 'http', 'express'],
        gh('expressjs/morgan'),
        11,
        3,
        105,
    ],

    /* ---------- Security ---------- */
    [
        'JSON Web Token',
        'Code',
        'JavaScript',
        'Token Based',
        'Implementation of JSON Web Tokens for stateless authentication.',
        ['jwt', 'authentication', 'token', 'security', 'login'],
        gh('auth0/node-jsonwebtoken'),
        35,
        9,
        170,
    ],
    [
        'Passport',
        'Code',
        'JavaScript',
        'Token Based',
        'Authentication middleware for Node.js supporting hundreds of login strategies including OAuth.',
        ['passport', 'authentication', 'oauth', 'login', 'middleware'],
        gh('jaredhanson/passport'),
        17,
        6,
        130,
    ],
    [
        'Spring Security',
        'Code',
        'Java',
        'Token Based',
        'Authentication and access-control framework for Spring applications.',
        ['spring', 'security', 'authentication', 'authorization', 'rbac'],
        gh('spring-projects/spring-security'),
        10,
        5,
        120,
    ],
    [
        'bcrypt',
        'Code',
        'JavaScript',
        'Password Hashing',
        'Library for hashing and verifying passwords with the bcrypt algorithm.',
        ['bcrypt', 'password', 'hashing', 'security', 'salt'],
        gh('kelektiv/node.bcrypt.js'),
        22,
        4,
        125,
    ],
    [
        'Argon2 Hashing',
        'Code',
        'Python',
        'Password Hashing',
        'Python bindings for the Argon2 password hashing function.',
        ['argon2', 'password', 'hashing', 'security', 'python'],
        gh('hynek/argon2-cffi'),
        6,
        3,
        75,
    ],
    [
        'cryptography',
        'Code',
        'Python',
        'Encryption Libraries',
        'Python package providing cryptographic recipes and primitives such as AES and RSA.',
        ['cryptography', 'encryption', 'aes', 'rsa', 'python'],
        gh('pyca/cryptography'),
        8,
        5,
        95,
    ],

    /* ---------- Data & storage ---------- */
    [
        'Hibernate ORM',
        'Code',
        'Java',
        'ORM & Query Builders',
        'Object-relational mapping framework for Java and the JPA standard.',
        ['hibernate', 'orm', 'jpa', 'java', 'database'],
        gh('hibernate/hibernate-orm'),
        15,
        6,
        150,
    ],
    [
        'SQLAlchemy',
        'Code',
        'Python',
        'ORM & Query Builders',
        'SQL toolkit and object-relational mapper for Python.',
        ['sqlalchemy', 'orm', 'sql', 'python', 'database'],
        gh('sqlalchemy/sqlalchemy'),
        20,
        7,
        145,
    ],
    [
        'Mongoose',
        'Code',
        'JavaScript',
        'ORM & Query Builders',
        'Schema-based object modelling for MongoDB in Node.js.',
        ['mongoose', 'mongodb', 'nosql', 'odm', 'database'],
        gh('Automattic/mongoose'),
        13,
        5,
        115,
    ],
    [
        'Redis',
        'Code',
        'C',
        'Caching',
        'In-memory data store used as a cache, message broker and database.',
        ['redis', 'cache', 'in-memory', 'key-value', 'performance'],
        gh('redis/redis'),
        12,
        4,
        100,
    ],
    [
        'pandas',
        'Code',
        'Python',
        'Tabular Data',
        'Data analysis library with fast, flexible tabular data structures.',
        ['pandas', 'dataframe', 'analysis', 'csv', 'python'],
        gh('pandas-dev/pandas'),
        26,
        8,
        135,
    ],
    [
        'PapaParse',
        'Code',
        'JavaScript',
        'Parsing & Import',
        'Fast in-browser CSV parser with import and export support.',
        ['csv', 'parser', 'import', 'export', 'javascript'],
        gh('mholt/PapaParse'),
        9,
        3,
        85,
    ],

    /* ---------- Algorithms & data structures ---------- */
    [
        'Binary Search',
        'Code',
        'Java',
        'Searching',
        'Iterative and recursive binary search for sorted arrays in O(log n).',
        ['binary-search', 'searching', 'algorithm', 'sorted', 'java'],
        gh('TheAlgorithms/Java'),
        23,
        5,
        160,
    ],
    [
        'Binary Search',
        'Code',
        'Python',
        'Searching',
        'Python implementation of binary search with bisect-style helpers.',
        ['binary-search', 'searching', 'algorithm', 'python', 'sorted'],
        gh('TheAlgorithms/Python'),
        17,
        4,
        150,
    ],
    [
        'Quick Sort',
        'Code',
        'C++',
        'Sorting',
        'In-place divide-and-conquer sort with average O(n log n) running time.',
        ['quicksort', 'sorting', 'algorithm', 'divide-and-conquer', 'c++'],
        gh('TheAlgorithms/C-Plus-Plus'),
        20,
        6,
        155,
    ],
    [
        'Merge Sort',
        'Code',
        'Java',
        'Sorting',
        'Stable merge sort for arrays and linked lists.',
        ['mergesort', 'sorting', 'algorithm', 'stable', 'java'],
        gh('TheAlgorithms/Java'),
        16,
        5,
        150,
    ],
    [
        'Dijkstra Shortest Path',
        'Code',
        'Python',
        'Graph Algorithms',
        'Single-source shortest path algorithm using a priority queue.',
        ['dijkstra', 'graph', 'shortest-path', 'algorithm', 'priority-queue'],
        gh('TheAlgorithms/Python'),
        14,
        6,
        140,
    ],
    [
        'Breadth First Search',
        'Code',
        'JavaScript',
        'Graph Algorithms',
        'Graph traversal that visits nodes level by level, useful for shortest paths in unweighted graphs.',
        ['bfs', 'graph', 'traversal', 'algorithm', 'queue'],
        gh('TheAlgorithms/JavaScript'),
        8,
        3,
        70,
    ],
    [
        'AVL Tree',
        'Code',
        'C++',
        'Tree Structures',
        'Self-balancing binary search tree with rotation-based rebalancing.',
        ['avl', 'tree', 'balanced', 'bst', 'data-structure'],
        gh('TheAlgorithms/C-Plus-Plus'),
        5,
        4,
        90,
    ],

    /* ---------- Utilities & tooling ---------- */
    [
        'Winston',
        'Code',
        'JavaScript',
        'Logging',
        'Multi-transport logging library for Node.js.',
        ['winston', 'logging', 'logger', 'transports', 'nodejs'],
        gh('winstonjs/winston'),
        14,
        3,
        100,
    ],
    [
        'Log4j',
        'Code',
        'Java',
        'Logging',
        'Logging framework for Java applications with configurable appenders.',
        ['log4j', 'logging', 'java', 'appender', 'logger'],
        gh('apache/logging-log4j2'),
        10,
        4,
        120,
    ],
    [
        'pytest',
        'Code',
        'Python',
        'Testing Frameworks',
        'Testing framework for Python with fixtures and a plugin ecosystem.',
        ['pytest', 'testing', 'unit-test', 'fixtures', 'python'],
        gh('pytest-dev/pytest'),
        18,
        4,
        110,
    ],
    [
        'JUnit 5',
        'Code',
        'Java',
        'Testing Frameworks',
        'Standard unit testing framework for Java.',
        ['junit', 'testing', 'unit-test', 'java', 'assertions'],
        gh('junit-team/junit5'),
        15,
        5,
        115,
    ],
    [
        'Jest',
        'Code',
        'JavaScript',
        'Testing Frameworks',
        'JavaScript testing framework with mocking and snapshot support.',
        ['jest', 'testing', 'mock', 'javascript', 'snapshot'],
        gh('jestjs/jest'),
        12,
        4,
        95,
    ],
    [
        'Multer',
        'Code',
        'JavaScript',
        'File Upload',
        'Express middleware for handling multipart/form-data file uploads.',
        ['multer', 'upload', 'files', 'express', 'middleware'],
        gh('expressjs/multer'),
        19,
        3,
        125,
    ],
    [
        'PDFKit',
        'Code',
        'JavaScript',
        'PDF Generation',
        'PDF document generation library for Node.js and the browser.',
        ['pdf', 'report', 'generator', 'documents', 'javascript'],
        gh('foliojs/pdfkit'),
        9,
        4,
        80,
    ],

    /* ---------- Machine learning & vision ---------- */
    [
        'scikit-learn',
        'Code',
        'Python',
        'Classical ML',
        'Machine learning library for classification, regression and clustering.',
        [
            'scikit-learn',
            'machine-learning',
            'classification',
            'clustering',
            'python',
        ],
        gh('scikit-learn/scikit-learn'),
        17,
        6,
        140,
    ],
    [
        'OpenCV',
        'Code',
        'C++',
        'Computer Vision',
        'Computer vision library for image and video processing.',
        ['opencv', 'computer-vision', 'image-processing', 'video', 'detection'],
        gh('opencv/opencv'),
        11,
        5,
        130,
    ],

    /* ---------- Design: UML ---------- */
    [
        'Library Management Class Diagram',
        'Design',
        'UML',
        'UML',
        'Class diagram with Book, Member, Loan and Librarian classes, including associations and multiplicities.',
        ['class-diagram', 'uml', 'library', 'classes', 'associations'],
        'https://plantuml.com/class-diagram',
        15,
        5,
        120,
    ],
    [
        'Online Shopping Use Case Diagram',
        'Design',
        'UML',
        'UML',
        'Use case diagram for customer, admin and payment gateway actors with include and extend relationships.',
        ['use-case', 'uml', 'shopping', 'actors', 'requirements'],
        'https://plantuml.com/use-case-diagram',
        13,
        4,
        118,
    ],
    [
        'User Login Sequence Diagram',
        'Design',
        'UML',
        'UML',
        'Sequence diagram of credential validation and token issue between browser, API and database.',
        ['sequence-diagram', 'uml', 'login', 'authentication', 'interaction'],
        'https://plantuml.com/sequence-diagram',
        17,
        6,
        115,
    ],
    [
        'Order Processing Activity Diagram',
        'Design',
        'UML',
        'UML',
        'Activity diagram with swimlanes for order placement, payment, packing and delivery.',
        ['activity-diagram', 'uml', 'workflow', 'orders', 'swimlane'],
        'https://plantuml.com/activity-diagram-beta',
        9,
        4,
        100,
    ],
    [
        'Traffic Light State Machine',
        'Design',
        'UML',
        'UML',
        'State machine diagram with states, transitions and guards for a simple controller.',
        ['state-machine', 'uml', 'states', 'transitions', 'embedded'],
        'https://plantuml.com/state-diagram',
        6,
        3,
        90,
    ],

    /* ---------- Design: ERD ---------- */
    [
        'Student Course Registration ERD',
        'Design',
        'ERD',
        'ERD',
        'Entity relationship diagram for students, courses, enrolments and instructors with keys and cardinalities.',
        ['erd', 'database', 'students', 'courses', 'relationships'],
        'https://mermaid.js.org/syntax/entityRelationshipDiagram.html',
        16,
        5,
        125,
    ],
    [
        'E-commerce Database ERD',
        'Design',
        'ERD',
        'ERD',
        'ER model for customers, products, orders, order lines and payments in third normal form.',
        ['erd', 'ecommerce', 'schema', 'normalization', 'orders'],
        'https://mermaid.js.org/syntax/entityRelationshipDiagram.html',
        14,
        4,
        110,
    ],

    /* ---------- Design: DFD ---------- */
    [
        'Library System DFD (Level 0 and 1)',
        'Design',
        'DFD',
        'DFD',
        'Context diagram and first-level data flow diagram showing processes, data stores and external entities.',
        ['dfd', 'data-flow', 'context-diagram', 'processes', 'data-store'],
        'https://www.lucidchart.com/pages/data-flow-diagram',
        11,
        4,
        105,
    ],
    [
        'Online Banking DFD',
        'Design',
        'DFD',
        'DFD',
        'Data flow diagram for deposits, withdrawals and statements with balanced decomposition.',
        ['dfd', 'banking', 'data-flow', 'decomposition', 'processes'],
        'https://www.lucidchart.com/pages/data-flow-diagram',
        7,
        3,
        85,
    ],

    /* ---------- Design: structured design / flowcharts ---------- */
    [
        'Payroll Structure Chart',
        'Design',
        'Structured Design',
        'Structured Design',
        'Structure chart with modules, control hierarchy and data couples for a payroll program.',
        [
            'structure-chart',
            'structured-design',
            'modules',
            'payroll',
            'coupling',
        ],
        'https://en.wikipedia.org/wiki/Structure_chart',
        8,
        5,
        130,
    ],
    [
        'Cohesion and Coupling Checklist',
        'Design',
        'Structured Design',
        'Structured Design',
        'Review checklist for rating module cohesion and coupling in a structured design.',
        ['cohesion', 'coupling', 'structured-design', 'review', 'modules'],
        'https://en.wikipedia.org/wiki/Coupling_(computer_programming)',
        5,
        3,
        95,
    ],
    [
        'Binary Search Flowchart',
        'Design',
        'Flowchart',
        'Flowcharts',
        'Flowchart of the binary search algorithm with decision points and loop termination.',
        ['flowchart', 'binary-search', 'algorithm', 'decision', 'design'],
        'https://mermaid.js.org/syntax/flowchart.html',
        10,
        3,
        100,
    ],

    /* ---------- Design: architecture & patterns ---------- */
    [
        'MVC Architecture',
        'Design',
        'UML',
        'Architectural Styles',
        'Model-View-Controller structure showing responsibilities and message flow.',
        ['mvc', 'architecture', 'model', 'view', 'controller'],
        'https://developer.mozilla.org/en-US/docs/Glossary/MVC',
        18,
        5,
        140,
    ],
    [
        'Layered (N-tier) Architecture',
        'Design',
        'C4',
        'Architectural Styles',
        'Container-level view of presentation, business and data layers with allowed dependencies.',
        ['layered', 'architecture', 'n-tier', 'layers', 'c4'],
        'https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/n-tier',
        12,
        4,
        120,
    ],
    [
        'Microservices Architecture',
        'Design',
        'C4',
        'Architectural Styles',
        'Container diagram of independently deployable services with an API gateway and per-service data stores.',
        ['microservices', 'architecture', 'api-gateway', 'services', 'c4'],
        'https://microservices.io/patterns/microservices.html',
        9,
        6,
        100,
    ],
    [
        'Observer Pattern',
        'Design',
        'UML',
        'Design Patterns',
        'Class diagram of the Observer pattern: a subject notifying registered observers of state changes.',
        ['observer', 'design-pattern', 'uml', 'publish-subscribe', 'events'],
        'https://refactoring.guru/design-patterns/observer',
        11,
        3,
        110,
    ],
    [
        'Singleton Pattern',
        'Design',
        'UML',
        'Design Patterns',
        'Class diagram of the Singleton pattern with lazy initialisation and thread-safety notes.',
        ['singleton', 'design-pattern', 'uml', 'creational', 'instance'],
        'https://refactoring.guru/design-patterns/singleton',
        13,
        4,
        108,
    ],

    /* ---------- Legacy items: shown a lot, rarely used (purge demo) ---------- */
    [
        'jQuery',
        'Code',
        'JavaScript',
        'UI Libraries',
        'Legacy DOM manipulation library, largely replaced by native browser APIs and modern frameworks.',
        ['jquery', 'dom', 'legacy', 'ajax', 'javascript'],
        gh('jquery/jquery'),
        1,
        14,
        210,
    ],
    [
        'Backbone.js',
        'Code',
        'JavaScript',
        'UI Libraries',
        'Early MVC structure for single-page applications; rarely chosen for new projects.',
        ['backbone', 'mvc', 'legacy', 'spa', 'javascript'],
        gh('jashkenas/backbone'),
        0,
        9,
        200,
    ],
    [
        'Apache Struts',
        'Code',
        'Java',
        'Web Frameworks',
        'Older Java MVC web framework, kept for reference on legacy applications.',
        ['struts', 'java', 'legacy', 'mvc', 'web'],
        gh('apache/struts'),
        1,
        11,
        190,
    ],
    [
        'Waterfall Model Flowchart',
        'Design',
        'Flowchart',
        'Flowcharts',
        'Flowchart of the classic waterfall life-cycle phases; superseded by iterative process templates.',
        ['waterfall', 'flowchart', 'lifecycle', 'process', 'legacy'],
        'https://en.wikipedia.org/wiki/Waterfall_model',
        0,
        8,
        180,
    ],
    [
        'Moment.js',
        'Code',
        'JavaScript',
        'Parsing & Import',
        'Date parsing and formatting library now in maintenance mode.',
        ['moment', 'date', 'time', 'legacy', 'javascript'],
        gh('moment/moment'),
        1,
        10,
        185,
    ],
];

/* Searches shown in the "top searches" and "no results" reports.
   [query, number of times, results returned] */
const demoQueries = [
    ['authentication', 18, 7],
    ['uml class diagram', 14, 2],
    ['binary search', 12, 3],
    ['python web framework', 11, 4],
    ['logging', 9, 3],
    ['erd', 8, 3],
    ['password hashing', 7, 2],
    ['testing', 6, 4],
    ['kubernetes deployment', 5, 0],
    ['blockchain', 4, 0],
    ['state machine diagram', 3, 1],
    ['graphql', 3, 0],
    ['react native', 2, 0],
];

const categories = categoryTree;
const components = rows.map(
    ([
        name,
        type,
        tech,
        category,
        description,
        keywords,
        url,
        used,
        shown,
        age,
    ]) => ({
        name,
        type,
        tech,
        category,
        description,
        keywords,
        url,
        used,
        shown,
        age,
    }),
);

const seedCatalogue = (db, createdBy) => {
    const categoryIds = new Map();
    const insertCategory = db.prepare(`
        INSERT INTO categories(name, parent_id) VALUES(?, ?)
    `);

    const addTree = (nodes, parentId) => {
        for (const node of nodes) {
            const id = Number(
                insertCategory.run(node.name, parentId).lastInsertRowid,
            );
            categoryIds.set(node.name, id);
            addTree(node.children || [], id);
        }
    };
    addTree(categoryTree, null);

    const insertComponent = db.prepare(`
        INSERT INTO components(
            name, description, category_id, type, tech, url,
            used_count, queried_not_used_count, added_on, created_by
        )
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, date('now', ?), ?)
    `);
    const insertKeyword = db.prepare(`
        INSERT OR IGNORE INTO keywords(word) VALUES(?)
    `);
    const findKeyword = db.prepare(`
        SELECT id FROM keywords WHERE word=?
    `);
    const linkKeyword = db.prepare(`
        INSERT OR IGNORE INTO component_keywords(component_id, keyword_id)
        VALUES(?, ?)
    `);

    for (const component of components) {
        const categoryId = categoryIds.get(component.category);
        if (!categoryId) {
            throw new Error(
                `Missing component category: ${component.category}`,
            );
        }

        const id = insertComponent.run(
            component.name,
            component.description,
            categoryId,
            component.type,
            component.tech,
            component.url,
            component.used,
            component.shown,
            `-${component.age} days`,
            createdBy,
        ).lastInsertRowid;

        for (const word of component.keywords) {
            insertKeyword.run(word);
            linkKeyword.run(id, findKeyword.get(word).id);
        }
    }

    const insertQuery = db.prepare(`
        INSERT INTO query_log(user_id, q, result_count, at)
        VALUES(?, ?, ?, datetime('now', ?))
    `);
    const demoUser = db
        .prepare("SELECT id FROM users WHERE username = 'user'")
        .get();

    for (const [q, times, results] of demoQueries) {
        for (let i = 0; i < times; i++) {
            insertQuery.run(
                demoUser ? demoUser.id : createdBy,
                q,
                results,
                `-${1 + ((i * 3) % 28)} days`,
            );
        }
    }
};

module.exports = {
    categories,
    components,
    seedCatalogue,
};
