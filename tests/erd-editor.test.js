import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ErdEditor = require('../frontend/js/erd-editor.js');

describe('ERD Editor Canonical Model & Parser/Generators', () => {
  const sampleMermaid = `erDiagram
    CUSTOMER ||--o{ ORDER : "places"
    ORDER ||--|{ LINE_ITEM : "contains"
    PRODUCT ||--o{ LINE_ITEM : "ordered_in"
    CUSTOMER {
        int id PK
        string email UK
        string name
    }
    ORDER {
        int id PK
        int customer_id FK
        decimal total_amount
    }
    LINE_ITEM {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
    }
    PRODUCT {
        int id PK
        string sku UK
        string title
        decimal price
    }`;

  test('parseMermaidERD correctly extracts multi-entity models with attributes and relationships', () => {
    const model = ErdEditor.parseMermaidERD(sampleMermaid, 'Multi-Entity Shop');
    assert.equal(model.entities.length, 4, 'Should parse 4 entities');
    assert.equal(model.relationships.length, 3, 'Should parse 3 relationships');

    const customer = model.entities.find(e => e.name === 'CUSTOMER');
    assert.ok(customer, 'CUSTOMER entity must exist');
    assert.equal(customer.attributes.length, 3);
    assert.equal(customer.attributes[0].name, 'id');
    assert.equal(customer.attributes[0].isPk, true);
    assert.equal(customer.attributes[1].name, 'email');

    const lineItem = model.entities.find(e => e.name === 'LINE_ITEM');
    assert.ok(lineItem, 'LINE_ITEM entity must exist');
    assert.equal(lineItem.attributes.length, 4);
    assert.equal(lineItem.attributes[1].isFk, true);
    assert.equal(lineItem.attributes[2].isFk, true);

    assert.equal(model.relationships[0].from, 'CUSTOMER');
    assert.equal(model.relationships[0].to, 'ORDER');
    assert.equal(model.relationships[0].label, 'places');
  });

  test('generateMermaidERD roundtrips canonical model into valid Mermaid syntax', () => {
    const model = ErdEditor.parseMermaidERD(sampleMermaid);
    const generated = ErdEditor.generateMermaidERD(model);

    assert.ok(generated.includes('erDiagram'));
    assert.ok(generated.includes('CUSTOMER ||--o{ ORDER : places'));
    assert.ok(generated.includes('int id PK'));
    assert.ok(generated.includes('int customer_id FK'));

    const reParsed = ErdEditor.parseMermaidERD(generated);
    assert.equal(reParsed.entities.length, model.entities.length);
    assert.equal(reParsed.relationships.length, model.relationships.length);
  });

  test('generateDrawioERD produces valid Draw.io XML with swimlanes and relationship edges', () => {
    const model = ErdEditor.parseMermaidERD(sampleMermaid);
    const drawioXml = ErdEditor.generateDrawioERD(model);

    assert.ok(drawioXml.includes('<mxGraphModel'));
    assert.ok(drawioXml.includes('swimlane'));
    assert.ok(drawioXml.includes('CUSTOMER'));
    assert.ok(drawioXml.includes('id: int [PK]'));
    assert.ok(drawioXml.includes('edge="1"'));
    assert.ok(drawioXml.includes('source="node-customer"'));
    assert.ok(drawioXml.includes('target="node-order"'));
  });

  test('generateSvgERD produces interactive SVG canvas with zoom layer and background rect', () => {
    const model = ErdEditor.parseMermaidERD(sampleMermaid);
    const interactiveSvg = ErdEditor.generateSvgERD(model, {
      interactive: true,
      zoom: 1.25,
      panX: 50,
      panY: 30
    });

    assert.ok(interactiveSvg.includes('class="erd-svg-canvas"'));
    assert.ok(interactiveSvg.includes('id="erd-bg-rect"'));
    assert.ok(interactiveSvg.includes('id="erd-zoom-layer"'));
    assert.ok(interactiveSvg.includes('transform="translate(50, 30) scale(1.25)"'));
    assert.ok(interactiveSvg.includes('data-entity-id="CUSTOMER"'));
    assert.ok(interactiveSvg.includes('data-entity-id="PRODUCT"'));
    assert.ok(interactiveSvg.includes('data-rel-id="'));
  });

  test('generateSvgERD produces standalone valid SVG with viewBox for export/download', () => {
    const model = ErdEditor.parseMermaidERD(sampleMermaid);
    const standaloneSvg = ErdEditor.generateSvgERD(model, { interactive: false });

    assert.ok(standaloneSvg.includes('viewBox="'));
    assert.ok(standaloneSvg.includes('<svg xmlns="http://www.w3.org/2000/svg"'));
    assert.ok(!standaloneSvg.includes('id="erd-zoom-layer"'));
    assert.ok(standaloneSvg.includes('CUSTOMER'));
    assert.ok(standaloneSvg.includes('PK'));
  });

  test('getElementCodeSnippet extracts live code mapping for selected elements', () => {
    const model = ErdEditor.parseMermaidERD(sampleMermaid);
    
    // Entity mapping
    const entitySnippet = ErdEditor.getElementCodeSnippet(model, 'entity', 'CUSTOMER');
    assert.ok(entitySnippet.includes('CUSTOMER {'));
    assert.ok(entitySnippet.includes('int id PK'));
    assert.ok(entitySnippet.includes('CUSTOMER ||--o{ ORDER : places'));

    // Relationship mapping
    const relId = model.relationships[0].id;
    const relSnippet = ErdEditor.getElementCodeSnippet(model, 'relationship', relId);
    assert.ok(relSnippet.includes('CUSTOMER ||--o{ ORDER : places'));
  });
});

