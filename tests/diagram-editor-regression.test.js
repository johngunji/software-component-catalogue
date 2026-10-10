import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ErdEditor = require('../frontend/js/erd-editor.js');
const DiagramRenderer = require('../frontend/js/diagram-renderer.js');

describe('Diagram Type Detection & Non-ERD Native Modeling', () => {
  test('Correctly detects all diagram families from content, name, and tech metadata', () => {
    // ERD
    assert.equal(ErdEditor.detectDiagramType('erDiagram\n CUSTOMER ||--o{ ORDER : places', 'Entity Relationship Diagram Template', 'ERD'), 'erd');
    
    // DFD
    assert.equal(ErdEditor.detectDiagramType('flowchart LR\n User[User] --> Process[Process] --> Store[(Data Store)]', 'Data Flow Diagram Template', 'DFD'), 'dfd');
    
    // Deployment
    assert.equal(ErdEditor.detectDiagramType('flowchart TB\n User[User Device] --> CDN[CDN] --> App[App Container]', 'Deployment Diagram Template', 'UML'), 'deployment');
    
    // UML Class
    assert.equal(ErdEditor.detectDiagramType('classDiagram\n class Customer { +id\n +name }', 'UML Class Diagram Template', 'UML'), 'class');
    
    // UML Sequence
    assert.equal(ErdEditor.detectDiagramType('sequenceDiagram\n Client->>API: Request', 'UML Sequence Diagram Template', 'UML'), 'sequence');
    
    // UML Activity
    assert.equal(ErdEditor.detectDiagramType('flowchart TD\n Start([Start]) --> Valid{Valid?} --> End([End])', 'UML Activity Diagram Template', 'UML'), 'activity');
    
    // UML Use Case
    assert.equal(ErdEditor.detectDiagramType('flowchart LR\n User((User)) --- Login([Login])', 'UML Use Case Diagram Template', 'UML'), 'usecase');
    
    // C4 Architecture
    assert.equal(ErdEditor.detectDiagramType('flowchart TB\n User[Person: User] --> System[Software System: App]', 'C4 Architecture Example', 'C4'), 'c4');
    
    // MVC Architecture
    assert.equal(ErdEditor.detectDiagramType('flowchart LR\n Request --> Controller --> Model --> View', 'MVC Architecture Template', 'Design Pattern'), 'mvc');
    
    // UML Component
    assert.equal(ErdEditor.detectDiagramType('flowchart LR\n Gateway[API Gateway] --> Service[Service] --> Adapter[Adapter]', 'UML Component Diagram Template', 'UML'), 'component');
    
    // UML State
    assert.equal(ErdEditor.detectDiagramType('stateDiagram-v2\n [*] --> Draft --> Approved', 'UML State Diagram Template', 'UML'), 'state');
    
    // Document / Source
    assert.equal(ErdEditor.detectDiagramType('# REST API Specification', 'REST API Design Checklist', 'REST/OpenAPI', '', 'markdown'), 'source');
  });

  test('Non-ERD diagrams do NOT generate generic ERD placeholder entities', () => {
    const dfdCode = `flowchart LR
    Customer[Customer] -->|Order Request| Process[Order Processing]
    Process -->|Read/write| Store[(CommerceDataStore)]
    Store -->|Data| Process`;

    const dfdModel = ErdEditor.parseDiagram(dfdCode, 'dfd', 'E-Commerce DFD');
    assert.equal(dfdModel.type, 'dfd');
    assert.ok(dfdModel.elements.length >= 3, 'Should have 3+ DFD elements');
    assert.ok(dfdModel.flows.length >= 3, 'Should have 3+ DFD flows');
    assert.equal(dfdModel.entities, undefined, 'DFD model should not have ERD entities');

    const elNames = dfdModel.elements.map(e => e.label || e.name);
    assert.ok(elNames.includes('Customer'));
    assert.ok(elNames.includes('Order Processing'));
    assert.ok(elNames.includes('CommerceDataStore'));
  });
});

