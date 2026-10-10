/**
 * ComponentHub Diagram Renderer
 * Provides unified, safe, and resilient rendering for:
 * - Mermaid diagrams
 * - SVG diagrams
 * - Draw.io XML files (interactive viewer + native SVG parser fallback)
 * - PlantUML diagrams (server-side rendering + offline fallback)
 */

const DiagramRenderer = (() => {
  // PlantUML custom base64-like 6-bit encoder
  const encode6bit = b => {
    if (b < 10) return String.fromCharCode(48 + b);
    b -= 10;
    if (b < 26) return String.fromCharCode(65 + b);
    b -= 26;
    if (b < 26) return String.fromCharCode(97 + b);
    b -= 26;
    if (b === 0) return "-";
    if (b === 1) return "_";
    return "?";
  };

  const append3bytes = (b1, b2, b3) => {
    const c1 = b1 >> 2;
    const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
    const c3 = ((b2 & 0xf) << 2) | (b3 >> 6);
    const c4 = b3 & 0x3f;
    return encode6bit(c1 & 0x3f) + encode6bit(c2 & 0x3f) + encode6bit(c3 & 0x3f) + encode6bit(c4 & 0x3f);
  };

  const encodePlantUMLString = async text => {
    // UTF-8 encode
    const utf8Bytes = new TextEncoder().encode(text);
    // Deflate compress using browser CompressionStream if supported
    if (typeof CompressionStream !== "undefined") {
      try {
        const cs = new CompressionStream("deflate-raw");
        const writer = cs.writable.getWriter();
        writer.write(utf8Bytes);
        writer.close();
        const compressedBuffer = await new Response(cs.readable).arrayBuffer();
        const compressedBytes = new Uint8Array(compressedBuffer);
        let encoded = "";
        for (let i = 0; i < compressedBytes.length; i += 3) {
          if (i + 2 === compressedBytes.length) {
            encoded += append3bytes(compressedBytes[i], compressedBytes[i + 1], 0);
          } else if (i + 1 === compressedBytes.length) {
            encoded += append3bytes(compressedBytes[i], 0, 0);
          } else {
            encoded += append3bytes(compressedBytes[i], compressedBytes[i + 1], compressedBytes[i + 2]);
          }
        }
        return `~1${encoded}`;
      } catch {
        // Fall back to hex-encoded ~h
      }
    }
    // Fallback: hex encoding ~h
    let hex = "";
    for (let i = 0; i < utf8Bytes.length; i++) {
      hex += utf8Bytes[i].toString(16).padStart(2, "0");
    }
    return `~h${hex}`;
  };

  // Safe HTML / XML text escape
  const esc = str =>
    String(str ?? "").replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /**
   * Parse Draw.io mxGraphModel XML into an SVG diagram (Native Offline Renderer)
   */
  const parseDrawioToSvg = xmlText => {
    try {
      const nodes = [];
      const edges = [];
      const nodesById = new Map();
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      if (typeof DOMParser !== "undefined") {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, "text/xml");
        if (doc.querySelector("parsererror")) {
          throw new Error("Invalid XML structure");
        }

        const diagramEl = doc.querySelector("diagram");
        let rootEl = doc.querySelector("root");

        if (!rootEl && diagramEl && diagramEl.textContent) {
          try {
            const raw = atob(diagramEl.textContent.trim());
            const innerDoc = parser.parseFromString(raw, "text/xml");
            rootEl = innerDoc.querySelector("root");
          } catch {
            // continue
          }
        }

        if (!rootEl) {
          throw new Error("Could not find mxGraphModel root element");
        }

        const cells = Array.from(rootEl.querySelectorAll("mxCell"));

        for (const cell of cells) {
          const id = cell.getAttribute("id");
          if (id === "0" || id === "1") continue;

          const isVertex = cell.getAttribute("vertex") === "1";
          const isEdge = cell.getAttribute("edge") === "1";
          const value = cell.getAttribute("value") || "";
          const style = cell.getAttribute("style") || "";
          const parent = cell.getAttribute("parent");

          const geo = cell.querySelector("mxGeometry");
          if (isVertex && geo) {
            const x = parseFloat(geo.getAttribute("x") || "0");
            const y = parseFloat(geo.getAttribute("y") || "0");
            const w = parseFloat(geo.getAttribute("width") || "120");
            const h = parseFloat(geo.getAttribute("height") || "60");

            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + w);
            maxY = Math.max(maxY, y + h);

            const nodeObj = { id, value, style, x, y, w, h, parent };
            nodes.push(nodeObj);
            nodesById.set(id, nodeObj);
          } else if (isEdge) {
            const source = cell.getAttribute("source");
            const target = cell.getAttribute("target");
            edges.push({ id, value, style, source, target, cell });
          }
        }
      } else {
        // Node.js RegExp XML parser fallback
        const cellRegex = /<mxCell\s+([^>]+)(?:\/?>|>([\s\S]*?)<\/mxCell>)/g;
        let match;
        while ((match = cellRegex.exec(xmlText)) !== null) {
          const attrsStr = match[1] || "";
          const innerContent = match[2] || "";
          const getAttr = name => {
            const m = attrsStr.match(new RegExp(`${name}="([^"]*)"`));
            return m ? m[1] : "";
          };

          const id = getAttr("id");
          if (!id || id === "0" || id === "1") continue;

          const isVertex = getAttr("vertex") === "1";
          const isEdge = getAttr("edge") === "1";
          const value = getAttr("value") || "";
          const style = getAttr("style") || "";
          const parent = getAttr("parent");

          if (isVertex) {
            const geoMatch = innerContent.match(/<mxGeometry\s+([^>]+)\/?>/);
            let x = 0, y = 0, w = 120, h = 60;
            if (geoMatch) {
              const geoAttrs = geoMatch[1];
              const getGeoAttr = n => {
                const m = geoAttrs.match(new RegExp(`${n}="([^"]*)"`));
                return m ? parseFloat(m[1]) : null;
              };
              x = getGeoAttr("x") ?? 0;
              y = getGeoAttr("y") ?? 0;
              w = getGeoAttr("width") ?? 120;
              h = getGeoAttr("height") ?? 60;
            }

            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + w);
            maxY = Math.max(maxY, y + h);

            const nodeObj = { id, value, style, x, y, w, h, parent };
            nodes.push(nodeObj);
            nodesById.set(id, nodeObj);
          } else if (isEdge) {
            const source = getAttr("source");
            const target = getAttr("target");
            edges.push({ id, value, style, source, target });
          }
        }
      }

      if (nodes.length === 0 && edges.length === 0) {
        throw new Error("No diagram elements found in Draw.io file");
      }

      // If bounds are invalid, assign defaults
      if (!isFinite(minX)) minX = 0;
      if (!isFinite(minY)) minY = 0;
      if (!isFinite(maxX)) maxX = 600;
      if (!isFinite(maxY)) maxY = 400;

      const padding = 35;
      const viewBoxX = Math.max(0, minX - padding);
      const viewBoxY = Math.max(0, minY - padding);
      const viewBoxW = Math.max(400, (maxX - minX) + padding * 2);
      const viewBoxH = Math.max(250, (maxY - minY) + padding * 2);

      // Render SVG string
      let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxX} ${viewBoxY} ${viewBoxW} ${viewBoxH}" width="100%" height="100%" style="font-family:Inter,system-ui,sans-serif;max-height:450px;">`;
      
      // Definitions: Markers for arrowheads
      svg += `<defs>
        <marker id="drawio-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563eb"/>
        </marker>
        <marker id="drawio-arrow-gray" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b"/>
        </marker>
        <filter id="drawio-shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.06"/>
        </filter>
      </defs>`;

      // Render Vertex Nodes
      for (const node of nodes) {
        const { x, y, w, h, value, style } = node;
        const styleMap = Object.fromEntries(
          style.split(";").map(s => s.trim().split("=")).filter(([k]) => k)
        );

        let fillColor = styleMap.fillColor || "#eff4ff";
        let strokeColor = styleMap.strokeColor || "#3b82f6";
        let fontColor = styleMap.fontColor || "#0f172a";
        const strokeWidth = styleMap.strokeWidth || "1.5";
        const isDashed = styleMap.dashed === "1";
        const dashArray = isDashed ? 'stroke-dasharray="4,4"' : "";

        const lines = value.split(/&#xa;|\n|<br\s*\/?>/).map(l => l.trim()).filter(Boolean);

        // Determine shape
        const shape = styleMap.shape || (styleMap.ellipse !== undefined || style.includes("ellipse") ? "ellipse" : (style.includes("rhombus") ? "rhombus" : "rect"));

        if (shape === "ellipse" || style.includes("ellipse")) {
          const cx = x + w / 2;
          const cy = y + h / 2;
          const rx = w / 2;
          const ry = h / 2;
          svg += `<g filter="url(#drawio-shadow)">
            <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${dashArray}/>`;
        } else if (shape === "rhombus" || style.includes("rhombus")) {
          const p1 = `${x + w / 2},${y}`;
          const p2 = `${x + w},${y + h / 2}`;
          const p3 = `${x + w / 2},${y + h}`;
          const p4 = `${x},${y + h / 2}`;
          svg += `<g filter="url(#drawio-shadow)">
            <polygon points="${p1} ${p2} ${p3} ${p4}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${dashArray}/>`;
        } else if (shape === "umlActor" || style.includes("umlActor")) {
          // Actor shape
          svg += `<g filter="url(#drawio-shadow)">
            <circle cx="${x + w / 2}" cy="${y + 14}" r="10" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
            <line x1="${x + w / 2}" y1="${y + 24}" x2="${x + w / 2}" y2="${y + 44}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
            <line x1="${x + 4}" y1="${y + 32}" x2="${x + w - 4}" y2="${y + 32}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
            <line x1="${x + w / 2}" y1="${y + 44}" x2="${x + 6}" y2="${y + h}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
            <line x1="${x + w / 2}" y1="${y + 44}" x2="${x + w - 6}" y2="${y + h}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
        } else if (shape === "cube" || style.includes("cube")) {
          // 3D Cube / Node shape
          const d = 12;
          svg += `<g filter="url(#drawio-shadow)">
            <path d="M ${x} ${y + d} L ${x + d} ${y} L ${x + w} ${y} L ${x + w} ${y + h - d} L ${x + w - d} ${y + h} L ${x} ${y + h} Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${dashArray}/>
            <path d="M ${x + d} ${y} L ${x + d} ${y + h - d} L ${x + w} ${y + h - d} M ${x + d} ${y + h - d} L ${x} ${y + h}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
        } else if (style.includes("swimlane") || (lines.length > 1 && (value.includes("+") || value.includes("-")))) {
          // Class / Entity Table with Header
          const headerH = 28;
          svg += `<g filter="url(#drawio-shadow)">
            <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#ffffff" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${dashArray}/>
            <path d="M ${x} ${y + 6} Q ${x} ${y} ${x + 6} ${y} L ${x + w - 6} ${y} Q ${x + w} ${y} ${x + w} ${y + 6} L ${x + w} ${y + headerH} L ${x} ${y + headerH} Z" fill="${strokeColor}"/>
            <text x="${x + w / 2}" y="${y + 19}" text-anchor="middle" font-weight="700" font-size="13" fill="#ffffff">${esc(lines[0] || "")}</text>`;
          // Attribute lines
          lines.slice(1).forEach((attrLine, idx) => {
            svg += `<text x="${x + 10}" y="${y + headerH + 20 + idx * 18}" font-family="monospace" font-size="11" fill="${fontColor}">${esc(attrLine)}</text>`;
          });
          svg += `</g>`;
          continue;
        } else {
          // Rounded / standard rectangle
          const rx = style.includes("rounded=1") || styleMap.rounded === "1" ? 8 : 4;
          svg += `<g filter="url(#drawio-shadow)">
            <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${dashArray}/>`;
        }

        // Render multi-line text centered inside the shape
        if (lines.length > 0) {
          const fontSize = lines.length > 2 ? 11 : 13;
          const lineHeight = fontSize + 4;
          const totalTextH = lines.length * lineHeight;
          const startY = y + (h - totalTextH) / 2 + fontSize;

          lines.forEach((lineText, idx) => {
            const isTitle = idx === 0 && lines.length > 1;
            svg += `<text x="${x + w / 2}" y="${startY + idx * lineHeight}" text-anchor="middle" font-size="${fontSize}" font-weight="${isTitle ? '700' : '500'}" fill="${fontColor}">${esc(lineText)}</text>`;
          });
        }
        svg += `</g>`;
      }

      // Render Edge Connectors
      for (const edge of edges) {
        const { source, target, value, style } = edge;
        const sourceNode = nodesById.get(source);
        const targetNode = nodesById.get(target);

        if (!sourceNode || !targetNode) continue;

        const styleMap = Object.fromEntries(
          style.split(";").map(s => s.trim().split("=")).filter(([k]) => k)
        );
        const strokeColor = styleMap.strokeColor || "#2563eb";
        const strokeWidth = styleMap.strokeWidth || "1.5";
        const isDashed = styleMap.dashed === "1";
        const dashArray = isDashed ? 'stroke-dasharray="4,4"' : "";

        // Calculate center points
        const sx = sourceNode.x + sourceNode.w / 2;
        const sy = sourceNode.y + sourceNode.h / 2;
        const tx = targetNode.x + targetNode.w / 2;
        const ty = targetNode.y + targetNode.h / 2;

        // Clip lines to bounding box edges
        let x1 = sx, y1 = sy, x2 = tx, y2 = ty;
        const dx = tx - sx;
        const dy = ty - sy;

        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal dominant
          if (dx > 0) {
            x1 = sourceNode.x + sourceNode.w;
            x2 = targetNode.x;
          } else {
            x1 = sourceNode.x;
            x2 = targetNode.x + targetNode.w;
          }
          y1 = sy;
          y2 = ty;
        } else {
          // Vertical dominant
          if (dy > 0) {
            y1 = sourceNode.y + sourceNode.h;
            y2 = targetNode.y;
          } else {
            y1 = sourceNode.y;
            y2 = targetNode.y + targetNode.h;
          }
          x1 = sx;
          x2 = tx;
        }

        // Midpoint for label
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;

        svg += `<g class="drawio-edge">
          <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${dashArray} marker-end="url(#drawio-arrow)"/>`;

        if (value) {
          const labelText = esc(value.replace(/&#xa;|\n/g, " "));
          const labelW = Math.max(40, labelText.length * 7 + 12);
          svg += `<rect x="${mx - labelW / 2}" y="${my - 10}" width="${labelW}" height="20" rx="4" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
            <text x="${mx}" y="${my + 4}" text-anchor="middle" font-size="11" font-weight="600" fill="#334155">${labelText}</text>`;
        }
        svg += `</g>`;
      }

      svg += `</svg>`;
      return svg;
    } catch (err) {
      throw new Error(`Failed to render Draw.io diagram: ${err.message}`);
    }
  };

  /**
   * Main render function for any supported format
   */
  const render = async (container, artifact) => {
    if (!container) return;
    const format = String(artifact?.artifactFormat || "").toLowerCase();
    const content = String(artifact?.content || "").trim();

    container.innerHTML = `<div class="diagram-loading"><div class="spinner"></div><span>Rendering diagram preview...</span></div>`;

    try {
      if (!content && !artifact?.binaryContent) {
        container.innerHTML = `<div class="diagram-empty"><span>No diagram content available.</span></div>`;
        return;
      }

      // Format 1: Mermaid
      if (format === "mermaid") {
        await renderMermaid(container, content);
        return;
      }

      // Format 2: SVG
      if (format === "svg") {
        renderSvg(container, content);
        return;
      }

      // Format 3: Draw.io
      if (format === "drawio") {
        await renderDrawio(container, content);
        return;
      }

      // Format 4: PlantUML
      if (format === "plantuml") {
        await renderPlantUML(container, content);
        return;
      }

      // Format 5: PNG
      if (format === "png" && artifact.binaryContent) {
        container.innerHTML = `<div class="diagram-canvas-wrap"><img class="artifact-image-preview" src="data:image/png;base64,${esc(artifact.binaryContent)}" alt="${esc(artifact.name)}" loading="lazy"></div>`;
        return;
      }

      // Default text / code fallback
      container.innerHTML = `<div class="diagram-code-fallback"><pre><code>${esc(content)}</code></pre></div>`;
    } catch (err) {
      container.innerHTML = `
        <div class="diagram-error">
          <div class="diagram-error-icon">⚠️</div>
          <div class="diagram-error-msg">
            <b>Diagram Preview Notice</b>
            <p>${esc(err.message || "Unable to render dynamic preview.")}</p>
          </div>
        </div>
        <div class="diagram-code-fallback"><pre><code>${esc(content)}</code></pre></div>
      `;
    }
  };

  /**
   * Render Mermaid with robust error boundaries
   */
  const renderMermaid = async (container, code) => {
    // Check if mermaid is available
    if (typeof mermaid === "undefined") {
      // Attempt dynamic load
      try {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
          script.onload = resolve;
          script.onerror = () => reject(new Error("Could not load Mermaid library"));
          document.head.appendChild(script);
        });
      } catch {
        throw new Error("Mermaid library is unavailable. Raw diagram source is displayed below.");
      }
    }

    if (typeof mermaid !== "undefined") {
      mermaid.initialize({
        startOnLoad: false,
        theme: "default",
        securityLevel: "loose",
        fontFamily: "Inter, system-ui, sans-serif"
      });

      const uniqueId = `mmd-${Math.random().toString(36).slice(2, 10)}`;
      const cleanCode = code.trim();

      const { svg } = await mermaid.render(uniqueId, cleanCode);
      container.innerHTML = `<div class="diagram-canvas-wrap diagram-mermaid-wrap">${svg}</div>`;
    }
  };

  /**
   * Render SVG safely
   */
  const renderSvg = (container, svgText) => {
    // Sanitize basic dangerous tags while keeping valid SVG elements
    const sanitized = svgText
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/\bon\w+="[^"]*"/gi, "");

    container.innerHTML = `<div class="diagram-canvas-wrap diagram-svg-wrap">${sanitized}</div>`;
  };

  /**
   * Render Draw.io with interactive embed or native SVG fallback
   */
  const renderDrawio = async (container, xmlText) => {
    // Attempt 1: Native SVG converter for instant, resilient offline vector graphics
    try {
      const svg = parseDrawioToSvg(xmlText);
      container.innerHTML = `<div class="diagram-canvas-wrap diagram-drawio-wrap">${svg}</div>`;
    } catch {
      // Attempt 2: Draw.io GraphViewer if loaded
      if (typeof GraphViewer !== "undefined") {
        container.innerHTML = `<div class="mxgraph" style="max-width:100%;border:1px solid transparent;" data-mxgraph="${esc(JSON.stringify({ xml: xmlText, highlight: "#2563eb", nav: true, resize: true }))}"></div>`;
        GraphViewer.processElements();
      } else {
        throw new Error("Draw.io XML could not be parsed. The original XML source is available below.");
      }
    }
  };

  /**
   * Render PlantUML with server encoding + graceful offline handling
   */
  const renderPlantUML = async (container, pumlCode) => {
    const encoded = await encodePlantUMLString(pumlCode);
    const plantUmlUrl = `https://www.plantuml.com/plantuml/svg/${encoded}`;

    container.innerHTML = `
      <div class="diagram-canvas-wrap diagram-plantuml-wrap">
        <img class="plantuml-image" src="${plantUmlUrl}" alt="PlantUML diagram preview" loading="lazy" />
        <div class="plantuml-fallback" hidden>
          <div class="diagram-error">
            <div class="diagram-error-icon">ℹ️</div>
            <div class="diagram-error-msg">
              <b>PlantUML Service Notice</b>
              <p>PlantUML preview service is currently offline or unreachable. The reusable PlantUML source is ready to copy or download below.</p>
            </div>
          </div>
          <div class="diagram-code-fallback"><pre><code>${esc(pumlCode)}</code></pre></div>
        </div>
      </div>
    `;

    const img = container.querySelector(".plantuml-image");
    const fallback = container.querySelector(".plantuml-fallback");
    if (img && fallback) {
      img.onerror = () => {
        img.style.display = "none";
        fallback.hidden = false;
      };
    }
  };

  return {
    render,
    renderMermaid,
    renderSvg,
    renderDrawio,
    renderPlantUML,
    parseDrawioToSvg,
    encodePlantUMLString
  };
})();

// Export for module or global environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = DiagramRenderer;
}
