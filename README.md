# Software Component Catalogue

A web-based software component cataloguing system for storing, searching,
browsing, managing, and tracking reusable software components.

---

## 1. Project Overview

The purpose of this project is to develop a catalogue of reusable software
components.

The catalogue can contain:

- Reusable code components
- Reusable design components
- Component descriptions
- Keywords associated with components
- Hierarchical categories
- Component usage information
- Search/query information

The system allows users to find reusable components using keywords and browse
components through categories.

---

## Current implementation

Backend (Node.js, Express, SQLite) and frontend (plain HTML/JS) are in
`backend/` and `frontend/`. Start with `backend/README.md`.

- Roles: **user** (search, browse, use) and **cataloguer** (add, edit, delete,
  key words, categories, reports, purge)
- Demo data: 67 components (47 code, 20 design), 49 categories, usage figures
- Documentation: `docs/API.md`, `docs/REQUIREMENTS.md` (problem statement to
  feature mapping), `docs/DEMO.md` (viva walkthrough)
- Tests: `npm test` in `backend/`

---

## 2. Core Requirements

The system must support the following major operations:

### Component Management

- Add a component to the catalogue
- Delete a component from the catalogue
- View component details
- Store reuse information for components

### Search

- Search components using keywords
- Search using component information
- Display matching components
- Record search/query activity

### Usage Tracking

The system should maintain:

- Number of times a component has been used
- Number of times a component appeared in a query but was not used

### Hierarchical Categorisation

Components should be organised into hierarchical categories.

Example:

    Backend
    ├── Authentication
    │   ├── JWT
    │   └── OAuth
    │
    ├── Database
    │   ├── SQL
    │   └── NoSQL
    │
    └── API
        ├── REST
        └── GraphQL

Users should be able to browse components through these categories.

---

## 3. Planned Features

### Main Pages

- Home
- Browse Components
- Search
- Component Details
- Add Component
- Categories
- Statistics

### Main Functions

- Component registration
- Component deletion
- Component search
- Keyword management
- Category management
- Hierarchical browsing
- Component usage tracking
- Search/query tracking
- Statistics dashboard

---

## 4. Project Architecture

The project will follow a basic three-layer structure:

    Frontend
       |
       | HTTP / API
       ↓
    Backend
       |
       | Database queries
       ↓
    Database

### Frontend

Responsible for:

- User interface
- Pages
- Forms
- Search interface
- Component display
- API communication

### Backend

Responsible for:

- API endpoints
- Business logic
- Validation
- Search logic
- Component management
- Usage tracking
- Statistics

### Database

Responsible for storing:

- Components
- Categories
- Keywords
- Users
- Usage records
- Search/query records

---

## 5. Repository Structure

    software-component-catalogue/
    │
    ├── frontend/
    │   ├── index.html
    │   ├── css/
    │   ├── js/
    │   └── assets/
    │
    ├── backend/
    │
    ├── database/
    │
    ├── docs/
    │   ├── SRS/
    │   ├── UML/
    │   ├── DFD/
    │   ├── ER/
    │   ├── API/
    │   └── Testing/
    │
    ├── tests/
    │
    ├── README.md
    └── .gitignore

---

## 6. Folder Responsibilities

### `frontend/`

All frontend code.

Examples:

- HTML
- CSS
- JavaScript
- Images
- Icons

### `backend/`

All backend/API code.

Examples:

- Routes
- Models
- Services
- Validation
- Error handling

### `database/`

Database-related files.

Examples:

- Database schema
- SQL scripts
- Seed/sample data

### `docs/`

Software Engineering documentation.

This includes:

- SRS
- Use Case Diagram
- Class Diagram
- Sequence Diagram
- Activity Diagram
- DFD
- ER Diagram
- API Documentation
- Testing Documentation

### `tests/`

Automated and integration tests.

---

## 7. Team Structure

There are six members in the team.

Each member will have an ownership area, but everyone should understand the
complete system because the project will be presented and discussed as a team.