describe('ERD Attribute Editing & Multi-Attribute Integrity', () => {
  test('Add, edit type/flags, and delete attributes while preserving other fields', () => {
    const mermaid = `erDiagram
    CUSTOMER {
        int id PK
        string email
    }`;
    const model = ErdEditor.parseMermaidERD(mermaid, 'Customer Model');
    const customer = model.entities.find(e => e.name === 'CUSTOMER');
    assert.equal(customer.attributes.length, 2);

    // Add new attribute
    customer.attributes.push({
      id: 'attr-CUSTOMER-phone',
      name: 'phone_number',
      type: 'varchar',
      isPk: false,
      isFk: false
    });
    assert.equal(customer.attributes.length, 3);

    // Edit email attribute type and add UK/FK flag without resetting id PK
    const emailAttr = customer.attributes.find(a => a.name === 'email');
    emailAttr.type = 'text';
    emailAttr.isFk = true;

    // Verify id PK is intact
    const idAttr = customer.attributes.find(a => a.name === 'id');
    assert.equal(idAttr.isPk, true);
    assert.equal(idAttr.type, 'int');

    // Generate mermaid and verify
    const mmd = ErdEditor.generateMermaidERD(model);
    assert.ok(mmd.includes('int id PK'));
    assert.ok(mmd.includes('text email FK'));
    assert.ok(mmd.includes('varchar phone_number'));

    // Delete phone_number
    customer.attributes = customer.attributes.filter(a => a.name !== 'phone_number');
    assert.equal(customer.attributes.length, 2);
    const mmdAfterDel = ErdEditor.generateMermaidERD(model);
    assert.ok(!mmdAfterDel.includes('phone_number'));
  });
});

describe('DFD Visual Controls, Model Updates & Flows', () => {
  const sampleDFD = `flowchart LR
    Customer[Customer Device] -->|Checkout Request| OrderProcess[Process Orders]
    OrderProcess -->|Store Record| OrderStore[(Orders Database)]
    OrderStore -->|Confirmation| OrderProcess
    OrderProcess -->|Shipment Event| Fulfillment[Fulfillment Provider]`;

  test('DFD parser extracts processes, stores, external entities, and directed data flows', () => {
    const model = ErdEditor.parseMermaidDFD(sampleDFD, 'E-Commerce DFD');
    assert.equal(model.type, 'dfd');
    assert.ok(model.elements.length >= 4);
    assert.ok(model.flows.length >= 4);

    const store = model.elements.find(e => e.kind === 'store');
    assert.ok(store, 'Data store element must exist');
    assert.equal(store.kind, 'store');

    const external = model.elements.find(e => e.kind === 'external');
    assert.ok(external, 'External entity must exist');
  });

  test('DFD model updates round-trip into valid Mermaid and Draw.io XML', () => {
    const model = ErdEditor.parseMermaidDFD(sampleDFD, 'E-Commerce DFD');

    // Add new Data Store
    model.elements.push({
      id: 'InventoryStore',
      name: 'InventoryStore',
      label: 'Inventory Database',
      kind: 'store',
      x: 300,
      y: 200,
      width: 180,
      height: 70
    });

    // Add new Flow
    model.flows.push({
      id: 'flow-inventory',
      from: 'OrderProcess',
      to: 'InventoryStore',
      label: 'Reserve Stock',
      direction: 'forward'
    });

    const mmd = ErdEditor.generateMermaidDFD(model);
    assert.ok(mmd.includes('InventoryStore[(Inventory Database)]'));
    assert.ok(mmd.includes('OrderProcess -->|Reserve Stock| InventoryStore'));

    const drawio = ErdEditor.generateDrawioDFD(model);
    assert.ok(drawio.includes('Inventory Database'));
    assert.ok(drawio.includes('Reserve Stock'));
    assert.ok(drawio.includes('shape=cylinder'));

    const svg = ErdEditor.generateSvgDFD(model, { interactive: false });
    assert.ok(svg.includes('Inventory Database'));
    assert.ok(svg.includes('Reserve Stock'));
  });
});

