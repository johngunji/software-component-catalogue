import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const Database = require('../backend/node_modules/better-sqlite3');

const DB_PATH = fs.existsSync(fileURLToPath(new URL('../backend/componenthub.db', import.meta.url)))
  ? fileURLToPath(new URL('../backend/componenthub.db', import.meta.url))
  : fileURLToPath(new URL('../componenthub.db', import.meta.url));

describe('Catalogue Database Integrity', () => {
  let db;

  before(() => {
    assert.ok(fs.existsSync(DB_PATH), 'componenthub.db file must exist');
    db = new Database(DB_PATH, { readonly: true });
  });

  after(() => {
    if (db) db.close();
  });

  test('Total components count should be 61', () => {
    const row = db.prepare('SELECT COUNT(*) as count FROM components').get();
    assert.equal(row.count, 61, 'Should have exactly 61 components');
  });

  test('Code components count should be 48 and Design components count should be 13', () => {
    const codeRow = db.prepare("SELECT COUNT(*) as count FROM components WHERE type = 'Code'").get();
    const designRow = db.prepare("SELECT COUNT(*) as count FROM components WHERE type = 'Design'").get();
    assert.equal(codeRow.count, 48, 'Should have 48 Code components');
    assert.equal(designRow.count, 13, 'Should have 13 Design components');
  });

  test('All 13 Design components have artifacts grouped into 3+ variants', () => {
    const designComponents = db.prepare("SELECT id, name FROM components WHERE type = 'Design'").all();
    assert.equal(designComponents.length, 13);

    for (const comp of designComponents) {
      const artifacts = db.prepare("SELECT id, name, variant_type, artifact_format, content FROM component_artifacts WHERE component_id = ?").all(comp.id);
      assert.ok(artifacts.length > 0, `Component ${comp.name} (${comp.id}) must have artifacts`);

      const variants = new Set(artifacts.map(a => a.variant_type || 'General Template'));
      if (comp.name.includes('Entity-Relationship')) {
        assert.ok(variants.size >= 6, `ER Diagram should have at least 6 variants, found ${variants.size}`);
      } else {
        assert.ok(variants.size >= 3, `Design component ${comp.name} should have at least 3 variants, found ${variants.size}`);
      }
    }
  });

  test('Design artifacts contain valid Mermaid, SVG, Drawio, and PlantUML content', () => {
    const artifacts = db.prepare(`
      SELECT a.id, a.name, a.variant_type, a.artifact_format, a.content, c.name as compName 
      FROM component_artifacts a 
      JOIN components c ON a.component_id = c.id 
      WHERE c.type = 'Design'
    `).all();

    for (const art of artifacts) {
      assert.ok(art.content && art.content.length > 0, `Artifact ${art.id} (${art.name}) content should not be empty`);

      const format = (art.artifact_format || '').toLowerCase();
      if (format.includes('mermaid')) {
        assert.ok(
          art.content.includes('erDiagram') ||
          art.content.includes('classDiagram') ||
          art.content.includes('sequenceDiagram') ||
          art.content.includes('graph') ||
          art.content.includes('flowchart') ||
          art.content.includes('stateDiagram') ||
          art.content.includes('C4Context'),
          `Mermaid artifact ${art.id} must contain valid diagram definition`
        );
      } else if (format.includes('svg')) {
        assert.ok(art.content.includes('<svg') && art.content.includes('</svg>'), `SVG artifact ${art.id} must contain valid SVG tags`);
      } else if (format.includes('drawio')) {
        assert.ok(art.content.includes('<mxGraphModel') && art.content.includes('</mxGraphModel>'), `Draw.io artifact ${art.id} must contain valid mxGraphModel tags`);
      } else if (format.includes('plantuml')) {
        assert.ok(art.content.includes('@startuml') && art.content.includes('@enduml'), `PlantUML artifact ${art.id} must contain @startuml and @enduml tags`);
      }
    }
  });

  test('Drawio artifacts contain edge connectors for relationships', () => {
    const drawioArtifacts = db.prepare(`
      SELECT a.id, a.name, a.content, c.name as compName 
      FROM component_artifacts a 
      JOIN components c ON a.component_id = c.id 
      WHERE c.type = 'Design' AND LOWER(a.artifact_format) LIKE '%drawio%'
    `).all();

    assert.ok(drawioArtifacts.length > 0, 'Should have Draw.io artifacts');
    for (const art of drawioArtifacts) {
      assert.ok(art.content.includes('edge="1"'), `Draw.io artifact ${art.id} (${art.name} - ${art.compName}) should contain relationship edges`);
    }
  });
});