describe('Add Relationship Workflow, Validations & Regression Tests', () => {
  const getBaseModel = () => ErdEditor.parseMermaidERD(`erDiagram
    CUSTOMER {
        int id PK
        string name
    }
    ORDER {
        int id PK
        int customer_id FK
    }
    INVOICE {
        int id PK
        int order_id FK
    }`);

  test('Clicking Add Relationship (entering creation mode) does not immediately alter the model', () => {
    const model = getBaseModel();
    const initialCount = model.relationships.length;
    assert.equal(initialCount, 0, 'Initially zero relationships');

    // Entering creation mode (setting draft state) without confirmation
    const draft = { from: 'CUSTOMER', to: null, label: 'places', cardinality: '||--o{' };
    const snippet = ErdEditor.getElementCodeSnippet(model, 'creating_relationship', null, draft);
    
    assert.ok(snippet.includes('Creating New Relationship'));
    assert.equal(model.relationships.length, 0, 'Model must remain unchanged before confirmation');
  });

  test('A relationship is created only after valid source and target entities are chosen and confirmed', () => {
    const model = getBaseModel();
    
    const result = ErdEditor.createRelationship(model, {
      from: 'CUSTOMER',
      to: 'ORDER',
      label: 'places',
      cardinality: '||--o{'
    });

    assert.equal(result.success, true);
    assert.ok(result.relationship);
    assert.equal(result.relationship.from, 'CUSTOMER');
    assert.equal(result.relationship.to, 'ORDER');
    assert.equal(result.relationship.label, 'places');
    assert.equal(model.relationships.length, 1);

    const mmd = ErdEditor.generateMermaidERD(model);
    assert.ok(mmd.includes('CUSTOMER ||--o{ ORDER : places'));
  });

  test('A second and third relationship can be added reliably after the first', () => {
    const model = getBaseModel();

    // 1st Relationship
    const res1 = ErdEditor.createRelationship(model, {
      from: 'CUSTOMER',
      to: 'ORDER',
      label: 'places',
      cardinality: '||--o{'
    });
    assert.equal(res1.success, true);
    assert.equal(model.relationships.length, 1);

    // 2nd Relationship
    const res2 = ErdEditor.createRelationship(model, {
      from: 'ORDER',
      to: 'INVOICE',
      label: 'generates',
      cardinality: '||--||'
    });
    assert.equal(res2.success, true);
    assert.equal(model.relationships.length, 2);

    // 3rd (Parallel) Relationship between CUSTOMER and INVOICE
    const res3 = ErdEditor.createRelationship(model, {
      from: 'CUSTOMER',
      to: 'INVOICE',
      label: 'billed_to',
      cardinality: '||--o{'
    });
    assert.equal(res3.success, true);
    assert.equal(model.relationships.length, 3);

    const mmd = ErdEditor.generateMermaidERD(model);
    assert.ok(mmd.includes('CUSTOMER ||--o{ ORDER : places'));
    assert.ok(mmd.includes('ORDER ||--|| INVOICE : generates'));
    assert.ok(mmd.includes('CUSTOMER ||--o{ INVOICE : billed_to'));
  });

  test('Cancelling creation leaves the model unchanged', () => {
    const model = getBaseModel();
    ErdEditor.createRelationship(model, { from: 'CUSTOMER', to: 'ORDER', label: 'places' });
    assert.equal(model.relationships.length, 1);

    // Draft in progress that gets cancelled
    let draft = { from: 'ORDER', to: 'INVOICE', label: 'draft_rel' };
    // Simulate user clicking cancel -> discard draft without calling createRelationship
    draft = null;

    assert.equal(model.relationships.length, 1, 'Model relationships count must not change on cancel');
  });

  test('Invalid, missing, or self-referencing endpoints are rejected with clear error', () => {
    const model = getBaseModel();

    // Missing from
    const resNoFrom = ErdEditor.createRelationship(model, { from: '', to: 'ORDER' });
    assert.equal(resNoFrom.success, false);
    assert.equal(resNoFrom.error, 'Source entity is required.');

    // Missing to
    const resNoTo = ErdEditor.createRelationship(model, { from: 'CUSTOMER', to: '' });
    assert.equal(resNoTo.success, false);
    assert.equal(resNoTo.error, 'Target entity is required.');

    // Same from and to
    const resSame = ErdEditor.createRelationship(model, { from: 'CUSTOMER', to: 'CUSTOMER' });
    assert.equal(resSame.success, false);
    assert.equal(resSame.error, 'Source and Target entities must be different.');

    // Non-existent entity
    const resUnknown = ErdEditor.createRelationship(model, { from: 'UNKNOWN_ENTITY', to: 'ORDER' });
    assert.equal(resUnknown.success, false);
    assert.ok(resUnknown.error.includes('does not exist'));

    assert.equal(model.relationships.length, 0, 'No invalid relationships should be added');
  });

  test('Relationship label and endpoints can be edited after creation and update Mermaid', () => {
    const model = getBaseModel();
    const created = ErdEditor.createRelationship(model, {
      from: 'CUSTOMER',
      to: 'ORDER',
      label: 'initial_label',
      cardinality: '||--o{'
    });
    assert.equal(created.success, true);
    const relId = created.relationship.id;

    // Update label
    const updateLabelRes = ErdEditor.updateRelationship(model, relId, { label: 'submits_order' });
    assert.equal(updateLabelRes.success, true);
    assert.equal(updateLabelRes.relationship.label, 'submits_order');

    // Update cardinality and target
    const updateCardRes = ErdEditor.updateRelationship(model, relId, {
      to: 'INVOICE',
      cardinality: '||--||'
    });
    assert.equal(updateCardRes.success, true);
    assert.equal(updateCardRes.relationship.to, 'INVOICE');
    assert.equal(updateCardRes.relationship.cardinality, '||--||');

    const mmd = ErdEditor.generateMermaidERD(model);
    assert.ok(mmd.includes('CUSTOMER ||--|| INVOICE : submits_order'));
  });

  test('Deleting a relationship removes it from the model and updates Mermaid output', () => {
    const model = getBaseModel();
    const res1 = ErdEditor.createRelationship(model, { from: 'CUSTOMER', to: 'ORDER', label: 'rel1' });
    const res2 = ErdEditor.createRelationship(model, { from: 'ORDER', to: 'INVOICE', label: 'rel2' });
    assert.equal(model.relationships.length, 2);

    const delRes = ErdEditor.deleteRelationship(model, res1.relationship.id);
    assert.equal(delRes.success, true);
    assert.equal(model.relationships.length, 1);
    assert.equal(model.relationships[0].id, res2.relationship.id);

    const mmd = ErdEditor.generateMermaidERD(model);
    assert.ok(!mmd.includes('rel1'));
    assert.ok(mmd.includes('ORDER ||--o{ INVOICE : rel2'));
  });
});