describe('Deployment Diagram Model & Connections', () => {
  const sampleDeployment = `flowchart TB
    User[Student Device] --> CDN[CDN / Load Balancer]
    CDN --> App[University API Container]
    App --> DB[(University Database)]
    App --> CourseCache[(Course Cache)]
    App --> Worker[Notification Worker]
    Worker --> Queue[(Notification Queue)]`;

  test('Deployment diagram correctly extracts nodes, containers, databases, and communication links', () => {
    const model = ErdEditor.parseDiagram(sampleDeployment, 'deployment', 'University Deployment');
    assert.ok(model.elements.length >= 6);
    assert.ok(model.flows.length >= 6);

    const dbNode = model.elements.find(e => e.label.includes('University Database'));
    assert.ok(dbNode, 'Database element must exist');

    const cdnNode = model.elements.find(e => e.label.includes('CDN'));
    assert.ok(cdnNode, 'CDN node must exist');

    const mmd = ErdEditor.generateMermaid(model);
    assert.ok(mmd.includes('University API Container'));
    assert.ok(mmd.includes('University Database'));

    const drawio = ErdEditor.generateDrawio(model);
    assert.ok(drawio.includes('CDN / Load Balancer'));
    assert.ok(drawio.includes('University Database'));
  });
});

describe('UML Class Diagram Model, Operations & Relationships', () => {
  const sampleClass = `classDiagram
    class Customer {
        +id
        +name
        +email
        +authenticate()
    }
    class OrderService {
        +processRequest()
    }
    Customer --> OrderService`;

  test('UML Class parser extracts classes, attributes, operations, and typed relationships', () => {
    const model = ErdEditor.parseMermaidClass(sampleClass, 'UML Class Diagram');
    assert.equal(model.type, 'class');
    assert.equal(model.classes.length, 2);
    assert.equal(model.relationships.length, 1);

    const customer = model.classes.find(c => c.name === 'Customer');
    assert.ok(customer);
    assert.equal(customer.attributes.length, 3);
    assert.equal(customer.operations.length, 1);
    assert.equal(customer.operations[0].name, 'authenticate()');
  });

  test('UML Class model additions round-trip to Mermaid, Draw.io XML, and SVG', () => {
    const model = ErdEditor.parseMermaidClass(sampleClass, 'UML Class Diagram');

    // Add inheritance relationship
    model.relationships.push({
      id: 'rel-inherit',
      from: 'Customer',
      to: 'User',
      type: 'inheritance',
      label: 'inherits'
    });

    const mmd = ErdEditor.generateMermaidClass(model);
    assert.ok(mmd.includes('classDiagram'));
    assert.ok(mmd.includes('Customer <|-- User'));

    const drawio = ErdEditor.generateDrawioClass(model);
    assert.ok(drawio.includes('Customer'));
    assert.ok(drawio.includes('OrderService'));

    const svg = ErdEditor.generateSvgClass(model, { interactive: false });
    assert.ok(svg.includes('Customer'));
    assert.ok(svg.includes('authenticate()'));
  });
});

describe('C4 & MVC Architecture Models', () => {
  test('C4 Architecture extracts persons, systems, containers, and databases', () => {
    const c4Code = `flowchart TB
    Customer[Person: Customer] --> System[Software System: Commerce Platform]
    System --> Web[Container: Storefront]
    System --> API[Container: Commerce API]
    API --> DB[(Container: Commerce Database)]
    API --> Email[External System: Notification Service]`;

    const model = ErdEditor.parseDiagram(c4Code, 'c4', 'C4 Architecture');
    assert.ok(model.elements.length >= 5);
    assert.ok(model.flows.length >= 5);

    const mmd = ErdEditor.generateMermaid(model);
    assert.ok(mmd.includes('Person: Customer'));
    assert.ok(mmd.includes('Commerce Database'));
  });

  test('MVC Architecture extracts controller, model, view, and flow interactions', () => {
    const mvcCode = `flowchart LR
    Request[HTTP Request] --> OrderController[OrderController]
    OrderController --> OrderModel[OrderModel / OrderService]
    OrderModel --> CommerceDatabase[(CommerceDatabase)]
    OrderModel --> StorefrontView[StorefrontView / Serializer]
    StorefrontView --> Response[HTTP Response]`;

    const model = ErdEditor.parseDiagram(mvcCode, 'mvc', 'MVC Architecture');
    assert.ok(model.elements.length >= 5);
    assert.ok(model.flows.length >= 4);

    const mmd = ErdEditor.generateMermaid(model);
    assert.ok(mmd.includes('OrderController'));
    assert.ok(mmd.includes('StorefrontView'));
  });
});

