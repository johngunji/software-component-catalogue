/* Controlled vocabularies for the "tech" field of a component.

   Code components record a programming language, design components
   record a design notation. Values that match an entry here (ignoring
   case) are stored with the canonical spelling so that filters and
   statistics are not split between "python", "Python" and "PYTHON".
   Anything else is still accepted ("Other") and stored as typed. */

const LANGUAGES = [
    'Java',
    'Python',
    'JavaScript',
    'TypeScript',
    'C',
    'C++',
    'C#',
    'Go',
    'Rust',
    'PHP',
    'Ruby',
    'Kotlin',
    'Swift',
    'SQL',
    'HTML/CSS',
];

const NOTATIONS = [
    'UML',
    'ERD',
    'DFD',
    'Structured Design',
    'Flowchart',
    'C4',
    'Decision Table',
    'Wireframe',
];

const canonicalTech = (type, value) => {
    const list = type === 'Design' ? NOTATIONS : LANGUAGES;
    const typed = String(value ?? '').trim();
    return (
        list.find((item) => item.toLowerCase() === typed.toLowerCase()) || typed
    );
};

module.exports = {LANGUAGES, NOTATIONS, canonicalTech};
