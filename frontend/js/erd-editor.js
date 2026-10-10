/**
 * ComponentHub Unified Diagram & Design Editor (Draw.io Inspired Architecture)
 * Provides type-adaptive visual and source editing for:
 * - Entity Relationship Diagrams (ERD)
 * - Data Flow Diagrams (DFD)
 * - Deployment Diagrams
 * - UML Class Diagrams
 * - UML Activity Diagrams
 * - UML Sequence Diagrams
 * - UML Use Case Diagrams
 * - C4 Architecture Diagrams
 * - MVC Architecture Diagrams
 * - UML Component Diagrams
 * - UML State Diagrams
 * - Specification & Source Code Artifacts (REST API, Templates, etc.)
 */

const ErdEditor = (() => {
  // Utility: Safe HTML & XML escaping
  const esc = str =>
    String(str ?? "").replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /**
   * Diagram Family Detection
   */
  const detectDiagramType = (content = "", compName = "", tech = "", notation = "", artifactFormat = "") => {
    const c = String(content || "").trim();
    const name = String(compName || "").toLowerCase();
    const t = String(tech || notation || "").toLowerCase();
    const format = String(artifactFormat || "").toLowerCase();

    // 0. Non-visual code / document formats check
    const codeFormats = ["markdown", "md", "typescript", "ts", "javascript", "js", "python", "py", "json", "yaml", "yml", "sql", "txt", "html", "css"];
    const isDiagramCode = c.startsWith("erDiagram") || c.startsWith("classDiagram") || c.startsWith("sequenceDiagram") ||
      c.startsWith("stateDiagram") || c.startsWith("flowchart") || c.startsWith("graph") ||
      c.startsWith("@startuml") || c.startsWith("<svg") || c.startsWith("<mxGraphModel");

    if (codeFormats.includes(format) && !isDiagramCode) {
      return "source";
    }

    // 1. Explicit name / tech check
    if (t === "erd" || name.includes("entity relationship") || name.includes("entity-relationship") || c.startsWith("erDiagram") || c.startsWith("erdiagram")) {
      return "erd";
    }
    if (name.includes("class") || c.startsWith("classDiagram") || c.startsWith("classdiagram")) {
      return "class";
    }
    if (name.includes("sequence") || c.startsWith("sequenceDiagram") || c.startsWith("sequencediagram")) {
      return "sequence";
    }
    if (name.includes("activity")) {
      return "activity";
    }
    if (name.includes("use case") || name.includes("usecase")) {
      return "usecase";
    }
    if (t === "c4" || name.includes("c4")) {
      return "c4";
    }
    if (name.includes("mvc")) {
      return "mvc";
    }
    if (name.includes("deployment")) {
      return "deployment";
    }
    if (name.includes("component diagram")) {
      return "component";
    }
    if (name.includes("state") || c.startsWith("stateDiagram") || c.startsWith("statediagram")) {
      return "state";
    }
    if (t === "dfd" || name.includes("data flow") || name.includes("dfd")) {
      return "dfd";
    }

    // 2. Syntax-based fallback
    if (c.startsWith("erDiagram") || c.startsWith("erdiagram")) return "erd";
    if (c.startsWith("classDiagram") || c.startsWith("classdiagram")) return "class";
    if (c.startsWith("sequenceDiagram") || c.startsWith("sequencediagram")) return "sequence";
    if (c.startsWith("stateDiagram") || c.startsWith("statediagram")) return "state";
    if (c.includes("Person:") || c.includes("Software System:")) return "c4";
    if (c.includes("Controller") && c.includes("Model") && c.includes("View")) return "mvc";
    if (c.includes("([Start])") || c.includes("([End])") || c.includes("Valid{")) return "activity";
    if (c.includes("((") && c.includes("subgraph System")) return "usecase";
    if (c.includes("Device") && (c.includes("CDN") || c.includes("Container"))) return "deployment";
    if (c.includes("Data Store") || c.includes("DataStore") || c.includes("[(CommerceDataStore)]") || c.includes("[(UniversityDataStore)]")) return "dfd";
    if (c.includes("Gateway") && c.includes("Adapter")) return "component";

    if (codeFormats.includes(format)) {
      return "source";
    }

    return "generic";
  };

  /**
   * Diagram Family Metadata
   */
  const DIAGRAM_META = {
    erd: {
      type: "erd",
      name: "Entity Relationship Diagram",
      badge: "ERD Editor",
      icon: "database",
      elementLabel: "Entity",
      connectorLabel: "Relationship"
    },
    dfd: {
      type: "dfd",
      name: "Data Flow Diagram",
      badge: "DFD Editor",
      icon: "activity",
      elementLabel: "Process / Store",
      connectorLabel: "Data Flow"
    },
    deployment: {
      type: "deployment",
      name: "Deployment Diagram",
      badge: "Deployment Editor",
      icon: "server",
      elementLabel: "Node / Container",
      connectorLabel: "Connection"
    },
    class: {
      type: "class",
      name: "UML Class Diagram",
      badge: "UML Class Editor",
      icon: "box",
      elementLabel: "Class",
      connectorLabel: "Relationship"
    },
    sequence: {
      type: "sequence",
      name: "UML Sequence Diagram",
      badge: "UML Sequence Editor",
      icon: "git-commit",
      elementLabel: "Participant",
      connectorLabel: "Message"
    },
    activity: {
      type: "activity",
      name: "UML Activity Diagram",
      badge: "UML Activity Editor",
      icon: "git-branch",
      elementLabel: "Action / Decision",
      connectorLabel: "Control Flow"
    },
    usecase: {
      type: "usecase",
      name: "UML Use Case Diagram",
      badge: "UML Use Case Editor",
      icon: "users",
      elementLabel: "Actor / Use Case",
      connectorLabel: "Association"
    },
    c4: {
      type: "c4",
      name: "C4 Architecture Diagram",
      badge: "C4 Architecture Editor",
      icon: "layers",
      elementLabel: "Person / Container",
      connectorLabel: "Relationship"
    },
    mvc: {
      type: "mvc",
      name: "MVC Architecture Diagram",
      badge: "MVC Architecture Editor",
      icon: "layout",
      elementLabel: "Component Role",
      connectorLabel: "Flow"
    },
    component: {
      type: "component",
      name: "UML Component Diagram",
      badge: "UML Component Editor",
      icon: "cpu",
      elementLabel: "Component",
      connectorLabel: "Dependency"
    },
    state: {
      type: "state",
      name: "UML State Diagram",
      badge: "UML State Editor",
      icon: "circle",
      elementLabel: "State",
      connectorLabel: "Transition"
    },
    source: {
      type: "source",
      name: "Specification & Source Document",
      badge: "Source & Spec Editor",
      icon: "file-text",
      elementLabel: "Section",
      connectorLabel: "Link"
    },
    generic: {
      type: "generic",
      name: "Diagram",
      badge: "Diagram Editor",
      icon: "layout",
      elementLabel: "Node",
      connectorLabel: "Connector"
    }
  };

  /* =========================================================================
     1. ERD MODEL, PARSER & GENERATORS
     ========================================================================= */

  const validateRelationship = (model, { from, to, label = "relates", cardinality = "||--o{" } = {}) => {
    if (!from || typeof from !== "string" || !from.trim()) {
      return { valid: false, error: "Source entity is required." };
    }
    if (!to || typeof to !== "string" || !to.trim()) {
      return { valid: false, error: "Target entity is required." };
    }
    const cleanFrom = from.trim().toUpperCase();
    const cleanTo = to.trim().toUpperCase();

    if (cleanFrom === cleanTo) {
      return { valid: false, error: "Source and Target entities must be different." };
    }

    const sourceExists = model.entities.some(e => e.name === cleanFrom);
    if (!sourceExists) {
      return { valid: false, error: `Source entity "${cleanFrom}" does not exist in model.` };
    }

    const targetExists = model.entities.some(e => e.name === cleanTo);
    if (!targetExists) {
      return { valid: false, error: `Target entity "${cleanTo}" does not exist in model.` };
    }

    return { valid: true };
  };

  const createRelationship = (model, { from, to, label = "relates", cardinality = "||--o{" } = {}) => {
    const validation = validateRelationship(model, { from, to, label, cardinality });
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const cleanFrom = from.trim().toUpperCase();
    const cleanTo = to.trim().toUpperCase();
    const cleanLabel = (label && label.trim()) ? label.trim().replace(/\s+/g, "_") : "relates";

    const newRel = {
      id: `rel-${Date.now().toString(36)}-${Math.floor(Math.random() * 10000)}`,
      from: cleanFrom,
      to: cleanTo,
      cardinality: cardinality || "||--o{",
      label: cleanLabel
    };

    model.relationships.push(newRel);
    return { success: true, relationship: newRel };
  };

  const updateRelationship = (model, id, { from, to, label, cardinality } = {}) => {
    const rel = model.relationships.find(r => r.id === id);
    if (!rel) {
      return { success: false, error: "Relationship not found." };
    }

    const targetFrom = from !== undefined ? from : rel.from;
    const targetTo = to !== undefined ? to : rel.to;
    const targetLabel = label !== undefined ? label : rel.label;
    const targetCard = cardinality !== undefined ? cardinality : rel.cardinality;

    const validation = validateRelationship(model, {
      from: targetFrom,
      to: targetTo,
      label: targetLabel,
      cardinality: targetCard
    });

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    rel.from = targetFrom.trim().toUpperCase();
    rel.to = targetTo.trim().toUpperCase();
    rel.label = targetLabel ? targetLabel.trim().replace(/\s+/g, "_") : "relates";
    rel.cardinality = targetCard || "||--o{";

    return { success: true, relationship: rel };
  };

  const deleteRelationship = (model, id) => {
    const initialLen = model.relationships.length;
    model.relationships = model.relationships.filter(r => r.id !== id);
    return { success: model.relationships.length < initialLen };
  };

  const parseMermaidERD = (mermaidCode, title = "Entity Relationship Diagram") => {
    const lines = mermaidCode.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("%%"));
    const entitiesMap = new Map();
    const relationships = [];

    let currentEntity = null;
    let relCounter = 1;

    const relRegex = /^([A-Za-z0-9_]+)\s*([|{}o\-.]+)\s*([A-Za-z0-9_]+)\s*:\s*"?([^"\n]+)"?$/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.toLowerCase() === "erdiagram") continue;

      const relMatch = line.match(relRegex);
      if (relMatch) {
        const [, from, cardinality, to, rawLabel] = relMatch;
        const label = rawLabel.trim().replace(/^"|"$/g, "");
        relationships.push({
          id: `rel-${relCounter++}`,
          from: from.trim().toUpperCase(),
          to: to.trim().toUpperCase(),
          cardinality: cardinality.trim(),
          label
        });

        if (!entitiesMap.has(from.trim().toUpperCase())) {
          entitiesMap.set(from.trim().toUpperCase(), {
            id: from.trim().toUpperCase(),
            name: from.trim().toUpperCase(),
            attributes: []
          });
        }
        if (!entitiesMap.has(to.trim().toUpperCase())) {
          entitiesMap.set(to.trim().toUpperCase(), {
            id: to.trim().toUpperCase(),
            name: to.trim().toUpperCase(),
            attributes: []
          });
        }
        continue;
      }

      if (line.includes("{")) {
        const entName = line.split("{")[0].trim().toUpperCase();
        if (entName) {
          if (!entitiesMap.has(entName)) {
            entitiesMap.set(entName, { id: entName, name: entName, attributes: [] });
          }
          currentEntity = entitiesMap.get(entName);
        }
        const afterBrace = line.split("{")[1];
        if (afterBrace && afterBrace.includes("}")) {
          const attrStr = afterBrace.split("}")[0].trim();
          if (attrStr) {
            parseAttributeLine(attrStr, currentEntity);
          }
          currentEntity = null;
        }
        continue;
      }

      if (line === "}" || line.startsWith("}")) {
        currentEntity = null;
        continue;
      }

      if (currentEntity) {
        parseAttributeLine(line, currentEntity);
      }
    }

    function parseAttributeLine(line, entity) {
      if (!entity) return;
      const tokens = line.split(/\s+/).filter(Boolean);
      if (tokens.length >= 2) {
        const type = tokens[0];
        const name = tokens[1];
        const isPk = tokens.slice(2).some(t => t.toUpperCase().includes("PK"));
        const isFk = tokens.slice(2).some(t => t.toUpperCase().includes("FK"));
        entity.attributes.push({
          id: `attr-${entity.name}-${name}`,
          name,
          type,
          isPk,
          isFk
        });
      } else if (tokens.length === 1) {
        entity.attributes.push({
          id: `attr-${entity.name}-${tokens[0]}`,
          name: tokens[0],
          type: "string",
          isPk: false,
          isFk: false
        });
      }
    }

    const entities = Array.from(entitiesMap.values());
    const cols = Math.min(3, Math.ceil(Math.sqrt(Math.max(1, entities.length))));
    const colWidth = 260;
    const rowHeight = 220;
    entities.forEach((entity, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      entity.x = 60 + col * colWidth;
      entity.y = 60 + row * rowHeight;
      entity.width = 200;
      entity.height = Math.max(90, 44 + (entity.attributes.length * 24));
    });

    return {
      type: "erd",
      title,
      entities,
      relationships
    };
  };

  const generateMermaidERD = model => {
    let output = "erDiagram\n";

    for (const rel of model.relationships) {
      const card = rel.cardinality || "||--o{";
      const lbl = rel.label ? rel.label.replace(/\s+/g, "_") : "relates";
      output += `    ${rel.from} ${card} ${rel.to} : ${lbl}\n`;
    }

    for (const ent of model.entities) {
      output += `    ${ent.name} {\n`;
      if (ent.attributes.length === 0) {
        output += `        string id PK\n`;
      } else {
        for (const attr of ent.attributes) {
          const pkFk = [attr.isPk ? "PK" : "", attr.isFk ? "FK" : ""].filter(Boolean).join(" ");
          output += `        ${attr.type || "string"} ${attr.name || "field"}${pkFk ? " " + pkFk : ""}\n`;
        }
      }
      output += `    }\n`;
    }

    return output;
  };

  const generateDrawioERD = model => {
    let cells = `<mxCell id="0"/><mxCell id="1" parent="0"/>`;
    const entIdMap = new Map();

    model.entities.forEach((ent, idx) => {
      const cellId = `node-${ent.name.toLowerCase()}`;
      entIdMap.set(ent.name, cellId);

      const attrLines = ent.attributes.map(a => {
        const tag = a.isPk ? " [PK]" : (a.isFk ? " [FK]" : "");
        return `${a.name}: ${a.type}${tag}`;
      }).join("&#xa;");

      const label = `${ent.name}&#xa;${attrLines || "id: int [PK]"}`;
      const height = Math.max(80, 32 + ent.attributes.length * 22);

      cells += `<mxCell id="${cellId}" value="${esc(label)}" style="swimlane;fontStyle=1;childLayout=stackLayout;horizontal=1;startSize=28;fillColor=#eef3ff;strokeColor=#315fdb;rounded=1;fontFamily=Inter;" vertex="1" parent="1">
        <mxGeometry x="${ent.x || (60 + (idx % 3) * 260)}" y="${ent.y || (60 + Math.floor(idx / 3) * 200)}" width="${ent.width || 200}" height="${height}" as="geometry"/>
      </mxCell>`;
    });

    model.relationships.forEach((rel, idx) => {
      const sourceId = entIdMap.get(rel.from);
      const targetId = entIdMap.get(rel.to);
      if (sourceId && targetId) {
        cells += `<mxCell id="edge-${idx + 1}" value="${esc(rel.label || '')}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#315fdb;strokeWidth=2;entryX=0;entryY=0.5;entryDx=0;entryDy=0;" edge="1" source="${sourceId}" target="${targetId}" parent="1">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>`;
      }
    });

    return `<mxfile host="ComponentHub"><diagram name="${esc(model.title || 'ERD')}"><mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1"><root>${cells}</root></mxGraphModel></diagram></mxfile>`;
  };

  const generateSvgERD = (model, {
    interactive = false,
    selectedId = null,
    selectedType = null,
    zoom = 1,
    panX = 0,
    panY = 0,
    relDraft = null
  } = {}) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    model.entities.forEach(ent => {
      minX = Math.min(minX, ent.x);
      minY = Math.min(minY, ent.y);
      maxX = Math.max(maxX, ent.x + (ent.width || 200));
      maxY = Math.max(maxY, ent.y + (ent.height || 100));
    });

    if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 700; maxY = 450; }

    const pad = 60;
    const viewBoxX = Math.max(0, minX - pad);
    const viewBoxY = Math.max(0, minY - pad);
    const viewBoxW = Math.max(760, (maxX - minX) + pad * 2);
    const viewBoxH = Math.max(480, (maxY - minY) + pad * 2);

    let innerContent = `
      <defs>
        <marker id="erd-arrow-one" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <line x1="8" y1="1" x2="8" y2="9" stroke="#2563eb" stroke-width="2.2"/>
          <line x1="4" y1="1" x2="4" y2="9" stroke="#2563eb" stroke-width="2.2"/>
        </marker>
        <marker id="erd-arrow-many" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 8 5 L 0 9" fill="none" stroke="#2563eb" stroke-width="2"/>
        </marker>
        <filter id="erd-shadow" x="-8%" y="-8%" width="116%" height="116%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#0f172a" flood-opacity="0.1"/>
        </filter>
        <filter id="erd-highlight" x="-12%" y="-12%" width="124%" height="124%">
          <feDropShadow dx="0" dy="0" stdDeviation="7" flood-color="#2563eb" flood-opacity="0.6"/>
        </filter>
        <filter id="erd-source-highlight" x="-12%" y="-12%" width="124%" height="124%">
          <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#10b981" flood-opacity="0.7"/>
        </filter>
        <filter id="erd-target-highlight" x="-12%" y="-12%" width="124%" height="124%">
          <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#8b5cf6" flood-opacity="0.7"/>
        </filter>
      </defs>`;

    const pairGroups = new Map();
    model.relationships.forEach(rel => {
      const pairKey = [rel.from, rel.to].sort().join("<->");
      if (!pairGroups.has(pairKey)) pairGroups.set(pairKey, []);
      pairGroups.get(pairKey).push(rel);
    });

    const entityMap = new Map(model.entities.map(e => [e.name, e]));

    pairGroups.forEach(groupRels => {
      const totalInGroup = groupRels.length;

      groupRels.forEach((rel, groupIdx) => {
        const fromEnt = entityMap.get(rel.from);
        const toEnt = entityMap.get(rel.to);
        if (!fromEnt || !toEnt) return;

        const isSelected = selectedType === "relationship" && selectedId === rel.id;
        const strokeColor = isSelected ? "#2563eb" : "#475569";
        const strokeWidth = isSelected ? "3" : "2";

        const sx = fromEnt.x + (fromEnt.width || 200) / 2;
        const sy = fromEnt.y + (fromEnt.height || 100) / 2;
        const tx = toEnt.x + (toEnt.width || 200) / 2;
        const ty = toEnt.y + (toEnt.height || 100) / 2;

        let x1 = sx, y1 = sy, x2 = tx, y2 = ty;
        const dx = tx - sx;
        const dy = ty - sy;
        const dist = Math.max(1, Math.hypot(dx, dy));

        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) {
            x1 = fromEnt.x + (fromEnt.width || 200);
            x2 = toEnt.x;
          } else {
            x1 = fromEnt.x;
            x2 = toEnt.x + (toEnt.width || 200);
          }
          y1 = sy;
          y2 = ty;
        } else {
          if (dy > 0) {
            y1 = fromEnt.y + (fromEnt.height || 100);
            y2 = toEnt.y;
          } else {
            y1 = fromEnt.y;
            y2 = toEnt.y + (toEnt.height || 100);
          }
          x1 = sx;
          x2 = tx;
        }

        const offsetIndex = groupIdx - (totalInGroup - 1) / 2;
        const perpX = (-dy / dist) * offsetIndex * 28;
        const perpY = (dx / dist) * offsetIndex * 28;

        const fx1 = x1 + perpX;
        const fy1 = y1 + perpY;
        const fx2 = x2 + perpX;
        const fy2 = y2 + perpY;

        const mx = (fx1 + fx2) / 2;
        const my = (fy1 + fy2) / 2;

        innerContent += `<g class="erd-rel-group" data-rel-id="${rel.id}" style="cursor:pointer;">
          <line x1="${fx1}" y1="${fy1}" x2="${fx2}" y2="${fy2}" stroke="${strokeColor}" stroke-width="${strokeWidth}" marker-start="url(#erd-arrow-one)" marker-end="url(#erd-arrow-many)"/>
          <line x1="${fx1}" y1="${fy1}" x2="${fx2}" y2="${fy2}" stroke="transparent" stroke-width="18"/>
          <rect x="${mx - 40}" y="${my - 11}" width="80" height="22" rx="5" fill="#ffffff" stroke="${isSelected ? '#2563eb' : '#cbd5e1'}" stroke-width="${isSelected ? '2' : '1'}"/>
          <text x="${mx}" y="${my + 4}" text-anchor="middle" font-size="11" font-weight="600" fill="${isSelected ? '#2563eb' : '#334155'}">${esc(rel.label || 'rel')}</text>
        </g>`;
      });
    });

    if (selectedType === "creating_relationship" && relDraft && relDraft.from && relDraft.to) {
      const draftFromEnt = entityMap.get(relDraft.from);
      const draftToEnt = entityMap.get(relDraft.to);
      if (draftFromEnt && draftToEnt) {
        const sx = draftFromEnt.x + (draftFromEnt.width || 200) / 2;
        const sy = draftFromEnt.y + (draftFromEnt.height || 100) / 2;
        const tx = draftToEnt.x + (draftToEnt.width || 200) / 2;
        const ty = draftToEnt.y + (draftToEnt.height || 100) / 2;
        const mx = (sx + tx) / 2;
        const my = (sy + ty) / 2;

        innerContent += `<g class="erd-preview-rel">
          <line x1="${sx}" y1="${sy}" x2="${tx}" y2="${ty}" stroke="#10b981" stroke-width="2.5" stroke-dasharray="6,4"/>
          <rect x="${mx - 42}" y="${my - 11}" width="84" height="22" rx="5" fill="#ecfdf5" stroke="#10b981" stroke-width="1.5"/>
          <text x="${mx}" y="${my + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="#047857">${esc(relDraft.label || 'new rel')}</text>
        </g>`;
      }
    }

    model.entities.forEach(ent => {
      const isSelected = selectedType === "entity" && selectedId === ent.name;
      const isDraftFrom = selectedType === "creating_relationship" && relDraft && relDraft.from === ent.name;
      const isDraftTo = selectedType === "creating_relationship" && relDraft && relDraft.to === ent.name;

      let filter = 'filter="url(#erd-shadow)"';
      let borderColor = "#cbd5e1";
      let borderWidth = "1.5";
      let headerColor = "#2563eb";

      if (isDraftFrom) {
        filter = 'filter="url(#erd-source-highlight)"';
        borderColor = "#10b981";
        borderWidth = "3";
        headerColor = "#059669";
      } else if (isDraftTo) {
        filter = 'filter="url(#erd-target-highlight)"';
        borderColor = "#8b5cf6";
        borderWidth = "3";
        headerColor = "#7c3aed";
      } else if (isSelected) {
        filter = 'filter="url(#erd-highlight)"';
        borderColor = "#2563eb";
        borderWidth = "2.5";
        headerColor = "#1d4ed8";
      }

      const headerH = 32;
      const rowH = 24;
      const entWidth = ent.width || 200;
      const totalH = Math.max(ent.height || 90, headerH + Math.max(1, ent.attributes.length) * rowH + 8);
      ent.height = totalH;

      innerContent += `<g class="erd-entity-group ${isDraftFrom ? 'is-source' : ''} ${isDraftTo ? 'is-target' : ''}" data-entity-id="${ent.name}" transform="translate(${ent.x}, ${ent.y})" ${filter} style="cursor:${selectedType === 'creating_relationship' ? 'pointer' : (interactive ? 'grab' : 'pointer')};">
        <rect x="0" y="0" width="${entWidth}" height="${totalH}" rx="8" fill="#ffffff" stroke="${borderColor}" stroke-width="${borderWidth}"/>
        <path d="M 0 8 Q 0 0 8 0 L ${entWidth - 8} 0 Q ${entWidth} 0 ${entWidth} 8 L ${entWidth} ${headerH} L 0 ${headerH} Z" fill="${headerColor}"/>
        <text x="${entWidth / 2}" y="21" text-anchor="middle" font-weight="700" font-size="13" fill="#ffffff">${esc(ent.name)}</text>
        
        ${isDraftFrom ? `<rect x="${entWidth - 66}" y="6" width="60" height="20" rx="4" fill="#064e3b"/><text x="${entWidth - 36}" y="19" text-anchor="middle" font-size="9" font-weight="800" fill="#a7f3d0">SOURCE</text>` : ''}
        ${isDraftTo ? `<rect x="${entWidth - 66}" y="6" width="60" height="20" rx="4" fill="#4c1d95"/><text x="${entWidth - 36}" y="19" text-anchor="middle" font-size="9" font-weight="800" fill="#ddd6fe">TARGET</text>` : ''}
`;

      if (ent.attributes.length === 0) {
        innerContent += `<text x="14" y="${headerH + 20}" font-size="11.5" fill="#94a3b8" font-style="italic">No attributes</text>`;
      } else {
        ent.attributes.forEach((attr, idx) => {
          const rowY = headerH + 6 + idx * rowH;
          if (idx % 2 === 1) {
            innerContent += `<rect x="1" y="${rowY}" width="${entWidth - 2}" height="${rowH}" fill="#f8fafc"/>`;
          }

          let badgeX = entWidth - 10;
          if (attr.isPk) {
            badgeX -= 26;
            innerContent += `<rect x="${badgeX}" y="${rowY + 2}" width="24" height="15" rx="3.5" fill="#eff6ff" stroke="#3b82f6" stroke-width="1"/>
              <text x="${badgeX + 12}" y="${rowY + 13}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#2563eb">PK</text>`;
          }
          if (attr.isFk) {
            badgeX -= 26;
            innerContent += `<rect x="${badgeX}" y="${rowY + 2}" width="24" height="15" rx="3.5" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1"/>
              <text x="${badgeX + 12}" y="${rowY + 13}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#7c3aed">FK</text>`;
          }

          innerContent += `<text x="12" y="${rowY + 16}" font-family="ui-monospace,Menlo,monospace" font-size="11.5" fill="#475569"><tspan fill="#64748b" font-size="10.5">${esc(attr.type)} </tspan><tspan font-weight="600" fill="#0f172a">${esc(attr.name)}</tspan></text>`;
        });
      }

      innerContent += `</g>`;
    });

    if (interactive) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" class="erd-svg-canvas" style="font-family:Inter,system-ui,-apple-system,sans-serif; user-select:none; display:block;">
        <rect id="erd-bg-rect" width="100%" height="100%" fill="transparent"/>
        <g id="erd-zoom-layer" class="erd-viewport-g" transform="translate(${panX}, ${panY}) scale(${zoom})">
          ${innerContent}
        </g>
      </svg>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxX} ${viewBoxY} ${viewBoxW} ${viewBoxH}" width="100%" height="100%" class="erd-svg-canvas" style="font-family:Inter,system-ui,-apple-system,sans-serif; user-select:none;">
      ${innerContent}
    </svg>`;
  };

  const getElementCodeSnippet = (model, selectedType, selectedId, relDraft = null) => {
    if (selectedType === "creating_relationship" && relDraft) {
      const from = relDraft.from || "[SOURCE]";
      const to = relDraft.to || "[TARGET]";
      const card = relDraft.cardinality || "||--o{";
      const lbl = relDraft.label ? relDraft.label.replace(/\s+/g, "_") : "relates";
      return `%% Creating New Relationship:\n${from} ${card} ${to} : ${lbl}`;
    }

    if (!selectedType || !selectedId) {
      return generateMermaidERD(model);
    }

    if (selectedType === "entity") {
      const ent = model.entities.find(e => e.name === selectedId);
      if (!ent) return "";
      let code = `${ent.name} {\n`;
      for (const attr of ent.attributes) {
        const pkFk = [attr.isPk ? "PK" : "", attr.isFk ? "FK" : ""].filter(Boolean).join(" ");
        code += `    ${attr.type || "string"} ${attr.name}${pkFk ? " " + pkFk : ""}\n`;
      }
      code += `}\n`;

      const rels = model.relationships.filter(r => r.from === ent.name || r.to === ent.name);
      if (rels.length > 0) {
        code += `\n%% Relationships involving ${ent.name}:\n`;
        rels.forEach(r => {
          code += `${r.from} ${r.cardinality} ${r.to} : ${r.label}\n`;
        });
      }
      return code;
    }

    if (selectedType === "relationship") {
      const rel = model.relationships.find(r => r.id === selectedId);
      if (!rel) return "";
      return `${rel.from} ${rel.cardinality} ${rel.to} : ${rel.label}`;
    }

    return "";
  };

  /* =========================================================================
     2. DFD & FLOWCHART MODEL, PARSER & GENERATORS
     ========================================================================= */

  const parseMermaidDFD = (code, title = "Data Flow Diagram") => {
    const lines = code.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("%%"));
    const elementsMap = new Map();
    const flows = [];
    let flowCounter = 1;

    for (const line of lines) {
      if (line.toLowerCase().startsWith("flowchart") || line.toLowerCase().startsWith("graph")) continue;

      // Extract all node definitions with labels: ID[(Store)] or ID[Process] or ID((External)) or ID([Label])
      const nodeDefs = line.matchAll(/([A-Za-z0-9_]+)\s*(?:\[\(([^)]*)\)\]|\[([^\]]*)\]|\(\[([^\]]*)\]\)|\(\(([^)]*)\)\)|\{([^}]*)\})/g);
      for (const m of nodeDefs) {
        const id = m[1];
        const isStore = line.includes(`${id}[(`) || line.includes(`${id} [(`);
        const rawLabel = m[2] || m[3] || m[4] || m[5] || m[6] || id;
        if (!elementsMap.has(id)) {
          let kind = "process";
          if (isStore || id.toLowerCase().includes("store") || rawLabel.toLowerCase().includes("store")) {
            kind = "store";
          } else if (id.toLowerCase().includes("user") || id.toLowerCase().includes("customer") || id.toLowerCase().includes("student") || id.toLowerCase().includes("external") || id.toLowerCase().includes("provider") || id.toLowerCase().includes("shopper") || id.toLowerCase().includes("admin") || id.toLowerCase().includes("fulfillment")) {
            kind = "external";
          }
          elementsMap.set(id, { id, name: id, label: rawLabel.trim(), kind });
        }
      }

      // Check arrow connections: A[Label] -->|label| B[Label] or A --> B
      const flowRegex = /([A-Za-z0-9_]+)(?:\s*(?:\[\([^\)]*\)\]|\[[^\]]*\]|\(\[[^\]]*\]\)|\([^\)]*\)|\{[^\}]*\}))?\s*(?:-->|--+)\s*(?:\|([^|]+)\|)?\s*([A-Za-z0-9_]+)/g;
      let fm;
      while ((fm = flowRegex.exec(line)) !== null) {
        const fromId = fm[1].trim();
        const flowLabel = (fm[2] || "").trim();
        const toId = fm[3].trim();
        flows.push({
          id: `flow-${flowCounter++}`,
          from: fromId,
          to: toId,
          label: flowLabel || "Data Flow",
          direction: "forward"
        });

        if (!elementsMap.has(fromId)) {
          elementsMap.set(fromId, { id: fromId, name: fromId, label: fromId, kind: "process" });
        }
        if (!elementsMap.has(toId)) {
          elementsMap.set(toId, { id: toId, name: toId, label: toId, kind: "process" });
        }
      }
    }

    const elements = Array.from(elementsMap.values());
    const cols = Math.min(3, Math.ceil(Math.sqrt(Math.max(1, elements.length))));
    elements.forEach((el, idx) => {
      el.x = 60 + (idx % cols) * 260;
      el.y = 60 + Math.floor(idx / cols) * 180;
      el.width = 180;
      el.height = 70;
    });

    return {
      type: "dfd",
      title,
      elements,
      flows
    };
  };

  const generateMermaidDFD = model => {
    let output = "flowchart LR\n";
    for (const el of model.elements) {
      if (el.kind === "store") {
        output += `    ${el.id}[(${el.label || el.name})]\n`;
      } else if (el.kind === "external") {
        output += `    ${el.id}[${el.label || el.name}]\n`;
      } else {
        output += `    ${el.id}[${el.label || el.name}]\n`;
      }
    }
    for (const fl of model.flows) {
      if (fl.label) {
        output += `    ${fl.from} -->|${fl.label}| ${fl.to}\n`;
      } else {
        output += `    ${fl.from} --> ${fl.to}\n`;
      }
    }
    return output;
  };

  const generateDrawioDFD = model => {
    let cells = `<mxCell id="0"/><mxCell id="1" parent="0"/>`;
    model.elements.forEach(el => {
      let shapeStyle = "rounded=1;whiteSpace=wrap;html=1;fillColor=#eff6ff;strokeColor=#3b82f6;fontFamily=Inter;";
      if (el.kind === "store") {
        shapeStyle = "shape=cylinder;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;fillColor=#fef3c7;strokeColor=#f59e0b;fontFamily=Inter;";
      } else if (el.kind === "external") {
        shapeStyle = "rounded=0;whiteSpace=wrap;html=1;fillColor=#f1f5f9;strokeColor=#64748b;fontFamily=Inter;fontStyle=1;";
      }
      cells += `<mxCell id="node-${el.id}" value="${esc(el.label || el.name)}" style="${shapeStyle}" vertex="1" parent="1">
        <mxGeometry x="${el.x || 60}" y="${el.y || 60}" width="${el.width || 160}" height="${el.height || 60}" as="geometry"/>
      </mxCell>`;
    });

    model.flows.forEach((fl, idx) => {
      cells += `<mxCell id="edge-${idx + 1}" value="${esc(fl.label || '')}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#2563eb;strokeWidth=1.5;" edge="1" source="node-${fl.from}" target="node-${fl.to}" parent="1">
        <mxGeometry relative="1" as="geometry"/>
      </mxCell>`;
    });

    return `<mxfile host="ComponentHub"><diagram name="${esc(model.title || 'DFD')}"><mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1"><root>${cells}</root></mxGraphModel></diagram></mxfile>`;
  };

  const generateSvgDFD = (model, { interactive = false, selectedId = null, selectedType = null, zoom = 1, panX = 0, panY = 0, draftFlow = null } = {}) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    model.elements.forEach(el => {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + (el.width || 180));
      maxY = Math.max(maxY, el.y + (el.height || 70));
    });
    if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 700; maxY = 450; }

    const pad = 60;
    const viewBoxX = Math.max(0, minX - pad);
    const viewBoxY = Math.max(0, minY - pad);
    const viewBoxW = Math.max(760, (maxX - minX) + pad * 2);
    const viewBoxH = Math.max(480, (maxY - minY) + pad * 2);

    let innerContent = `<defs>
      <marker id="dfd-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563eb"/>
      </marker>
      <filter id="dfd-shadow" x="-8%" y="-8%" width="116%" height="116%">
        <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.08"/>
      </filter>
      <filter id="dfd-highlight" x="-12%" y="-12%" width="124%" height="124%">
        <feDropShadow dx="0" dy="0" stdDeviation="7" flood-color="#2563eb" flood-opacity="0.6"/>
      </filter>
    </defs>`;

    const elMap = new Map(model.elements.map(e => [e.id, e]));

    // Render Flows
    model.flows.forEach(fl => {
      const fromEl = elMap.get(fl.from);
      const toEl = elMap.get(fl.to);
      if (!fromEl || !toEl) return;

      const isSelected = selectedType === "flow" && selectedId === fl.id;
      const strokeColor = isSelected ? "#2563eb" : "#475569";
      const strokeWidth = isSelected ? "2.5" : "1.8";

      const sx = fromEl.x + (fromEl.width || 180) / 2;
      const sy = fromEl.y + (fromEl.height || 70) / 2;
      const tx = toEl.x + (toEl.width || 180) / 2;
      const ty = toEl.y + (toEl.height || 70) / 2;

      let x1 = sx, y1 = sy, x2 = tx, y2 = ty;
      const dx = tx - sx;
      const dy = ty - sy;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) { x1 = fromEl.x + (fromEl.width || 180); x2 = toEl.x; }
        else { x1 = fromEl.x; x2 = toEl.x + (toEl.width || 180); }
        y1 = sy; y2 = ty;
      } else {
        if (dy > 0) { y1 = fromEl.y + (fromEl.height || 70); y2 = toEl.y; }
        else { y1 = fromEl.y; y2 = toEl.y + (toEl.height || 70); }
        x1 = sx; x2 = tx;
      }

      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;

      innerContent += `<g class="dfd-flow-group" data-flow-id="${fl.id}" style="cursor:pointer;">
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${strokeColor}" stroke-width="${strokeWidth}" marker-end="url(#dfd-arrow)"/>
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="transparent" stroke-width="18"/>
        <rect x="${mx - 45}" y="${my - 11}" width="90" height="22" rx="5" fill="#ffffff" stroke="${isSelected ? '#2563eb' : '#cbd5e1'}" stroke-width="${isSelected ? '2' : '1'}"/>
        <text x="${mx}" y="${my + 4}" text-anchor="middle" font-size="11" font-weight="600" fill="${isSelected ? '#2563eb' : '#334155'}">${esc(fl.label || 'Data')}</text>
      </g>`;
    });

    // Preview draft flow
    if (selectedType === "creating_flow" && draftFlow && draftFlow.from && draftFlow.to) {
      const fromEl = elMap.get(draftFlow.from);
      const toEl = elMap.get(draftFlow.to);
      if (fromEl && toEl) {
        const sx = fromEl.x + (fromEl.width || 180) / 2;
        const sy = fromEl.y + (fromEl.height || 70) / 2;
        const tx = toEl.x + (toEl.width || 180) / 2;
        const ty = toEl.y + (toEl.height || 70) / 2;
        innerContent += `<g class="dfd-preview-flow">
          <line x1="${sx}" y1="${sy}" x2="${tx}" y2="${ty}" stroke="#10b981" stroke-width="2.5" stroke-dasharray="6,4"/>
        </g>`;
      }
    }

    // Render Elements
    model.elements.forEach(el => {
      const isSelected = selectedType === "element" && selectedId === el.id;
      const isDraftFrom = selectedType === "creating_flow" && draftFlow && draftFlow.from === el.id;
      const isDraftTo = selectedType === "creating_flow" && draftFlow && draftFlow.to === el.id;

      let stroke = isSelected ? "#2563eb" : (el.kind === "store" ? "#d97706" : (el.kind === "external" ? "#475569" : "#3b82f6"));
      let fill = el.kind === "store" ? "#fef3c7" : (el.kind === "external" ? "#f8fafc" : "#eff6ff");
      let filter = isSelected ? 'filter="url(#dfd-highlight)"' : 'filter="url(#dfd-shadow)"';

      if (isDraftFrom) { stroke = "#10b981"; fill = "#ecfdf5"; }
      if (isDraftTo) { stroke = "#8b5cf6"; fill = "#f5f3ff"; }

      const w = el.width || 180;
      const h = el.height || 70;

      innerContent += `<g class="dfd-element-group" data-element-id="${el.id}" transform="translate(${el.x}, ${el.y})" ${filter} style="cursor:${selectedType === 'creating_flow' ? 'pointer' : (interactive ? 'grab' : 'pointer')};">`;

      if (el.kind === "store") {
        innerContent += `
          <path d="M 0 12 C 0 4, ${w} 4, ${w} 12 L ${w} ${h - 12} C ${w} ${h - 4}, 0 ${h - 4}, 0 ${h - 12} Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
          <ellipse cx="${w / 2}" cy="12" rx="${w / 2}" ry="8" fill="#fde68a" stroke="${stroke}" stroke-width="1.5"/>
          <text x="${w / 2}" y="${h / 2 + 6}" text-anchor="middle" font-size="12" font-weight="700" fill="#92400e">${esc(el.label || el.name)}</text>
        `;
      } else if (el.kind === "external") {
        innerContent += `
          <rect x="0" y="0" width="${w}" height="${h}" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
          <rect x="0" y="0" width="${w}" height="22" rx="4" fill="#64748b"/>
          <text x="${w / 2}" y="15" text-anchor="middle" font-size="10.5" font-weight="700" fill="#ffffff">EXTERNAL ENTITY</text>
          <text x="${w / 2}" y="${h / 2 + 14}" text-anchor="middle" font-size="12" font-weight="700" fill="#1e293b">${esc(el.label || el.name)}</text>
        `;
      } else {
        innerContent += `
          <rect x="0" y="0" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
          <rect x="0" y="0" width="${w}" height="22" rx="10" fill="#3b82f6"/>
          <text x="${w / 2}" y="15" text-anchor="middle" font-size="10.5" font-weight="700" fill="#ffffff">PROCESS</text>
          <text x="${w / 2}" y="${h / 2 + 14}" text-anchor="middle" font-size="12" font-weight="700" fill="#1e3a8a">${esc(el.label || el.name)}</text>
        `;
      }

      innerContent += `</g>`;
    });

    if (interactive) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" class="erd-svg-canvas" style="font-family:Inter,system-ui,sans-serif; user-select:none; display:block;">
        <rect id="erd-bg-rect" width="100%" height="100%" fill="transparent"/>
        <g id="erd-zoom-layer" class="erd-viewport-g" transform="translate(${panX}, ${panY}) scale(${zoom})">${innerContent}</g>
      </svg>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxX} ${viewBoxY} ${viewBoxW} ${viewBoxH}" width="100%" height="100%" class="erd-svg-canvas" style="font-family:Inter,system-ui,sans-serif; user-select:none;">${innerContent}</svg>`;
  };

  /* =========================================================================
     3. UML CLASS DIAGRAM MODEL, PARSER & GENERATORS
     ========================================================================= */

  const parseMermaidClass = (code, title = "UML Class Diagram") => {
    const lines = code.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("%%"));
    const classesMap = new Map();
    const relationships = [];
    let currentClass = null;
    let relCounter = 1;

    for (const line of lines) {
      if (line.toLowerCase().startsWith("classdiagram")) continue;

      if (line.startsWith("class ") && line.includes("{")) {
        const name = line.replace("class ", "").split("{")[0].trim();
        if (!classesMap.has(name)) {
          classesMap.set(name, { id: name, name, attributes: [], operations: [] });
        }
        currentClass = classesMap.get(name);
        continue;
      }

      if (line === "}" && currentClass) {
        currentClass = null;
        continue;
      }

      if (currentClass) {
        if (line.includes("(") && line.includes(")")) {
          const vis = ["+", "-", "#", "~"].includes(line[0]) ? line[0] : "+";
          const text = ["+", "-", "#", "~"].includes(line[0]) ? line.slice(1).trim() : line.trim();
          currentClass.operations.push({ visibility: vis, name: text, returnType: "void" });
        } else {
          const vis = ["+", "-", "#", "~"].includes(line[0]) ? line[0] : "+";
          const text = ["+", "-", "#", "~"].includes(line[0]) ? line.slice(1).trim() : line.trim();
          currentClass.attributes.push({ visibility: vis, name: text, type: "string" });
        }
        continue;
      }

      if (line.startsWith("class ") && !line.includes("{") && !line.includes("<|--") && !line.includes("-->")) {
        const name = line.replace("class ", "").trim();
        if (!classesMap.has(name)) {
          classesMap.set(name, { id: name, name, attributes: [], operations: [] });
        }
        continue;
      }

      const relMatch = line.match(/^([A-Za-z0-9_]+)\s*(<\|--|\*--|o--|-->|\.\.>)\s*([A-Za-z0-9_]+)(?:\s*:\s*(.*))?$/);
      if (relMatch) {
        const [, from, rawType, to, rawLbl] = relMatch;
        let type = "association";
        if (rawType === "<|--") type = "inheritance";
        else if (rawType === "*--") type = "composition";
        else if (rawType === "o--") type = "aggregation";
        else if (rawType === "..>") type = "dependency";

        relationships.push({
          id: `rel-${relCounter++}`,
          from: from.trim(),
          to: to.trim(),
          type,
          rawType,
          label: (rawLbl || "").trim()
        });

        if (!classesMap.has(from.trim())) classesMap.set(from.trim(), { id: from.trim(), name: from.trim(), attributes: [], operations: [] });
        if (!classesMap.has(to.trim())) classesMap.set(to.trim(), { id: to.trim(), name: to.trim(), attributes: [], operations: [] });
      }
    }

    const classes = Array.from(classesMap.values());
    const cols = Math.min(3, Math.ceil(Math.sqrt(Math.max(1, classes.length))));
    classes.forEach((cls, idx) => {
      cls.x = 60 + (idx % cols) * 260;
      cls.y = 60 + Math.floor(idx / cols) * 220;
      cls.width = 210;
      cls.height = Math.max(100, 44 + (cls.attributes.length + cls.operations.length) * 22);
    });

    return {
      type: "class",
      title,
      classes,
      relationships
    };
  };

  const generateMermaidClass = model => {
    let output = "classDiagram\n";
    for (const cls of model.classes) {
      output += `    class ${cls.name} {\n`;
      for (const attr of cls.attributes) {
        output += `        ${attr.visibility || "+"}${attr.name}\n`;
      }
      for (const op of cls.operations) {
        output += `        ${op.visibility || "+"}${op.name.includes("()") ? op.name : op.name + "()"}\n`;
      }
      output += `    }\n`;
    }
    for (const rel of model.relationships) {
      let arrow = "-->";
      if (rel.type === "inheritance" || rel.rawType === "<|--") arrow = "<|--";
      else if (rel.type === "composition" || rel.rawType === "*--") arrow = "*--";
      else if (rel.type === "aggregation" || rel.rawType === "o--") arrow = "o--";
      else if (rel.type === "dependency" || rel.rawType === "..>") arrow = "..>";

      output += `    ${rel.from} ${arrow} ${rel.to}${rel.label ? " : " + rel.label : ""}\n`;
    }
    return output;
  };

  const generateDrawioClass = model => {
    let cells = `<mxCell id="0"/><mxCell id="1" parent="0"/>`;
    model.classes.forEach(cls => {
      const attrLines = cls.attributes.map(a => `${a.visibility || "+"} ${a.name}`).join("&#xa;");
      const opLines = cls.operations.map(o => `${o.visibility || "+"} ${o.name}`).join("&#xa;");
      const label = `${cls.name}&#xa;--&#xa;${attrLines || "+ id: int"}&#xa;--&#xa;${opLines || "+ init()"}`;

      cells += `<mxCell id="class-${cls.name}" value="${esc(label)}" style="swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=26;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;fillColor=#eff6ff;strokeColor=#3b82f6;fontFamily=Inter;" vertex="1" parent="1">
        <mxGeometry x="${cls.x || 60}" y="${cls.y || 60}" width="${cls.width || 200}" height="${cls.height || 120}" as="geometry"/>
      </mxCell>`;
    });

    model.relationships.forEach((rel, idx) => {
      cells += `<mxCell id="edge-${idx + 1}" value="${esc(rel.label || '')}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#2563eb;strokeWidth=1.5;" edge="1" source="class-${rel.from}" target="class-${rel.to}" parent="1">
        <mxGeometry relative="1" as="geometry"/>
      </mxCell>`;
    });

    return `<mxfile host="ComponentHub"><diagram name="${esc(model.title || 'UML Class Diagram')}"><mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1"><root>${cells}</root></mxGraphModel></diagram></mxfile>`;
  };

  const generateSvgClass = (model, { interactive = false, selectedId = null, selectedType = null, zoom = 1, panX = 0, panY = 0 } = {}) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    model.classes.forEach(c => {
      minX = Math.min(minX, c.x);
      minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x + (c.width || 210));
      maxY = Math.max(maxY, c.y + (c.height || 120));
    });
    if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 700; maxY = 450; }

    const pad = 60;
    const viewBoxX = Math.max(0, minX - pad);
    const viewBoxY = Math.max(0, minY - pad);
    const viewBoxW = Math.max(760, (maxX - minX) + pad * 2);
    const viewBoxH = Math.max(480, (maxY - minY) + pad * 2);

    let innerContent = `<defs>
      <marker id="class-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563eb"/>
      </marker>
      <marker id="class-inherit" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
        <polygon points="0 1, 11 6, 0 11" fill="#ffffff" stroke="#2563eb" stroke-width="1.5"/>
      </marker>
      <filter id="class-shadow" x="-8%" y="-8%" width="116%" height="116%">
        <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.1"/>
      </filter>
      <filter id="class-highlight" x="-12%" y="-12%" width="124%" height="124%">
        <feDropShadow dx="0" dy="0" stdDeviation="7" flood-color="#2563eb" flood-opacity="0.6"/>
      </filter>
    </defs>`;

    const clsMap = new Map(model.classes.map(c => [c.name, c]));

    model.relationships.forEach(rel => {
      const fromCls = clsMap.get(rel.from);
      const toCls = clsMap.get(rel.to);
      if (!fromCls || !toCls) return;

      const isSelected = selectedType === "relationship" && selectedId === rel.id;
      const sx = fromCls.x + (fromCls.width || 210) / 2;
      const sy = fromCls.y + (fromCls.height || 120) / 2;
      const tx = toCls.x + (toCls.width || 210) / 2;
      const ty = toCls.y + (toCls.height || 120) / 2;

      let x1 = sx, y1 = sy, x2 = tx, y2 = ty;
      const dx = tx - sx;
      const dy = ty - sy;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) { x1 = fromCls.x + (fromCls.width || 210); x2 = toCls.x; }
        else { x1 = fromCls.x; x2 = toCls.x + (toCls.width || 210); }
        y1 = sy; y2 = ty;
      } else {
        if (dy > 0) { y1 = fromCls.y + (fromCls.height || 120); y2 = toCls.y; }
        else { y1 = fromCls.y; y2 = toCls.y + (toCls.height || 120); }
        x1 = sx; x2 = tx;
      }

      const marker = rel.type === "inheritance" ? "url(#class-inherit)" : "url(#class-arrow)";
      innerContent += `<g class="class-rel-group" data-rel-id="${rel.id}" style="cursor:pointer;">
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${isSelected ? '#2563eb' : '#475569'}" stroke-width="${isSelected ? '2.5' : '1.8'}" marker-end="${marker}"/>
      </g>`;
    });

    model.classes.forEach(cls => {
      const isSelected = selectedType === "class" && selectedId === cls.name;
      const w = cls.width || 210;
      const headerH = 28;
      const totalH = Math.max(cls.height || 100, headerH + (cls.attributes.length + cls.operations.length + 2) * 20 + 10);
      cls.height = totalH;

      innerContent += `<g class="class-card-group" data-class-name="${cls.name}" transform="translate(${cls.x}, ${cls.y})" filter="url(#${isSelected ? 'class-highlight' : 'class-shadow'})" style="cursor:${interactive ? 'grab' : 'pointer'};">
        <rect x="0" y="0" width="${w}" height="${totalH}" rx="6" fill="#ffffff" stroke="${isSelected ? '#2563eb' : '#cbd5e1'}" stroke-width="${isSelected ? '2.5' : '1.5'}"/>
        <path d="M 0 6 Q 0 0 6 0 L ${w - 6} 0 Q ${w} 0 ${w} 6 L ${w} ${headerH} L 0 ${headerH} Z" fill="#2563eb"/>
        <text x="${w / 2}" y="19" text-anchor="middle" font-weight="700" font-size="12.5" fill="#ffffff">${esc(cls.name)}</text>
      `;

      let curY = headerH + 16;
      cls.attributes.forEach(attr => {
        innerContent += `<text x="10" y="${curY}" font-family="ui-monospace,Menlo,monospace" font-size="11" fill="#334155">${esc(attr.visibility || '+')} ${esc(attr.name)}</text>`;
        curY += 20;
      });

      innerContent += `<line x1="0" y1="${curY - 4}" x2="${w}" y2="${curY - 4}" stroke="#e2e8f0" stroke-width="1"/>`;
      curY += 12;

      cls.operations.forEach(op => {
        innerContent += `<text x="10" y="${curY}" font-family="ui-monospace,Menlo,monospace" font-size="11" fill="#0369a1">${esc(op.visibility || '+')} ${esc(op.name)}()</text>`;
        curY += 20;
      });

      innerContent += `</g>`;
    });

    if (interactive) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" class="erd-svg-canvas" style="font-family:Inter,system-ui,sans-serif; user-select:none; display:block;">
        <rect id="erd-bg-rect" width="100%" height="100%" fill="transparent"/>
        <g id="erd-zoom-layer" class="erd-viewport-g" transform="translate(${panX}, ${panY}) scale(${zoom})">${innerContent}</g>
      </svg>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxX} ${viewBoxY} ${viewBoxW} ${viewBoxH}" width="100%" height="100%" class="erd-svg-canvas" style="font-family:Inter,system-ui,sans-serif; user-select:none;">${innerContent}</svg>`;
  };

  /* =========================================================================
     4. UNIFIED DISPATCHER FOR ALL DIAGRAM TYPES
     ========================================================================= */

  const parseDiagram = (code, type = "erd", title = "Diagram") => {
    switch (type) {
      case "erd":
        return parseMermaidERD(code, title);
      case "dfd":
      case "deployment":
      case "c4":
      case "mvc":
      case "component":
      case "activity":
      case "usecase":
        return parseMermaidDFD(code, title);
      case "class":
        return parseMermaidClass(code, title);
      default:
        if (code.startsWith("erDiagram") || code.startsWith("erdiagram")) {
          return parseMermaidERD(code, title);
        }
        if (code.startsWith("classDiagram") || code.startsWith("classdiagram")) {
          return parseMermaidClass(code, title);
        }
        return parseMermaidDFD(code, title);
    }
  };

  const generateMermaid = model => {
    if (!model) return "";
    if (model.type === "erd") return generateMermaidERD(model);
    if (model.type === "class") return generateMermaidClass(model);
    return generateMermaidDFD(model);
  };

  const generateDrawio = model => {
    if (!model) return "";
    if (model.type === "erd") return generateDrawioERD(model);
    if (model.type === "class") return generateDrawioClass(model);
    return generateDrawioDFD(model);
  };

  const generateSvg = (model, options = {}) => {
    if (!model) return "<svg></svg>";
    if (model.type === "erd") return generateSvgERD(model, options);
    if (model.type === "class") return generateSvgClass(model, options);
    return generateSvgDFD(model, options);
  };

  /* =========================================================================
     5. DRAW.IO INSPIRED INTERACTIVE EDITOR MODAL ENGINE
     ========================================================================= */

  const open = ({
    initialMermaid = "",
    title = "Diagram",
    component = null,
    activeArtifact = null,
    artifacts = [],
    variantName = "Default",
    onSave = null,
    isCataloguer = false
  }) => {
    const detectedType = detectDiagramType(
      initialMermaid || activeArtifact?.content,
      component?.name || title,
      component?.tech || component?.notation,
      "",
      activeArtifact?.artifactFormat
    );
    const meta = DIAGRAM_META[detectedType] || DIAGRAM_META.generic;

    let model = parseDiagram(initialMermaid || activeArtifact?.content || "", detectedType, title);
    const originalSeedCode = initialMermaid || activeArtifact?.content || "";

    const historyStack = [JSON.parse(JSON.stringify(model))];
    let historyIdx = 0;
    let isDirty = false;

    let selectedType = model.entities?.[0] ? "entity" : (model.elements?.[0] ? "element" : (model.classes?.[0] ? "class" : null));
    let selectedId = model.entities?.[0]?.name || model.elements?.[0]?.id || model.classes?.[0]?.name || null;
    let activeTab = "canvas";
    let activeInspectorTab = "properties"; // properties, arrange, code

    let isCreatingConnection = false;
    let connDraft = {
      from: null,
      to: null,
      label: "relates",
      cardinality: "||--o{",
      type: "association"
    };

    let zoom = 1.0;
    let panX = 0;
    let panY = 0;

    const isSourceType = detectedType === "source";

    // Build Draw.io Inspired Modal Window
    const modal = document.createElement("div");
    modal.className = "drawio-editor-backdrop";
    modal.innerHTML = `
      <div class="drawio-editor-window">
        <!-- Draw.io Menu & Title Bar -->
        <header class="drawio-topbar">
          <div class="drawio-topbar-left">
            <div class="drawio-logo-badge">
              <span class="drawio-logo-icon">${isSourceType ? '📄' : '📊'}</span>
              <b>ComponentHub</b>
              <span class="drawio-type-tag">${esc(meta.badge)}</span>
            </div>
            <div class="drawio-title-block">
              <span class="drawio-diagram-title">${esc(title)}</span>
              <span class="drawio-dirty-badge ${isDirty ? 'dirty' : 'clean'}" id="drawio-dirty-indicator">
                ${isDirty ? '● Unsaved changes' : '✓ Saved'}
              </span>
            </div>
          </div>

          <!-- Mode / Format Tabs -->
          <div class="drawio-view-tabs">
            ${isSourceType ? `
              <button class="drawio-view-tab on" data-tab="source">📄 ${esc((activeArtifact?.artifactFormat || "Source").toUpperCase())} Editor</button>
            ` : `
              <button class="drawio-view-tab on" data-tab="canvas">🎨 Canvas View</button>
              <button class="drawio-view-tab" data-tab="mermaid">📄 Mermaid Source</button>
              <button class="drawio-view-tab" data-tab="drawio">📦 Draw.io XML</button>
              <button class="drawio-view-tab" data-tab="svg">📐 SVG Vector</button>
            `}
          </div>

          <!-- Top Actions -->
          <div class="drawio-topbar-actions">
            <div class="drawio-btn-group">
              <button class="drawio-btn" id="drawio-undo-btn" title="Undo (Ctrl+Z)" disabled>↶</button>
              <button class="drawio-btn" id="drawio-redo-btn" title="Redo (Ctrl+Y)" disabled>↷</button>
            </div>
            <div class="drawio-dropdown">
              <button class="drawio-btn" id="drawio-export-btn">💾 Export ▾</button>
              <div class="drawio-dropdown-menu" id="drawio-export-menu" hidden>
                ${isSourceType ? `
                  <a href="#" id="dl-src-direct">Download File (${esc(activeArtifact?.downloadFilename || "source.txt")})</a>
                ` : `
                  <a href="#" id="dl-mmd">Mermaid Source (.mmd)</a>
                  <a href="#" id="dl-svg">Vector Graphic (.svg)</a>
                  <a href="#" id="dl-png">PNG Image (.png)</a>
                  <a href="#" id="dl-drawio">Draw.io XML (.drawio)</a>
                `}
              </div>
            </div>
            <button class="drawio-btn" id="drawio-reset-btn" title="Reset unsaved changes to original state">↺ Reset</button>
            <button class="drawio-btn drawio-primary-btn" id="drawio-apply-btn">${isCataloguer ? '💾 Save to Catalogue' : '✓ Apply Changes'}</button>
            <button class="drawio-btn drawio-close-btn" id="drawio-close-btn" title="Close Editor">✕</button>
          </div>
        </header>

        <!-- Draw.io Command Ribbon Toolbar -->
        <div class="drawio-ribbon-toolbar">
          ${isSourceType ? `
            <div class="drawio-ribbon-left">
              <button class="drawio-ribbon-btn" id="src-ribbon-copy" title="Copy complete source content">
                <span>📋</span> Copy Source
              </button>
              <button class="drawio-ribbon-btn" id="src-ribbon-wrap" title="Toggle line word wrap">
                <span>↩️</span> Word Wrap
              </button>
              <span id="src-stats" style="margin-left:14px;font-size:12px;color:#64748b;"></span>
            </div>
          ` : `
            <div class="drawio-ribbon-left">
              <button class="drawio-ribbon-btn" id="ribbon-toggle-shapes" title="Toggle Shapes Library Palette (Left)">
                <span>📐</span> Stencil Library
              </button>
              <div class="drawio-divider"></div>
              <button class="drawio-ribbon-btn" id="ribbon-add-conn" title="Create Connection / Relationship">
                <span>⚡</span> Connect Elements
              </button>
              <button class="drawio-ribbon-btn" id="ribbon-autolayout" title="Auto-Arrange Layout">
                <span>⊞</span> Auto Layout
              </button>
            </div>

            <!-- Zoom & Center Controls -->
            <div class="drawio-ribbon-center">
              <div class="drawio-zoom-pill">
                <button class="drawio-zoom-btn" id="drawio-zoom-out" title="Zoom Out">−</button>
                <span class="drawio-zoom-text" id="drawio-zoom-val">100%</span>
                <button class="drawio-zoom-btn" id="drawio-zoom-in" title="Zoom In">+</button>
                <button class="drawio-zoom-btn" id="drawio-zoom-fit" title="Fit Diagram to Canvas">⛶ Fit</button>
                <button class="drawio-zoom-btn" id="drawio-zoom-reset" title="Reset Zoom to 100%">1:1</button>
              </div>
            </div>
          `}

          <div class="drawio-ribbon-right">
            <button class="drawio-ribbon-btn" id="ribbon-toggle-inspector" title="Toggle Format & Inspector Panel (Right)">
              <span>⚙️</span> ${isSourceType ? 'File Details' : 'Format Panel'}
            </button>
          </div>
        </div>

        <!-- Main Draw.io 3-Pane Body -->
        <div class="drawio-main-body">
          <!-- Left Sidebar: Draw.io Shape Palette -->
          <aside class="drawio-sidebar-palette" id="drawio-shapes-palette" ${isSourceType ? 'style="display:none;"' : ''}>
            <div class="drawio-palette-header">
              <span><b>Shape Library</b> (${esc(meta.name)})</span>
            </div>
            <div class="drawio-palette-content" id="drawio-palette-items">
              <!-- Dynamically populated shape items -->
            </div>
          </aside>

          <!-- Center: Draw.io Vector Canvas Area -->
          <main class="drawio-canvas-area" id="drawio-canvas-pane" ${isSourceType ? 'style="display:none;"' : ''}>
            <div class="drawio-canvas-viewport" id="erd-viewport"></div>
            
            <!-- Floating Canvas Status Bar -->
            <div class="drawio-canvas-statusbar">
              <span id="drawio-status-items">Elements: 0</span>
              <span class="drawio-status-divider">|</span>
              <span id="drawio-status-selected">No element selected</span>
              <span class="drawio-status-hint">💡 Drag background to pan. Click or drag shapes to add.</span>
            </div>
          </main>

          <!-- Code Views (Mermaid, XML, SVG, Source) -->
          <div class="drawio-code-pane" id="erd-code-pane" ${isSourceType ? 'style="display:flex;flex:1;"' : 'hidden'}>
            <div class="drawio-code-header">
              <span id="erd-code-lang-label">${isSourceType ? esc((activeArtifact?.artifactFormat || "Source").toUpperCase() + " Editor") : "Source Code"}</span>
              <div style="display:flex;gap:8px;">
                ${isSourceType ? '' : '<button class="drawio-btn sm" id="erd-apply-code-btn" title="Parse and sync code back to canvas">🔄 Apply to Canvas</button>'}
                <button class="drawio-btn sm" id="erd-copy-code-btn">📋 Copy Code</button>
              </div>
            </div>
            <textarea class="drawio-code-textarea" id="erd-code-box" spellcheck="false" style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:1.6;padding:16px;"></textarea>
          </div>

          <!-- Right Sidebar: Draw.io Format & Inspector Panel -->
          <aside class="drawio-sidebar-inspector" id="drawio-inspector-pane">
            <!-- Format Panel Tabs -->
            <div class="drawio-inspector-tabs" ${isSourceType ? 'style="display:none;"' : ''}>
              <button class="drawio-insp-tab on" data-insp-tab="properties">🎨 Style & Data</button>
              <button class="drawio-insp-tab" data-insp-tab="code">💻 Live Snippet</button>
            </div>

            <div class="drawio-inspector-scrollbody">
              <div id="drawio-tab-properties">
                <div class="drawio-inspector-card" id="erd-inspector-card"></div>
              </div>
              <div id="drawio-tab-code" hidden>
                <div class="drawio-snippet-card">
                  <div class="drawio-snippet-header">
                    <span id="erd-snippet-title">Live Element Mapping</span>
                  </div>
                  <pre class="drawio-snippet-pre"><code id="erd-snippet-code"></code></pre>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // References
    const viewport = modal.querySelector("#erd-viewport");
    const inspector = modal.querySelector("#erd-inspector-card");
    const shapesPalette = modal.querySelector("#drawio-shapes-palette");
    const paletteItems = modal.querySelector("#drawio-palette-items");
    const inspectorPane = modal.querySelector("#drawio-inspector-pane");
    const snippetCode = modal.querySelector("#erd-snippet-code");
    const snippetTitle = modal.querySelector("#erd-snippet-title");
    const codePane = modal.querySelector("#erd-code-pane");
    const canvasPane = modal.querySelector("#drawio-canvas-pane");
    const codeBox = modal.querySelector("#erd-code-box");
    const codeLangLabel = modal.querySelector("#erd-code-lang-label");
    const dirtyIndicator = modal.querySelector("#drawio-dirty-indicator");
    const undoBtn = modal.querySelector("#drawio-undo-btn");
    const redoBtn = modal.querySelector("#drawio-redo-btn");
    const statusItems = modal.querySelector("#drawio-status-items");
    const statusSelected = modal.querySelector("#drawio-status-selected");

    // History Stack for Undo / Redo
    const pushState = () => {
      if (historyIdx < historyStack.length - 1) {
        historyStack.splice(historyIdx + 1);
      }
      historyStack.push(JSON.parse(JSON.stringify(model)));
      historyIdx = historyStack.length - 1;
      isDirty = true;
      dirtyIndicator.className = "drawio-dirty-badge dirty";
      dirtyIndicator.textContent = "● Unsaved changes";
      undoBtn.disabled = historyIdx <= 0;
      redoBtn.disabled = historyIdx >= historyStack.length - 1;
    };

    const handleUndo = () => {
      if (historyIdx > 0) {
        historyIdx--;
        model = JSON.parse(JSON.stringify(historyStack[historyIdx]));
        undoBtn.disabled = historyIdx <= 0;
        redoBtn.disabled = historyIdx >= historyStack.length - 1;
        renderCanvas();
      }
    };

    const handleRedo = () => {
      if (historyIdx < historyStack.length - 1) {
        historyIdx++;
        model = JSON.parse(JSON.stringify(historyStack[historyIdx]));
        undoBtn.disabled = historyIdx <= 0;
        redoBtn.disabled = historyIdx >= historyStack.length - 1;
        renderCanvas();
      }
    };

    undoBtn.onclick = handleUndo;
    redoBtn.onclick = handleRedo;

    const onKeyDown = e => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    // Zoom & Transform
    const updateTransform = () => {
      const gLayer = modal.querySelector("#erd-zoom-layer");
      if (gLayer) {
        gLayer.setAttribute("transform", `translate(${panX}, ${panY}) scale(${zoom})`);
      }
      const zoomVal = modal.querySelector("#drawio-zoom-val");
      if (zoomVal) {
        zoomVal.textContent = `${Math.round(zoom * 100)}%`;
      }
    };

    const setZoom = (targetZoom, centerScreenX, centerScreenY) => {
      const newZoom = Math.max(0.2, Math.min(3.5, targetZoom));
      const viewW = viewport.clientWidth || 800;
      const viewH = viewport.clientHeight || 560;

      const csX = centerScreenX !== undefined ? centerScreenX : viewW / 2;
      const csY = centerScreenY !== undefined ? centerScreenY : viewH / 2;

      panX = Math.round(csX - (csX - panX) * (newZoom / zoom));
      panY = Math.round(csY - (csY - panY) * (newZoom / zoom));
      zoom = newZoom;

      updateTransform();
    };

    const fitToView = () => {
      const items = model.entities || model.elements || model.classes || [];
      if (items.length === 0) return;

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      items.forEach(it => {
        minX = Math.min(minX, it.x);
        minY = Math.min(minY, it.y);
        maxX = Math.max(maxX, it.x + (it.width || 200));
        maxY = Math.max(maxY, it.y + (it.height || 100));
      });
      if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 700; maxY = 450; }

      const pad = 60;
      const diagW = Math.max(100, (maxX - minX) + pad * 2);
      const diagH = Math.max(100, (maxY - minY) + pad * 2);

      const viewW = viewport.clientWidth || 800;
      const viewH = viewport.clientHeight || 560;

      const scale = Math.min(viewW / diagW, viewH / diagH, 1.4);
      zoom = Math.max(0.25, Math.min(scale, 1.8));

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      panX = Math.round((viewW / 2) - centerX * zoom);
      panY = Math.round((viewH / 2) - centerY * zoom);

      updateTransform();
    };

    const resetZoom = () => {
      zoom = 1.0;
      fitToView();
      zoom = 1.0;
      updateTransform();
    };

    // Render Left Draw.io Shape Palette
    const renderShapePalette = () => {
      let html = "";
      if (model.type === "erd") {
        html = `
          <div class="drawio-shape-card" id="shape-add-entity">
            <div class="drawio-shape-icon"><svg width="32" height="24" viewBox="0 0 32 24"><rect width="32" height="24" rx="3" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/><rect width="32" height="8" rx="2" fill="#3b82f6"/><line x1="4" y1="13" x2="28" y2="13" stroke="#cbd5e1"/><line x1="4" y1="18" x2="28" y2="18" stroke="#cbd5e1"/></svg></div>
            <div class="drawio-shape-info"><b>Entity Table</b><small>Add new entity</small></div>
          </div>
          <div class="drawio-shape-card" id="shape-add-attr">
            <div class="drawio-shape-icon"><svg width="32" height="24" viewBox="0 0 32 24"><rect width="32" height="18" y="3" rx="3" fill="#f8fafc" stroke="#64748b" stroke-width="1.2"/><text x="16" y="15" text-anchor="middle" font-size="10" font-weight="700" fill="#2563eb">+ PK / Field</text></svg></div>
            <div class="drawio-shape-info"><b>Attribute Field</b><small>Add field to entity</small></div>
          </div>
          <div class="drawio-shape-card" id="shape-add-rel-1n">
            <div class="drawio-shape-icon"><svg width="32" height="24" viewBox="0 0 32 24"><line x1="2" y1="12" x2="30" y2="12" stroke="#2563eb" stroke-width="2"/><line x1="8" y1="6" x2="8" y2="18" stroke="#2563eb" stroke-width="2"/><path d="M 24 6 L 30 12 L 24 18" fill="none" stroke="#2563eb" stroke-width="2"/></svg></div>
            <div class="drawio-shape-info"><b>1 : N Relationship</b><small>Connect 1-to-many</small></div>
          </div>
          <div class="drawio-shape-card" id="shape-add-rel-11">
            <div class="drawio-shape-icon"><svg width="32" height="24" viewBox="0 0 32 24"><line x1="2" y1="12" x2="30" y2="12" stroke="#2563eb" stroke-width="2"/><line x1="8" y1="6" x2="8" y2="18" stroke="#2563eb" stroke-width="2"/><line x1="24" y1="6" x2="24" y2="18" stroke="#2563eb" stroke-width="2"/></svg></div>
            <div class="drawio-shape-info"><b>1 : 1 Relationship</b><small>One-to-one</small></div>
          </div>
        `;
      } else if (model.type === "dfd") {
        html = `
          <div class="drawio-shape-card" id="shape-add-process">
            <div class="drawio-shape-icon"><svg width="32" height="24" viewBox="0 0 32 24"><rect width="32" height="24" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/><text x="16" y="16" text-anchor="middle" font-size="9" font-weight="700" fill="#1e3a8a">Process</text></svg></div>
            <div class="drawio-shape-info"><b>Process Node</b><small>Computation step</small></div>
          </div>
          <div class="drawio-shape-card" id="shape-add-store">
            <div class="drawio-shape-icon"><svg width="32" height="24" viewBox="0 0 32 24"><path d="M 0 6 C 0 2, 32 2, 32 6 L 32 18 C 32 22, 0 22, 0 18 Z" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/><ellipse cx="16" cy="6" rx="16" ry="4" fill="#fde68a" stroke="#d97706" stroke-width="1"/></svg></div>
            <div class="drawio-shape-info"><b>Data Store</b><small>Database cylinder</small></div>
          </div>
          <div class="drawio-shape-card" id="shape-add-external">
            <div class="drawio-shape-icon"><svg width="32" height="24" viewBox="0 0 32 24"><rect width="32" height="24" rx="2" fill="#f1f5f9" stroke="#64748b" stroke-width="1.5"/><text x="16" y="15" text-anchor="middle" font-size="8.5" font-weight="700" fill="#334155">External</text></svg></div>
            <div class="drawio-shape-info"><b>External Entity</b><small>User / System</small></div>
          </div>
          <div class="drawio-shape-card" id="shape-add-flow">
            <div class="drawio-shape-icon"><svg width="32" height="24" viewBox="0 0 32 24"><line x1="2" y1="12" x2="26" y2="12" stroke="#2563eb" stroke-width="2"/><path d="M 22 7 L 30 12 L 22 17 Z" fill="#2563eb"/></svg></div>
            <div class="drawio-shape-info"><b>Data Flow</b><small>Directed link</small></div>
          </div>
        `;
      } else if (model.type === "class") {
        html = `
          <div class="drawio-shape-card" id="shape-add-class">
            <div class="drawio-shape-icon"><svg width="32" height="24" viewBox="0 0 32 24"><rect width="32" height="24" rx="2" fill="#ffffff" stroke="#3b82f6" stroke-width="1.5"/><rect width="32" height="7" fill="#3b82f6"/><line x1="0" y1="15" x2="32" y2="15" stroke="#cbd5e1"/></svg></div>
            <div class="drawio-shape-info"><b>Class Box</b><small>Class with methods</small></div>
          </div>
          <div class="drawio-shape-card" id="shape-add-inherit">
            <div class="drawio-shape-icon"><svg width="32" height="24" viewBox="0 0 32 24"><line x1="2" y1="12" x2="22" y2="12" stroke="#2563eb" stroke-width="2"/><polygon points="22 7, 30 12, 22 17" fill="#ffffff" stroke="#2563eb" stroke-width="1.5"/></svg></div>
            <div class="drawio-shape-info"><b>Inheritance (&lt;|--)</b><small>Generalization</small></div>
          </div>
          <div class="drawio-shape-card" id="shape-add-assoc">
            <div class="drawio-shape-icon"><svg width="32" height="24" viewBox="0 0 32 24"><line x1="2" y1="12" x2="26" y2="12" stroke="#2563eb" stroke-width="2"/><path d="M 22 7 L 30 12 L 22 17 Z" fill="#2563eb"/></svg></div>
            <div class="drawio-shape-info"><b>Association (--&gt;)</b><small>Relationship</small></div>
          </div>
        `;
      } else {
        html = `
          <div class="drawio-shape-card" id="shape-add-generic">
            <div class="drawio-shape-icon"><svg width="32" height="24" viewBox="0 0 32 24"><rect width="32" height="24" rx="4" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/><text x="16" y="15" text-anchor="middle" font-size="9" font-weight="700" fill="#2563eb">+ Node</text></svg></div>
            <div class="drawio-shape-info"><b>Add Node</b><small>New diagram node</small></div>
          </div>
          <div class="drawio-shape-card" id="shape-add-flow">
            <div class="drawio-shape-icon"><svg width="32" height="24" viewBox="0 0 32 24"><line x1="2" y1="12" x2="26" y2="12" stroke="#2563eb" stroke-width="2"/><path d="M 22 7 L 30 12 L 22 17 Z" fill="#2563eb"/></svg></div>
            <div class="drawio-shape-info"><b>Connector</b><small>Directed link</small></div>
          </div>
        `;
      }

      paletteItems.innerHTML = html;

      const genericBtn = paletteItems.querySelector("#shape-add-generic");
      if (genericBtn) {
        genericBtn.onclick = () => {
          const label = prompt("Enter Node Label:", `Node_${(model.elements?.length || 0) + 1}`);
          if (!label) return;
          const id = `Node_${Date.now().toString(36).slice(-4)}`;
          if (!model.elements) model.elements = [];
          if (!model.flows) model.flows = [];
          const idx = model.elements.length;
          const cols = 3;
          const x = 60 + (idx % cols) * 240;
          const y = 60 + Math.floor(idx / cols) * 140;
          model.elements.push({ id, name: id, label: label.trim(), kind: "process", x, y, width: 180, height: 70 });
          selectedType = "element";
          selectedId = id;
          pushState();
          renderCanvas();
        };
      }

      // Attach clicks to add shapes immediately
      const entityBtn = paletteItems.querySelector("#shape-add-entity");
      if (entityBtn) {
        entityBtn.onclick = () => {
          const name = prompt("Enter Entity Name (e.g. INVOICE):", `ENTITY_${model.entities.length + 1}`);
          if (!name) return;
          const clean = name.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
          if (model.entities.some(e => e.name === clean)) {
            alert("An entity with this name already exists.");
            return;
          }
          const idx = model.entities.length;
          const cols = 3;
          const x = 60 + (idx % cols) * 260;
          const y = 60 + Math.floor(idx / cols) * 200;
          model.entities.push({
            id: clean,
            name: clean,
            attributes: [{ id: `attr-${clean}-id`, name: `${clean.toLowerCase()}_id`, type: "int", isPk: true, isFk: false }],
            x,
            y,
            width: 200,
            height: 100
          });
          selectedType = "entity";
          selectedId = clean;
          isCreatingConnection = false;
          pushState();
          renderCanvas();
        };
      }

      const attrBtn = paletteItems.querySelector("#shape-add-attr");
      if (attrBtn) {
        attrBtn.onclick = () => {
          const ent = model.entities.find(e => e.name === selectedId) || model.entities[0];
          if (!ent) {
            alert("Create or select an entity first.");
            return;
          }
          ent.attributes.push({
            id: `attr-${ent.name}-field_${ent.attributes.length + 1}`,
            name: `field_${ent.attributes.length + 1}`,
            type: "string",
            isPk: false,
            isFk: false
          });
          selectedType = "entity";
          selectedId = ent.name;
          pushState();
          renderCanvas();
        };
      }

      const rel1nBtn = paletteItems.querySelector("#shape-add-rel-1n");
      if (rel1nBtn) {
        rel1nBtn.onclick = () => {
          if (model.entities.length < 2) { alert("At least 2 entities are required to create a relationship."); return; }
          isCreatingConnection = true;
          connDraft = { from: null, to: null, label: "relates", cardinality: "||--o{" };
          selectedType = "creating_relationship";
          renderCanvas();
        };
      }

      const rel11Btn = paletteItems.querySelector("#shape-add-rel-11");
      if (rel11Btn) {
        rel11Btn.onclick = () => {
          if (model.entities.length < 2) { alert("At least 2 entities are required to create a relationship."); return; }
          isCreatingConnection = true;
          connDraft = { from: null, to: null, label: "has_one", cardinality: "||--||" };
          selectedType = "creating_relationship";
          renderCanvas();
        };
      }

      const processBtn = paletteItems.querySelector("#shape-add-process");
      if (processBtn) {
        processBtn.onclick = () => {
          const label = prompt("Enter Process Label:", `Process_${(model.elements?.length || 0) + 1}`);
          if (!label) return;
          const id = `Process_${Date.now().toString(36).slice(-4)}`;
          if (!model.elements) model.elements = [];
          if (!model.flows) model.flows = [];
          const idx = model.elements.length;
          const cols = 3;
          const x = 60 + (idx % cols) * 240;
          const y = 60 + Math.floor(idx / cols) * 140;
          model.elements.push({ id, name: id, label: label.trim(), kind: "process", x, y, width: 180, height: 70 });
          selectedType = "element";
          selectedId = id;
          pushState();
          renderCanvas();
        };
      }

      const storeBtn = paletteItems.querySelector("#shape-add-store");
      if (storeBtn) {
        storeBtn.onclick = () => {
          const label = prompt("Enter Data Store Label:", `Store_${(model.elements?.length || 0) + 1}`);
          if (!label) return;
          const id = `Store_${Date.now().toString(36).slice(-4)}`;
          if (!model.elements) model.elements = [];
          if (!model.flows) model.flows = [];
          const idx = model.elements.length;
          const cols = 3;
          const x = 60 + (idx % cols) * 240;
          const y = 60 + Math.floor(idx / cols) * 140;
          model.elements.push({ id, name: id, label: label.trim(), kind: "store", x, y, width: 180, height: 70 });
          selectedType = "element";
          selectedId = id;
          pushState();
          renderCanvas();
        };
      }

      const extBtn = paletteItems.querySelector("#shape-add-external");
      if (extBtn) {
        extBtn.onclick = () => {
          const label = prompt("Enter External Entity Label:", `External_${(model.elements?.length || 0) + 1}`);
          if (!label) return;
          const id = `External_${Date.now().toString(36).slice(-4)}`;
          if (!model.elements) model.elements = [];
          if (!model.flows) model.flows = [];
          const idx = model.elements.length;
          const cols = 3;
          const x = 60 + (idx % cols) * 240;
          const y = 60 + Math.floor(idx / cols) * 140;
          model.elements.push({ id, name: id, label: label.trim(), kind: "external", x, y, width: 180, height: 70 });
          selectedType = "element";
          selectedId = id;
          pushState();
          renderCanvas();
        };
      }

      const flowBtn = paletteItems.querySelector("#shape-add-flow");
      if (flowBtn) {
        flowBtn.onclick = () => {
          if (model.elements && model.elements.length < 2) { alert("At least 2 elements are required to connect."); return; }
          isCreatingConnection = true;
          connDraft = { from: null, to: null, label: "Data Flow" };
          selectedType = "creating_flow";
          renderCanvas();
        };
      }

      const classBtn = paletteItems.querySelector("#shape-add-class");
      if (classBtn) {
        classBtn.onclick = () => {
          const name = prompt("Enter Class Name:", `Class_${(model.classes?.length || 0) + 1}`);
          if (!name) return;
          const clean = name.trim().replace(/[^a-zA-Z0-9_]/g, "");
          if (!model.classes) model.classes = [];
          if (!model.relationships) model.relationships = [];
          const idx = model.classes.length;
          const cols = 3;
          const x = 60 + (idx % cols) * 260;
          const y = 60 + Math.floor(idx / cols) * 220;
          model.classes.push({
            id: clean,
            name: clean,
            attributes: [{ visibility: "+", name: "id", type: "int" }],
            operations: [{ visibility: "+", name: "init", returnType: "void" }],
            x,
            y,
            width: 210,
            height: 120
          });
          selectedType = "class";
          selectedId = clean;
          pushState();
          renderCanvas();
        };
      }

      const inheritBtn = paletteItems.querySelector("#shape-add-inherit");
      if (inheritBtn) {
        inheritBtn.onclick = () => {
          if (model.classes && model.classes.length < 2) { alert("At least 2 classes are required."); return; }
          isCreatingConnection = true;
          connDraft = { from: null, to: null, type: "inheritance", label: "" };
          selectedType = "creating_class_rel";
          renderCanvas();
        };
      }

      const assocBtn = paletteItems.querySelector("#shape-add-assoc");
      if (assocBtn) {
        assocBtn.onclick = () => {
          if (model.classes && model.classes.length < 2) { alert("At least 2 classes are required."); return; }
          isCreatingConnection = true;
          connDraft = { from: null, to: null, type: "association", label: "" };
          selectedType = "creating_class_rel";
          renderCanvas();
        };
      }
    };

    // Render Canvas
    const renderCanvas = (rebuildInspector = true) => {
      renderShapePalette();

      viewport.innerHTML = generateSvg(model, {
        interactive: true,
        selectedId,
        selectedType,
        zoom,
        panX,
        panY,
        relDraft: isCreatingConnection ? connDraft : null,
        draftFlow: isCreatingConnection ? connDraft : null
      });

      const count = (model.entities?.length || 0) + (model.elements?.length || 0) + (model.classes?.length || 0);
      statusItems.textContent = `Elements: ${count}`;
      statusSelected.textContent = selectedId ? `Selected: ${selectedId}` : "No element selected";

      attachCanvasEvents();
      if (rebuildInspector) {
        updateInspector();
      }
      updateSnippet();
      updateTransform();
    };

    // Update Right Inspector Panel
    const updateInspector = () => {
      if (selectedType === "creating_relationship" || selectedType === "creating_flow" || selectedType === "creating_class_rel") {
        const isErd = model.type === "erd";
        const isClass = model.type === "class";
        const items = isErd ? model.entities.map(e => ({ id: e.name, name: e.name })) : (isClass ? model.classes.map(c => ({ id: c.name, name: c.name })) : model.elements.map(e => ({ id: e.id, name: e.label || e.name })));

        inspector.innerHTML = `
          <div class="drawio-insp-header">
            <h3><b>+ Connect Elements</b></h3>
            <span class="drawio-pill-badge">Interactive Mode</span>
          </div>
          <p class="drawio-guide-box">
            👉 Select endpoints by <b>clicking on canvas</b> or picking below:
          </p>

          <div class="drawio-field">
            <label>Source Element *</label>
            <select id="insp-draft-from" class="drawio-input">
              <option value="">-- Choose Source --</option>
              ${items.map(it => `<option value="${it.id}" ${it.id === connDraft.from ? 'selected' : ''}>${esc(it.name)}</option>`).join("")}
            </select>
          </div>

          <div class="drawio-field">
            <label>Target Element *</label>
            <select id="insp-draft-to" class="drawio-input">
              <option value="">-- Choose Target --</option>
              ${items.map(it => `<option value="${it.id}" ${it.id === connDraft.to ? 'selected' : ''} ${it.id === connDraft.from ? 'disabled' : ''}>${esc(it.name)}</option>`).join("")}
            </select>
          </div>

          ${isErd ? `
            <div class="drawio-field">
              <label>Relationship Label</label>
              <input type="text" id="insp-draft-label" value="${esc(connDraft.label || 'relates')}" class="drawio-input" placeholder="e.g. places, contains" />
            </div>
            <div class="drawio-field">
              <label>Cardinality</label>
              <select id="insp-draft-card" class="drawio-input">
                <option value="||--o{" ${connDraft.cardinality === '||--o{' ? 'selected' : ''}>One to Many (0..*)</option>
                <option value="||--|{" ${connDraft.cardinality === '||--|{' ? 'selected' : ''}>One to Many Mandatory (1..*)</option>
                <option value="||--||" ${connDraft.cardinality === '||--||' ? 'selected' : ''}>One to One (1:1)</option>
                <option value="|o--o{" ${connDraft.cardinality === '|o--o{' ? 'selected' : ''}>Zero/One to Many (0..1 to 0..*)</option>
                <option value="}|--|{" ${connDraft.cardinality === '}|--|{' ? 'selected' : ''}>Many to Many (*:*)</option>
                <option value="}|--o{" ${connDraft.cardinality === '}|--o{' ? 'selected' : ''}>Many to Many Optional (*..*)</option>
              </select>
            </div>
          ` : (isClass ? `
            <div class="drawio-field">
              <label>Relationship Type</label>
              <select id="insp-draft-type" class="drawio-input">
                <option value="association" ${connDraft.type === 'association' ? 'selected' : ''}>Association (-->)</option>
                <option value="inheritance" ${connDraft.type === 'inheritance' ? 'selected' : ''}>Inheritance (<|--)</option>
                <option value="composition" ${connDraft.type === 'composition' ? 'selected' : ''}>Composition (*--)</option>
                <option value="aggregation" ${connDraft.type === 'aggregation' ? 'selected' : ''}>Aggregation (o--)</option>
                <option value="dependency" ${connDraft.type === 'dependency' ? 'selected' : ''}>Dependency (..>)</option>
              </select>
            </div>
            <div class="drawio-field">
              <label>Label</label>
              <input type="text" id="insp-draft-label" value="${esc(connDraft.label || '')}" class="drawio-input" placeholder="e.g. handles" />
            </div>
          ` : `
            <div class="drawio-field">
              <label>Data Flow Label / Payload</label>
              <input type="text" id="insp-draft-label" value="${esc(connDraft.label || 'Data Flow')}" class="drawio-input" placeholder="e.g. Request, Payload" />
            </div>
          `)}

          <div id="insp-draft-error" class="drawio-error-box" hidden></div>

          <div class="drawio-action-row">
            <button class="drawio-btn drawio-primary-btn" id="insp-create-conn">✓ Create</button>
            <button class="drawio-btn" id="insp-cancel-conn">✕ Cancel</button>
          </div>
        `;

        const fromSelect = inspector.querySelector("#insp-draft-from");
        const toSelect = inspector.querySelector("#insp-draft-to");
        const labelInput = inspector.querySelector("#insp-draft-label");
        const errorBox = inspector.querySelector("#insp-draft-error");

        fromSelect.onchange = e => { connDraft.from = e.target.value || null; renderCanvas(); };
        toSelect.onchange = e => { connDraft.to = e.target.value || null; renderCanvas(); };
        if (labelInput) labelInput.oninput = e => { connDraft.label = e.target.value.trim(); updateSnippet(); };

        const cardSelect = inspector.querySelector("#insp-draft-card");
        if (cardSelect) cardSelect.onchange = e => { connDraft.cardinality = e.target.value; updateSnippet(); };

        const typeSelect = inspector.querySelector("#insp-draft-type");
        if (typeSelect) typeSelect.onchange = e => { connDraft.type = e.target.value; updateSnippet(); };

        inspector.querySelector("#insp-create-conn").onclick = () => {
          if (!connDraft.from || !connDraft.to) {
            errorBox.textContent = "⚠️ Please select both Source and Target endpoints.";
            errorBox.hidden = false;
            return;
          }
          if (connDraft.from === connDraft.to) {
            errorBox.textContent = "⚠️ Source and Target must be different elements.";
            errorBox.hidden = false;
            return;
          }

          if (isErd) {
            const res = createRelationship(model, connDraft);
            if (!res.success) {
              errorBox.textContent = `⚠️ ${res.error}`;
              errorBox.hidden = false;
              return;
            }
            selectedType = "relationship";
            selectedId = res.relationship.id;
          } else if (isClass) {
            const newRel = {
              id: `rel-${Date.now().toString(36)}`,
              from: connDraft.from,
              to: connDraft.to,
              type: connDraft.type || "association",
              label: connDraft.label || ""
            };
            model.relationships.push(newRel);
            selectedType = "relationship";
            selectedId = newRel.id;
          } else {
            const newFlow = {
              id: `flow-${Date.now().toString(36)}`,
              from: connDraft.from,
              to: connDraft.to,
              label: connDraft.label || "Data Flow",
              direction: "forward"
            };
            model.flows.push(newFlow);
            selectedType = "flow";
            selectedId = newFlow.id;
          }

          isCreatingConnection = false;
          pushState();
          renderCanvas();
        };

        inspector.querySelector("#insp-cancel-conn").onclick = () => {
          isCreatingConnection = false;
          connDraft = { from: null, to: null, label: "relates", cardinality: "||--o{" };
          selectedType = model.entities?.[0] ? "entity" : (model.elements?.[0] ? "element" : (model.classes?.[0] ? "class" : null));
          selectedId = model.entities?.[0]?.name || model.elements?.[0]?.id || model.classes?.[0]?.name || null;
          renderCanvas();
        };

      } else if (selectedType === "entity" && model.type === "erd") {
        const ent = model.entities.find(e => e.name === selectedId);
        if (!ent) {
          inspector.innerHTML = `<div class="muted">Select an entity on canvas to inspect details.</div>`;
          return;
        }

        inspector.innerHTML = `
          <div class="drawio-insp-header">
            <h3>Entity: <b>${esc(ent.name)}</b></h3>
            <button class="drawio-danger-btn" id="insp-del-entity">🗑 Delete</button>
          </div>
          <div class="drawio-field">
            <label>Entity Name</label>
            <input type="text" id="insp-entity-name" value="${esc(ent.name)}" class="drawio-input" />
          </div>
          <div class="drawio-attr-section">
            <div class="drawio-attr-header">
              <h4>Attributes (${ent.attributes.length})</h4>
              <button class="drawio-sm-btn" id="insp-add-attr">+ Add</button>
            </div>
            <div class="drawio-attr-list">
              ${ent.attributes.map((attr, idx) => `
                <div class="drawio-attr-row" data-idx="${idx}">
                  <input type="text" class="drawio-attr-name" value="${esc(attr.name)}" placeholder="name" />
                  <select class="drawio-attr-type">
                    ${["int", "string", "decimal", "date", "boolean", "uuid", "text", "datetime", "float"].map(t =>
                      `<option value="${t}" ${t === attr.type ? 'selected' : ''}>${t}</option>`
                    ).join("")}
                  </select>
                  <label class="drawio-chk-pill"><input type="checkbox" class="drawio-attr-pk" ${attr.isPk ? 'checked' : ''}/> PK</label>
                  <label class="drawio-chk-pill"><input type="checkbox" class="drawio-attr-fk" ${attr.isFk ? 'checked' : ''}/> FK</label>
                  <button class="drawio-del-icon" title="Delete attribute">×</button>
                </div>
              `).join("")}
            </div>
          </div>
        `;

        const nameInput = inspector.querySelector("#insp-entity-name");
        nameInput.onchange = () => {
          const newName = nameInput.value.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
          if (newName && newName !== ent.name) {
            model.relationships.forEach(r => {
              if (r.from === ent.name) r.from = newName;
              if (r.to === ent.name) r.to = newName;
            });
            ent.name = newName;
            ent.id = newName;
            selectedId = newName;
            pushState();
            renderCanvas();
          }
        };

        inspector.querySelector("#insp-del-entity").onclick = () => {
          if (!confirm(`Delete entity "${ent.name}" and all connected relationships?`)) return;
          model.entities = model.entities.filter(e => e.name !== ent.name);
          model.relationships = model.relationships.filter(r => r.from !== ent.name && r.to !== ent.name);
          selectedType = model.entities[0] ? "entity" : null;
          selectedId = model.entities[0] ? model.entities[0].name : null;
          pushState();
          renderCanvas();
        };

        inspector.querySelector("#insp-add-attr").onclick = () => {
          ent.attributes.push({
            id: `attr-${ent.name}-field_${ent.attributes.length + 1}`,
            name: `field_${ent.attributes.length + 1}`,
            type: "string",
            isPk: false,
            isFk: false
          });
          ent.height = Math.max(90, 44 + ent.attributes.length * 24);
          pushState();
          renderCanvas();
        };

        inspector.querySelectorAll(".drawio-attr-row").forEach(row => {
          const idx = Number(row.dataset.idx);
          const attr = ent.attributes[idx];
          row.querySelector(".drawio-attr-name").oninput = e => { attr.name = e.target.value.trim().replace(/[^a-zA-Z0-9_]/g, "_"); updateSnippet(); isDirty = true; };
          row.querySelector(".drawio-attr-type").onchange = e => { attr.type = e.target.value; pushState(); renderCanvas(); };
          row.querySelector(".drawio-attr-pk").onchange = e => { attr.isPk = e.target.checked; pushState(); renderCanvas(); };
          row.querySelector(".drawio-attr-fk").onchange = e => { attr.isFk = e.target.checked; pushState(); renderCanvas(); };
          row.querySelector(".drawio-del-icon").onclick = () => { ent.attributes.splice(idx, 1); pushState(); renderCanvas(); };
        });

      } else if (selectedType === "element" && model.type === "dfd") {
        const el = model.elements.find(e => e.id === selectedId);
        if (!el) {
          inspector.innerHTML = `<div class="muted">Select an element on canvas to inspect details.</div>`;
          return;
        }

        inspector.innerHTML = `
          <div class="drawio-insp-header">
            <h3>Element: <b>${esc(el.label || el.name)}</b></h3>
            <button class="drawio-danger-btn" id="insp-del-element">🗑 Delete</button>
          </div>
          <div class="drawio-field">
            <label>Display Label</label>
            <input type="text" id="insp-el-label" value="${esc(el.label || el.name)}" class="drawio-input" />
          </div>
          <div class="drawio-field">
            <label>Element Kind</label>
            <select id="insp-el-kind" class="drawio-input">
              <option value="process" ${el.kind === 'process' ? 'selected' : ''}>Process (Rounded Box)</option>
              <option value="store" ${el.kind === 'store' ? 'selected' : ''}>Data Store (Cylinder)</option>
              <option value="external" ${el.kind === 'external' ? 'selected' : ''}>External Entity (Boundary Box)</option>
            </select>
          </div>
        `;

        inspector.querySelector("#insp-el-label").oninput = e => { el.label = e.target.value.trim(); updateSnippet(); isDirty = true; };
        inspector.querySelector("#insp-el-kind").onchange = e => { el.kind = e.target.value; pushState(); renderCanvas(); };
        inspector.querySelector("#insp-del-element").onclick = () => {
          if (!confirm(`Delete element "${el.label || el.name}" and associated flows?`)) return;
          model.elements = model.elements.filter(e => e.id !== el.id);
          model.flows = model.flows.filter(f => f.from !== el.id && f.to !== el.id);
          selectedType = model.elements[0] ? "element" : null;
          selectedId = model.elements[0] ? model.elements[0].id : null;
          pushState();
          renderCanvas();
        };

      } else if (selectedType === "class" && model.type === "class") {
        const cls = model.classes.find(c => c.name === selectedId);
        if (!cls) {
          inspector.innerHTML = `<div class="muted">Select a class on canvas to inspect details.</div>`;
          return;
        }

        inspector.innerHTML = `
          <div class="drawio-insp-header">
            <h3>Class: <b>${esc(cls.name)}</b></h3>
            <button class="drawio-danger-btn" id="insp-del-class">🗑 Delete</button>
          </div>
          <div class="drawio-field">
            <label>Class Name</label>
            <input type="text" id="insp-class-name" value="${esc(cls.name)}" class="drawio-input" />
          </div>
          <div class="drawio-attr-section">
            <div class="drawio-attr-header">
              <h4>Attributes (${cls.attributes.length})</h4>
              <button class="drawio-sm-btn" id="insp-add-class-attr">+ Add</button>
            </div>
            <div class="drawio-attr-list">
              ${cls.attributes.map((a, idx) => `
                <div class="drawio-attr-row" data-attr-idx="${idx}">
                  <select class="drawio-attr-type" style="width:40px;">
                    ${["+", "-", "#", "~"].map(v => `<option value="${v}" ${v === a.visibility ? 'selected' : ''}>${v}</option>`).join("")}
                  </select>
                  <input type="text" class="drawio-class-attr-name" value="${esc(a.name)}" placeholder="attrName" style="grid-column: span 3;" />
                  <button class="drawio-del-icon">×</button>
                </div>
              `).join("")}
            </div>
          </div>
          <div class="drawio-attr-section" style="margin-top:10px;">
            <div class="drawio-attr-header">
              <h4>Operations (${cls.operations.length})</h4>
              <button class="drawio-sm-btn" id="insp-add-class-op">+ Add</button>
            </div>
            <div class="drawio-attr-list">
              ${cls.operations.map((o, idx) => `
                <div class="drawio-attr-row" data-op-idx="${idx}">
                  <select class="drawio-attr-type" style="width:40px;">
                    ${["+", "-", "#", "~"].map(v => `<option value="${v}" ${v === o.visibility ? 'selected' : ''}>${v}</option>`).join("")}
                  </select>
                  <input type="text" class="drawio-class-op-name" value="${esc(o.name)}" placeholder="methodName" style="grid-column: span 3;" />
                  <button class="drawio-del-icon">×</button>
                </div>
              `).join("")}
            </div>
          </div>
        `;

        inspector.querySelector("#insp-del-class").onclick = () => {
          if (!confirm(`Delete class "${cls.name}"?`)) return;
          model.classes = model.classes.filter(c => c.name !== cls.name);
          model.relationships = model.relationships.filter(r => r.from !== cls.name && r.to !== cls.name);
          selectedType = model.classes[0] ? "class" : null;
          selectedId = model.classes[0] ? model.classes[0].name : null;
          pushState();
          renderCanvas();
        };

        inspector.querySelector("#insp-add-class-attr").onclick = () => {
          cls.attributes.push({ visibility: "+", name: `field_${cls.attributes.length + 1}`, type: "string" });
          pushState();
          renderCanvas();
        };

        inspector.querySelector("#insp-add-class-op").onclick = () => {
          cls.operations.push({ visibility: "+", name: `method_${cls.operations.length + 1}`, returnType: "void" });
          pushState();
          renderCanvas();
        };

        inspector.querySelectorAll("[data-attr-idx]").forEach(row => {
          const idx = Number(row.dataset.attrIdx);
          row.querySelector(".drawio-del-icon").onclick = () => { cls.attributes.splice(idx, 1); pushState(); renderCanvas(); };
        });

        inspector.querySelectorAll("[data-op-idx]").forEach(row => {
          const idx = Number(row.dataset.opIdx);
          row.querySelector(".drawio-del-icon").onclick = () => { cls.operations.splice(idx, 1); pushState(); renderCanvas(); };
        });

      } else {
        inspector.innerHTML = `
          <div class="drawio-empty-insp">
            <div style="font-size:24px;margin-bottom:8px;">📐</div>
            <p><b>No element selected</b></p>
            <p><small class="muted">Click any shape on the canvas or pick from the left library palette to inspect details.</small></p>
          </div>
        `;
      }
    };

    const updateSnippet = () => {
      if (model.type === "erd") {
        snippetCode.textContent = getElementCodeSnippet(model, selectedType, selectedId, connDraft);
      } else {
        snippetCode.textContent = generateMermaid(model);
      }
      snippetTitle.textContent = `${meta.name} Definition`;
    };

    // Canvas Events
    const attachCanvasEvents = () => {
      modal.querySelectorAll(".erd-entity-group, .dfd-element-group, .class-card-group").forEach(group => {
        const id = group.dataset.entityId || group.dataset.elementId || group.dataset.className;
        const item = (model.entities && model.entities.find(e => e.name === id)) ||
                     (model.elements && model.elements.find(e => e.id === id)) ||
                     (model.classes && model.classes.find(c => c.name === id));
        if (!item) return;

        group.onmousedown = e => {
          if (e.button !== 0) return;
          e.stopPropagation();

          if (isCreatingConnection) {
            if (!connDraft.from) {
              connDraft.from = id;
            } else if (!connDraft.to) {
              if (id !== connDraft.from) connDraft.to = id;
            } else {
              if (id !== connDraft.from) connDraft.to = id;
              else { connDraft.from = id; connDraft.to = null; }
            }
            renderCanvas();
            return;
          }

          selectedType = model.type === "erd" ? "entity" : (model.type === "class" ? "class" : "element");
          selectedId = id;
          updateInspector();
          updateSnippet();

          const startMouseX = e.clientX;
          const startMouseY = e.clientY;
          const startX = item.x;
          const startY = item.y;

          const onMouseMove = me => {
            const dx = (me.clientX - startMouseX) / zoom;
            const dy = (me.clientY - startMouseY) / zoom;
            item.x = Math.round(startX + dx);
            item.y = Math.round(startY + dy);
            renderCanvas(false);
          };

          const onMouseUp = () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
            pushState();
            renderCanvas(true);
          };

          window.addEventListener("mousemove", onMouseMove);
          window.addEventListener("mouseup", onMouseUp);
        };
      });

      modal.querySelectorAll(".erd-rel-group, .dfd-flow-group, .class-rel-group").forEach(group => {
        const relId = group.dataset.relId || group.dataset.flowId;
        group.onmousedown = e => {
          if (isCreatingConnection) return;
          e.stopPropagation();
          selectedType = group.dataset.flowId ? "flow" : "relationship";
          selectedId = relId;
          updateInspector();
          updateSnippet();
          renderCanvas(true);
        };
      });
    };

    // Canvas Background Drag Pan
    viewport.onmousedown = e => {
      if (e.button !== 0 && e.button !== 1) return;
      const isBg = e.target.classList.contains("erd-svg-canvas") || e.target.id === "erd-bg-rect" || e.target === viewport;
      if (isBg && !isCreatingConnection) {
        selectedType = null;
        selectedId = null;
        updateInspector();
        updateSnippet();
        renderCanvas();
      }

      const startMouseX = e.clientX;
      const startMouseY = e.clientY;
      const startPanX = panX;
      const startPanY = panY;

      const onMouseMove = me => {
        panX = startPanX + (me.clientX - startMouseX);
        panY = startPanY + (me.clientY - startMouseY);
        updateTransform();
      };

      const onMouseUp = () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    };

    // Wheel Zoom
    viewport.onwheel = e => {
      e.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      setZoom(zoom * factor, mouseX, mouseY);
    };

    // Zoom Toolbar buttons
    modal.querySelector("#drawio-zoom-in").onclick = () => setZoom(zoom * 1.2);
    modal.querySelector("#drawio-zoom-out").onclick = () => setZoom(zoom / 1.2);
    modal.querySelector("#drawio-zoom-fit").onclick = fitToView;
    modal.querySelector("#drawio-zoom-reset").onclick = resetZoom;

    // Toggle Left Shapes Palette
    modal.querySelector("#ribbon-toggle-shapes").onclick = () => {
      shapesPalette.classList.toggle("collapsed");
    };

    // Toggle Right Inspector Panel
    modal.querySelector("#ribbon-toggle-inspector").onclick = () => {
      inspectorPane.classList.toggle("collapsed");
    };

    // Ribbon Connect Tool
    modal.querySelector("#ribbon-add-conn").onclick = () => {
      const itemsCount = (model.entities?.length || 0) + (model.elements?.length || 0) + (model.classes?.length || 0);
      if (itemsCount < 2) {
        alert("At least 2 elements are required to create a connection.");
        return;
      }
      isCreatingConnection = true;
      connDraft = { from: null, to: null, label: "connects", cardinality: "||--o{", type: "association" };
      selectedType = model.type === "erd" ? "creating_relationship" : (model.type === "class" ? "creating_class_rel" : "creating_flow");
      renderCanvas();
    };

    // Ribbon Auto-layout
    modal.querySelector("#ribbon-autolayout").onclick = () => {
      const items = model.entities || model.elements || model.classes || [];
      const cols = Math.min(3, Math.ceil(Math.sqrt(items.length)));
      items.forEach((it, idx) => {
        it.x = 60 + (idx % cols) * 260;
        it.y = 60 + Math.floor(idx / cols) * 200;
      });
      pushState();
      renderCanvas();
      fitToView();
    };

    // Inspector Tab Switching
    modal.querySelectorAll(".drawio-insp-tab").forEach(tab => {
      tab.onclick = () => {
        modal.querySelectorAll(".drawio-insp-tab").forEach(t => t.classList.remove("on"));
        tab.classList.add("on");
        const target = tab.dataset.inspTab;
        modal.querySelector("#drawio-tab-properties").hidden = target !== "properties";
        modal.querySelector("#drawio-tab-code").hidden = target !== "code";
      };
    });

    // View Tabs Switching
    modal.querySelectorAll(".drawio-view-tab").forEach(btn => {
      btn.onclick = () => {
        modal.querySelectorAll(".drawio-view-tab").forEach(b => b.classList.remove("on"));
        btn.classList.add("on");
        activeTab = btn.dataset.tab;

        if (activeTab === "canvas") {
          canvasPane.hidden = false;
          shapesPalette.hidden = false;
          inspectorPane.hidden = false;
          codePane.hidden = true;
          renderCanvas();
        } else {
          canvasPane.hidden = true;
          shapesPalette.hidden = true;
          inspectorPane.hidden = true;
          codePane.hidden = false;
          if (activeTab === "mermaid") {
            codeLangLabel.textContent = "Mermaid Diagram Source";
            codeBox.value = generateMermaid(model);
          } else if (activeTab === "drawio") {
            codeLangLabel.textContent = "Draw.io Diagram XML";
            codeBox.value = generateDrawio(model);
          } else if (activeTab === "svg") {
            codeLangLabel.textContent = "Scalable Vector Graphics (SVG)";
            codeBox.value = generateSvg(model);
          }
        }
      };
    });

    // Apply code changes back to visual canvas
    const applyCodeBtn = modal.querySelector("#erd-apply-code-btn");
    if (applyCodeBtn) {
      applyCodeBtn.onclick = () => {
        try {
          const newCode = codeBox.value.trim();
          if (!newCode) return;
          model = parseDiagram(newCode, detectedType, title);
          pushState();
          alert("✓ Code changes synced to visual canvas!");
        } catch (err) {
          alert(`Could not parse code: ${err.message}`);
        }
      };
    }

    modal.querySelector("#erd-copy-code-btn").onclick = async () => {
      try {
        await navigator.clipboard.writeText(codeBox.value);
        const b = modal.querySelector("#erd-copy-code-btn");
        const orig = b.textContent;
        b.textContent = "Copied!";
        setTimeout(() => { b.textContent = orig; }, 1500);
      } catch {
        codeBox.select();
      }
    };

    // Source Mode Ribbon Handlers & Stats
    const updateSourceStats = () => {
      const val = codeBox.value;
      const lines = val.split("\n").length;
      const chars = val.length;
      const statsEl = modal.querySelector("#src-stats");
      if (statsEl) statsEl.textContent = `${lines} lines • ${chars} chars`;
      const lineCountEl = modal.querySelector("#src-line-count");
      if (lineCountEl) lineCountEl.textContent = String(lines);
      const charCountEl = modal.querySelector("#src-char-count");
      if (charCountEl) charCountEl.textContent = String(chars);
    };

    if (isSourceType) {
      codeBox.value = originalSeedCode;
      codeBox.oninput = () => {
        isDirty = (codeBox.value !== originalSeedCode);
        dirtyIndicator.className = isDirty ? "drawio-dirty-badge dirty" : "drawio-dirty-badge clean";
        dirtyIndicator.textContent = isDirty ? "● Unsaved changes" : "✓ Saved";
        undoBtn.disabled = false;
        updateSourceStats();
      };

      const srcCopyBtn = modal.querySelector("#src-ribbon-copy");
      if (srcCopyBtn) {
        srcCopyBtn.onclick = async () => {
          await navigator.clipboard.writeText(codeBox.value);
          const orig = srcCopyBtn.innerHTML;
          srcCopyBtn.innerHTML = "<span>✓</span> Copied!";
          setTimeout(() => { srcCopyBtn.innerHTML = orig; }, 1500);
        };
      }

      const srcWrapBtn = modal.querySelector("#src-ribbon-wrap");
      if (srcWrapBtn) {
        let isWrapped = true;
        srcWrapBtn.onclick = () => {
          isWrapped = !isWrapped;
          codeBox.style.whiteSpace = isWrapped ? "pre-wrap" : "pre";
          codeBox.style.overflowX = isWrapped ? "hidden" : "auto";
        };
      }

      // Populate File Details in Inspector
      if (inspector) {
        inspector.innerHTML = `
          <div class="drawio-prop-group">
            <div class="drawio-prop-title">Document Metadata</div>
            <div class="drawio-prop-row">
              <span class="drawio-prop-label">Filename</span>
              <b style="font-size:12px;word-break:break-all;">${esc(activeArtifact?.downloadFilename || title)}</b>
            </div>
            <div class="drawio-prop-row">
              <span class="drawio-prop-label">Format</span>
              <span class="drawio-type-tag" style="background:#eff6ff;color:#2563eb;font-weight:700;">${esc((activeArtifact?.artifactFormat || "source").toUpperCase())}</span>
            </div>
            <div class="drawio-prop-row">
              <span class="drawio-prop-label">Delivery</span>
              <span>${esc(activeArtifact?.deliveryMethod || "Editable Source")}</span>
            </div>
            <div class="drawio-prop-row">
              <span class="drawio-prop-label">Variant</span>
              <span>${esc(variantName || "Default")}</span>
            </div>
            <div class="drawio-prop-row">
              <span class="drawio-prop-label">Lines</span>
              <span id="src-line-count">${originalSeedCode.split("\n").length}</span>
            </div>
            <div class="drawio-prop-row">
              <span class="drawio-prop-label">Characters</span>
              <span id="src-char-count">${originalSeedCode.length}</span>
            </div>
          </div>
        `;
      }
      updateSourceStats();
    }

    // Reset Button
    modal.querySelector("#drawio-reset-btn").onclick = () => {
      if (!confirm("Reset all unsaved in-memory changes back to the original stored state?")) return;
      if (isSourceType) {
        codeBox.value = originalSeedCode;
        isDirty = false;
        dirtyIndicator.className = "drawio-dirty-badge clean";
        dirtyIndicator.textContent = "✓ Saved";
        undoBtn.disabled = true;
        redoBtn.disabled = true;
        updateSourceStats();
      } else {
        model = parseDiagram(originalSeedCode, detectedType, title);
        isDirty = false;
        dirtyIndicator.className = "drawio-dirty-badge clean";
        dirtyIndicator.textContent = "✓ Saved";
        historyStack.length = 0;
        historyStack.push(JSON.parse(JSON.stringify(model)));
        historyIdx = 0;
        undoBtn.disabled = true;
        redoBtn.disabled = true;
        renderCanvas();
        fitToView();
      }
    };

    // Export Dropdown
    const triggerDownload = (filename, content, type = "text/plain") => {
      const blob = new Blob([content], { type });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    };

    const dlBtn = modal.querySelector("#drawio-export-btn");
    const dlMenu = modal.querySelector("#drawio-export-menu");
    dlBtn.onclick = e => {
      e.stopPropagation();
      dlMenu.hidden = !dlMenu.hidden;
    };
    document.addEventListener("click", () => { dlMenu.hidden = true; });

    const dlDirect = modal.querySelector("#dl-src-direct");
    if (dlDirect) {
      dlDirect.onclick = e => {
        e.preventDefault();
        triggerDownload(activeArtifact?.downloadFilename || `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`, codeBox.value);
      };
    }

    const dlMmd = modal.querySelector("#dl-mmd");
    if (dlMmd) {
      dlMmd.onclick = e => {
        e.preventDefault();
        triggerDownload(`${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.mmd`, generateMermaid(model));
      };
    }

    const dlSvg = modal.querySelector("#dl-svg");
    if (dlSvg) {
      dlSvg.onclick = e => {
        e.preventDefault();
        triggerDownload(`${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.svg`, generateSvg(model), "image/svg+xml");
      };
    }

    const dlDrawio = modal.querySelector("#dl-drawio");
    if (dlDrawio) {
      dlDrawio.onclick = e => {
        e.preventDefault();
        triggerDownload(`${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.drawio`, generateDrawio(model));
      };
    }

    const dlPng = modal.querySelector("#dl-png");
    if (dlPng) {
      dlPng.onclick = e => {
        e.preventDefault();
        const svgStr = generateSvg(model);
        const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 1200;
          canvas.height = 800;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, 1200, 800);
          ctx.drawImage(img, 0, 0, 1200, 800);
          URL.revokeObjectURL(url);
          canvas.toBlob(b => {
            const l = document.createElement("a");
            l.href = URL.createObjectURL(b);
            l.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
            l.click();
            URL.revokeObjectURL(l.href);
          }, "image/png");
        };
        img.src = url;
      };
    }

    // Save / Apply Changes Button
    modal.querySelector("#drawio-apply-btn").onclick = async () => {
      if (isSourceType) {
        const content = codeBox.value;
        if (onSave) {
          await onSave({
            content,
            mermaid: "",
            svg: "",
            drawio: "",
            model: null
          });
        }
      } else {
        const updatedMermaid = generateMermaid(model);
        const updatedSvg = generateSvg(model);
        const updatedDrawio = generateDrawio(model);

        if (onSave) {
          await onSave({
            mermaid: updatedMermaid,
            svg: updatedSvg,
            drawio: updatedDrawio,
            content: updatedMermaid,
            model
          });
        }
      }
      isDirty = false;
      modal.remove();
      window.removeEventListener("keydown", onKeyDown);
    };

    // Close Button
    modal.querySelector("#drawio-close-btn").onclick = () => {
      if (isDirty && !confirm("You have unsaved changes. Discard changes and close?")) {
        return;
      }
      modal.remove();
      window.removeEventListener("keydown", onKeyDown);
    };

    // Initial render & fit
    renderCanvas();
    setTimeout(fitToView, 50);
  };

  return {
    detectDiagramType,
    DIAGRAM_META,
    validateRelationship,
    createRelationship,
    updateRelationship,
    deleteRelationship,
    parseMermaidERD,
    generateMermaidERD,
    generateDrawioERD,
    generateSvgERD,
    parseMermaidDFD,
    generateMermaidDFD,
    generateDrawioDFD,
    generateSvgDFD,
    parseMermaidClass,
    generateMermaidClass,
    generateDrawioClass,
    generateSvgClass,
    parseDiagram,
    generateMermaid,
    generateDrawio,
    generateSvg,
    getElementCodeSnippet,
    open
  };
})();

// Export for Node and global module environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = ErdEditor;
}
if (typeof window !== "undefined") {
  window.ErdEditor = ErdEditor;
  window.DiagramEditor = ErdEditor;
}