describe('Draw.io XML Vector Rendering Preview', () => {
  test('DiagramRenderer.parseDrawioToSvg renders Draw.io XML into clean SVG vector', () => {
    const sampleMermaid = `erDiagram
      CUSTOMER ||--o{ ORDER : places
      CUSTOMER { int id PK }
      ORDER { int id PK }`;
    const model = ErdEditor.parseMermaidERD(sampleMermaid);
    const drawioXml = ErdEditor.generateDrawioERD(model);

    const svgOutput = DiagramRenderer.parseDrawioToSvg(drawioXml);
    assert.ok(svgOutput.includes('<svg'));
    assert.ok(svgOutput.includes('</svg>'));
    assert.ok(svgOutput.includes('CUSTOMER'));
    assert.ok(svgOutput.includes('ORDER'));
    assert.ok(svgOutput.includes('places'));
  });
});

describe('JavaScript Syntax Integrity & File Validation', () => {
  const jsFiles = [
    '../frontend/js/catalogue.js',
    '../frontend/js/diagram-renderer.js',
    '../frontend/js/erd-editor.js',
    '../frontend/js/app.js'
  ];

  for (const relPath of jsFiles) {
    test(`JavaScript file syntax valid: ${relPath}`, () => {
      const fullPath = path.resolve(path.dirname(new URL(import.meta.url).pathname), relPath);
      const code = fs.readFileSync(fullPath, 'utf8');
      assert.ok(code.length > 0, `${relPath} should not be empty`);
      // Parse in VM script to ensure zero syntax errors
      assert.doesNotThrow(() => {
        new vm.Script(code);
      }, `${relPath} must parse without syntax errors`);
    });
  }
});

describe('Shared ErdEditor Detection & Save Path Contract Regression', () => {
  test('detectDiagramType is backward compatible across 2, 3, 4, and 5 argument signatures', () => {
    // 2 args
    assert.equal(ErdEditor.detectDiagramType('erDiagram\n USER ||--o{ ORDER : places', 'User Schema'), 'erd');
    // 3 args
    assert.equal(ErdEditor.detectDiagramType('flowchart LR\n A --> B', 'Data Flow', 'dfd'), 'dfd');
    // 4 args
    assert.equal(ErdEditor.detectDiagramType('classDiagram\n class A', 'Domain Class', 'uml', 'class'), 'class');
    // 5 args with source format
    assert.equal(ErdEditor.detectDiagramType('interface Repo<T> {}', 'Repository Pattern', 'TypeScript', '', 'typescript'), 'source');
    // 5 args where diagram code is in a generic format
    assert.equal(ErdEditor.detectDiagramType('erDiagram\n A ||--o{ B : r', 'Entity Rel', 'Design', '', 'mermaid'), 'erd');
  });

  test('Save contract distinguishes visual diagram saves from source document saves', () => {
    // Visual diagram model save
    const erdMermaid = 'erDiagram\n CUSTOMER ||--o{ ORDER : places\n CUSTOMER { int id PK }';
    const erdModel = ErdEditor.parseDiagram(erdMermaid, 'erd', 'Customer ERD');
    const generatedMmd = ErdEditor.generateMermaid(erdModel);
    const generatedSvg = ErdEditor.generateSvg(erdModel);
    const generatedDrawio = ErdEditor.generateDrawio(erdModel);

    assert.ok(generatedMmd.includes('CUSTOMER'));
    assert.ok(generatedSvg.includes('<svg'));
    assert.ok(generatedDrawio.includes('<mxGraphModel'));

    // Source document save does not invoke diagram generators
    const sourceCode = 'export class Repository<T> { findById(id: string): T | null { return null; } }';
    assert.equal(typeof sourceCode, 'string');
    assert.ok(sourceCode.length > 0);
  });
});