### Suggested ownership

| Member   | Primary Area          |
| -------- | --------------------- |
| Member 1 | Frontend              |
| Member 2 | Backend               |
| Member 3 | Database              |
| Member 4 | Component Management  |
| Member 5 | Search & Statistics   |
| Member 6 | Testing & Integration |

Ownership does not mean that a member works exclusively on that area.
Integration and documentation will be shared.

---

## 8. Git Workflow

### Main Branch

`main` contains the stable version of the project.

Do not directly develop on `main`.

### Feature Branches

Each member should create a branch for their work.

Example:

    feature/frontend
    feature/backend
    feature/database
    feature/component-management
    feature/search
    feature/testing

### Workflow

    main
      ↓
    Create feature branch
      ↓
    Work on feature
      ↓
    Commit changes
      ↓
    Push branch
      ↓
    Pull Request
      ↓
    Review
      ↓
    Merge into main

---

## 9. Commit Guidelines

Use clear commit messages.

Good:

    Add homepage layout
    Implement component search API
    Create component database schema
    Add category management
    Add component usage tracking

Avoid:

    changes
    final
    update
    new code
    test

---

## 10. Important Git Rules

### Do

- Pull the latest `main` before starting major work
- Work on your own feature branch
- Make small, meaningful commits
- Test your changes before creating a Pull Request
- Explain what your Pull Request changes

### Don't

- Directly push development work to `main`
- Commit passwords or API keys
- Commit `.env` files
- Commit `venv/`
- Commit `node_modules/`
- Delete another member's work without discussion
- Make huge unrelated changes in one commit

---

## 11. Documentation

The project will require Software Engineering documentation.

The documentation will include:

- Software Requirements Specification
- Functional requirements
- Non-functional requirements
- Use Case Diagram
- Class Diagram
- Sequence Diagram
- Data Flow Diagram
- ER Diagram
- API Documentation
- Testing Documentation
- Edge Cases
- Integration Failure Cases

All diagrams and documentation should represent the actual implementation.

---

## 12. Development Order

The project should be developed in stages:

    1. Project setup
           ↓
    2. Requirements
           ↓
    3. Database design
           ↓
    4. Backend APIs
           ↓
    5. Frontend pages
           ↓
    6. Frontend ↔ Backend integration
           ↓
    7. Testing
           ↓
    8. Documentation
           ↓
    9. Final integration
           ↓
    10. Demo / Presentation

---

## 13. Initial Component Categories

The initial catalogue can contain categories such as:

### UI / Frontend

- Button
- Form
- Navbar
- Modal
- Table
- Search Bar

### Authentication & Security

- Login
- JWT Authentication
- Password Hashing
- Role-Based Access Control

### Database

- CRUD Module
- Database Connector
- SQL Query
- Connection Pool

### API & Integration

- REST API Client
- API Authentication
- GET Handler
- POST Handler
- Error Handler

### File & Utility

- File Upload
- PDF Generator
- CSV Import/Export
- Validation Utility
- Logging Utility

### Design & Algorithms

- Use Case Diagram
- Class Diagram
- Sequence Diagram
- DFD
- Searching Algorithm
- Sorting Algorithm

These are sample catalogue entries. The final catalogue should contain
components that are actually represented and supported by the application.

---

## 14. Definition of Done

A feature is considered complete when:

- The feature works locally
- Input validation is implemented where required
- Errors are handled
- Frontend/backend integration works where applicable
- The code is committed to the appropriate branch
- Documentation is updated where necessary
- The feature has been tested
- The Pull Request is ready for review

---

## 15. Project Goal

The final system should demonstrate a working software component catalogue
that allows users to:

1. Store reusable components
2. Search for components
3. Browse components hierarchically
4. Associate keywords with components
5. Track component usage
6. Track search/query activity
7. Manage catalogue components

The implementation, diagrams, API documentation, and testing should all
describe the same system.
