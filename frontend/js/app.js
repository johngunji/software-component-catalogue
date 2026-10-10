/* ComponentHub UI: shared shell (header/footer) + all pages. */

const C = Catalogue, E = C.esc;
// Select the first matching element from the current page.
const $ = s => document.querySelector(s);
// Create the markup used by the Lucide icon renderer.
const ic = n => `<i data-lucide="${n}"></i>`;
// Copy text using the Clipboard API with a browser-compatible fallback.
const copyText = async text => {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    const copied = document.execCommand("copy");
    helper.remove();
    if (!copied) throw new Error("Unable to copy the component content.");
  }
};
const qs = new URLSearchParams(location.search);

const pg = document.body.dataset.page;
const root = document.body.dataset.root || "";

// Build a page-relative URL that works from every frontend entry point.
const url = p =>
  root + (p === "index" ? "index.html" : `pages/${p}.html`);

const P = {};

const NAV = [
  ["index", "Home"],
  ["browse", "Browse"],
  ["search", "Search"],
  ["add-component", "Add Component"],
  ["statistics", "Statistics"]
];

// Sum a numeric value extracted from every item in a collection.
// Add a selected numeric field across a collection.
const sum = (a, f) => a.reduce((t, x) => t + f(x), 0);

let role = C.role();
const U = C.user() || { username: "?", role: "User" };
let componentNotice = "";


/* ---------- shared shell ---------- */

document.body.innerHTML = `
<header class="topbar">
  <div class="wrap bar">

    <a class="brand" href="${url("index")}">
      <span class="logo">${ic("box")}</span>
      <span>
        <b>ComponentHub</b>
        <small>Software Component Catalogue</small>
      </span>
    </a>

    <nav>
      ${NAV
        .filter(([p]) => p !== "add-component" || role === "Cataloguer")
        .map(
          ([p, l]) =>
            `<a href="${url("index") === url(p) ? url("index") : url(p)}"
              ${
                p === pg || (pg === "component" && p === "browse")
                  ? 'class="on"'
                  : ""
              }>
              ${l}
            </a>`
        )
        .join("")}
    </nav>

    <div class="userbox">
      <span class="uavatar">${E(U.username[0].toUpperCase())}</span>
      <span class="uname"><b>${E(U.username)}</b><small>${E(U.role)}</small></span>
      <button class="btn ghost sm" id="logout">${ic("log-out")} Log out</button>
    </div>

  </div>
</header>

<main id="main"></main>

<footer class="footer">
  <div class="wrap">

    <div>
      <b>ComponentHub</b>
      <p>A shared catalogue of reusable code and design components.</p>
    </div>

    <div>
      <h4>Explore</h4>
      <a href="${url("browse")}">Browse</a>
      <a href="${url("search")}">Search</a>
      <a href="${url("statistics")}">Statistics</a>
    </div>

    <div>
      <h4>Roles</h4>
      <span>User: search &amp; reuse</span>
      <span>Cataloguer: add &amp; maintain</span>
    </div>

  </div>

  <div class="wrap copy">
    © 2026 ComponentHub · Software Engineering project
  </div>
</footer>
`;

const main = $("#main");


/* ---------- session actions ---------- */

$("#logout").onclick = () => {
  C.logout();
  location.href = root + "login.html";
};


/* ---------- reusable component card ---------- */

// Render a reusable component summary card.
const card = c => `
<article class="card comp">

  <div class="row">
    <span class="ini">${E(c.name[0])}</span>
    <span class="badge${c.type === "Design" ? " d" : ""}">
      ${E(c.type)}
    </span>
  </div>

  <h3>
    <a href="${url("component")}?id=${c.id}">
      ${E(c.name)}
    </a>
  </h3>

  <p>${E(c.description)}</p>

  <div class="tags">
    ${
      [
        C.categoryPath(c.categoryId).split(" › ").pop(),
        C.tech(c),
        ...c.keywords.slice(0, 2)
      ]
        .filter(Boolean)
        .map(t => `<span>${E(t)}</span>`)
        .join("")
    }
  </div>

  <div class="row foot">
    <small>
      ${ic("activity")}
      ${c.usage.used} uses
    </small>

    <a href="${url("component")}?id=${c.id}">
      View details
      ${ic("arrow-right")}
    </a>
  </div>

</article>
`;


/* ---------- page heading ---------- */

// Render a standard page heading with title and supporting text.
const head = (t, s) => `
<section class="pagehead">
  <div class="wrap">
    <h1>${t}</h1>
    <p>${s}</p>
  </div>
</section>
`;


/* ---------- popular search chips ---------- */

// Render links for commonly used search terms.
const chips = a =>
  a
    .map(
      t =>
        `<a href="${url("search")}?q=${encodeURIComponent(t)}">${t}</a>`
    )
    .join("");

const POP = [
  "UI component",
  "Authentication",
  "Database",
  "API",
  "File handling",
  "Python"
];


/* ---------- HOME ---------- */

// Render the catalogue landing page and its summary statistics.
P.index = () => {

  const all = C.list();
  const tops = C.childrenOf(null);

  const used = sum(all, c => c.usage.used);
  const nu = sum(all, c => c.usage.queriedNotUsed);

  const recent = [...all]
    .sort(
      (a, b) =>
        b.addedOn.localeCompare(a.addedOn) ||
        b.id - a.id
    )
    .slice(0, 5);

  main.innerHTML = `
<section class="hero">

  <div class="wrap">

    <span class="eyebrow">
      DISCOVER · REUSE · BUILD FASTER
    </span>

    <h1>
      Find reusable components.<br>
      <em>Build software faster.</em>
    </h1>

    <p>
      Search a shared catalogue of code and design components,
      browse by category, and see what your peers actually reuse.
    </p>

    <form class="search" id="sf">
      ${ic("search")}

      <input
        id="q"
        placeholder="Search by keyword, name or technology…"
        autocomplete="off"
      >

      <button class="btn">
        Search
      </button>
    </form>

    <div class="chips">
      <b>Popular:</b>
      ${chips(POP)}
    </div>

  </div>

</section>

<section class="wrap">

  <div class="stats">

    ${[
      ["box", all.length, "Components"],
      ["folder", tops.length, "Categories"],
      ["bar-chart-3", used, "Total uses"],
      ["search", nu, "Search appearances (not used)"]
    ]
      .map(
        ([i, v, l]) => `
        <div class="stat">
          <span class="si">${ic(i)}</span>

          <div>
            <b>${v}</b>
            <small>${l}</small>
          </div>
        </div>
      `
      )
      .join("")}

  </div>


  <div class="two">

    <div class="card">

      <div class="ch">
        <h2>
          ${ic("clock-3")}
          Recently added
        </h2>

        <a href="${url("browse")}">
          View all
        </a>
      </div>

      ${recent
        .map(
          c => `
          <a
            class="li"
            href="${url("component")}?id=${c.id}"
          >

            <span class="ini">
              ${E(c.name[0])}
            </span>

            <div>
              <b>${E(c.name)}</b>
              <small>${E(c.description)}</small>
            </div>

            <div class="meta">
              <small>${c.addedOn}</small>
              <b>${c.usage.used} uses</b>
            </div>

          </a>
        `
        )
        .join("")}

    </div>


    <div class="card">

      <div class="ch">
        <h2>
          ${ic("folder")}
          Browse by category
        </h2>
      </div>

      ${tops
        .map(
          c => `
          <a
            class="li cat"
            href="${url("browse")}?category=${c.id}"
          >

            ${ic("folder")}

            <div>
              <b>${E(c.name)}</b>

              <small>
                ${
                  C.childrenOf(c.id)
                    .map(s => E(s.name))
                    .join(", ") || "&nbsp;"
                }
              </small>
            </div>

            <span class="count">
              ${C.list({ categoryId: c.id }).length}
            </span>

          </a>
        `
        )
        .join("")}

    </div>

  </div>


  <div class="card pad">

    <h2>
      ${ic("bar-chart-3")}
      Usage overview
    </h2>

    <div class="meter">
      <i
        style="width:${
          (used / (used + nu || 1)) * 100
        }%"
      ></i>
    </div>

    <div class="legend">

      <span>
        <i></i>
        ${used} used in projects
      </span>

      <span>
        <i class="y"></i>
        ${nu} shown in search, not used
      </span>

    </div>

  </div>

</section>
`;

  $("#sf").onsubmit = e => {
    e.preventDefault();

    const v = $("#q").value.trim();

    if (v) {
      location.href =
        `${url("search")}?q=${encodeURIComponent(v)}`;
    }
  };
};


/* ---------- BROWSE ---------- */

// Render the browse page with category, type, technology, and sort filters.
P.browse = () => {

  const req = qs.get("category");

  const m = C._d.categories.find(
    c =>
      String(c.id) === req ||
      c.name === req
  );

  const cat = m ? m.id : null;


  const tree = p =>
    C.childrenOf(p)
      .map(
        c => `
        <li>

          <a
            class="${c.id === cat ? "on" : ""}"
            href="?category=${c.id}"
          >

            ${ic("folder")}

            <span>
              ${E(c.name)}
            </span>

            <b>
              ${C.list({ categoryId: c.id }).length}
            </b>

          </a>

          ${
            C.childrenOf(c.id).length
              ? `<ul>${tree(c.id)}</ul>`
              : ""
          }

        </li>
      `
      )
      .join("");


  const base = C.list({
    categoryId: cat
  });

  const techs = [
    ...new Set(
      base
        .map(c => C.tech(c))
        .filter(Boolean)
    )
  ].sort();


  main.innerHTML =
    head(
      "Browse components",
      cat
        ? E(C.categoryPath(cat))
        : "Explore reusable components organised by category."
    ) +

    `
<div class="wrap side">

  <aside class="card pad">

    <h3>Categories</h3>

    <ul class="tree">

      <li>

        <a
          class="${cat == null ? "on" : ""}"
          href="browse.html"
        >

          ${ic("layers")}

          <span>
            All components
          </span>

          <b>
            ${C.list().length}
          </b>

        </a>

      </li>

      ${tree(null)}

    </ul>

  </aside>


  <section>

    <div class="card filters">

      <div class="search sm">

        ${ic("search")}

        <input
          id="f"
          placeholder="Filter by name, description, keyword…"
        >

      </div>


      <select id="t">

        <option value="">
          All types
        </option>

        <option>
          Code
        </option>

        <option>
          Design
        </option>

      </select>


      <select id="l">

        <option value="">
          All languages / notations
        </option>

        ${techs
          .map(t => `<option>${E(t)}</option>`)
          .join("")}

      </select>


      <select id="s">

        <option value="name">
          Name
        </option>

        <option value="usage">
          Most used
        </option>

        <option value="new">
          Newest
        </option>

      </select>

    </div>


    <p class="muted" id="n"></p>

    <div class="grid" id="g"></div>

  </section>

</div>
`;


  // Recompute browse results whenever a filter or sort option changes.
  const draw = () => {

    const f =
      $("#f").value
        .toLowerCase()
        .trim();

    const s = $("#s").value;


    const d = base.filter(
      c =>
        (!$("#t").value ||
          c.type === $("#t").value) &&

        (!$("#l").value ||
          C.tech(c) === $("#l").value) &&

        (!f ||
          [c.name, c.description, ...c.keywords]
            .join(" ")
            .toLowerCase()
            .includes(f))
    );


    d.sort(
      s === "usage"
        ? (a, b) =>
            b.usage.used -
            a.usage.used

        : s === "new"
        ? (a, b) =>
            b.addedOn.localeCompare(
              a.addedOn
            ) ||
            b.id - a.id

        : (a, b) =>
            a.name.localeCompare(
              b.name
            )
    );


    $("#n").textContent =
      `${d.length} component${
        d.length === 1 ? "" : "s"
      }`;


    $("#g").innerHTML =
      d.map(card).join("") ||
      `
      <div class="empty card">
        No components match your filters.
      </div>
      `;

    lucide.createIcons();
  };


  ["#f", "#t", "#l", "#s"].forEach(
    i =>
      $(i).addEventListener(
        "input",
        draw
      )
  );

  draw();
};


/* ---------- SEARCH ---------- */

// Render the search page and display matching catalogue components.
P.search = () => {

  main.innerHTML =
    head(
      "Search components",
      "Find reusable components by name, keyword, category or technology."
    ) +

    `
<div class="wrap">

  <form class="search big" id="sf">

    ${ic("search")}

    <input
      id="q"
      placeholder="e.g. authentication python"
      autocomplete="off"
    >

    <button class="btn">
      Search
    </button>

  </form>


  <div class="chips">
    <b>Popular:</b>
    ${chips(POP)}
  </div>


  <h2 id="rt" class="rt"></h2>

  <div class="grid" id="g"></div>

</div>
`;


  let lastSearchedQuery = null;

  // Execute the current search query and render its results.
  const run = async (force = false) => {

    const v = $("#q").value.trim();

    if (!force && v === lastSearchedQuery && lastSearchedQuery !== null) {
      return;
    }
    lastSearchedQuery = v;

    const r =
      v
        ? await C.search(v)
        : C.list();


    $("#rt").textContent =
      v
        ? `${r.length} result${
            r.length === 1 ? "" : "s"
          } for “${v}”`

        : `All components (${r.length})`;


    $("#g").innerHTML =
      r.map(card).join("") ||
      `
      <div class="empty card">
        No components found.
        Try fewer or different keywords.
      </div>
      `;

    lucide.createIcons();
  };


  $("#sf").onsubmit = async e => {

    e.preventDefault();

    const query = $("#q").value.trim();

    history.replaceState(
      null,
      "",
      query
        ? `?q=${encodeURIComponent(query)}`
        : "search.html"
    );

    await run();
  };

  // Allow clicking popular chips to search in-place without page reload
  document.querySelectorAll(".chips a").forEach(chip => {
    chip.onclick = async e => {
      e.preventDefault();
      const chipText = chip.textContent.trim();
      $("#q").value = chipText;
      history.replaceState(
        null,
        "",
        `?q=${encodeURIComponent(chipText)}`
      );
      await run();
    };
  });


  $("#q").value =
    qs.get("q") || "";

  run(true).catch(showError);
};


/* ---------- COMPONENT DETAILS ---------- */

// Load and render a component detail page with reuse actions.
P.component = async () => {
  const id = Number(qs.get("id"));
  const notice = componentNotice;
  componentNotice = "";

  let c = C.get(id);

  if (!c) {
    main.innerHTML = `
      <div class="wrap">
        <div class="card pad">Loading component...</div>
      </div>
    `;

    try {
      c = await C.getComponent(id);
    } catch (err) {
      if (err.status === 404) {
        main.innerHTML =
          head("Component not found", "It may have been removed.") +
          `
          <div class="wrap">
            <a class="btn" href="${url("browse")}">Back to browse</a>
          </div>
          `;
        return;
      }
      showError(err);
      return;
    }
  }

  if (!c) {
    main.innerHTML =
      head("Component not found", "It may have been removed.") +
      `
      <div class="wrap">
        <a class="btn" href="${url("browse")}">Back to browse</a>
      </div>
      `;
    return;
  }

  const rel = C.list({ categoryId: c.categoryId })
    .filter(x => x.id !== id)
    .slice(0, 3);

  // Helpers for Code Components and Multi-File Packages
  const categorizeCodeArtifact = art => {
    const filename = String(art.downloadFilename || art.name || "").toLowerCase();
    const format = String(art.artifactFormat || "").toLowerCase();
    if (filename.includes("test") || filename.includes("spec") || filename.startsWith("tests/") || filename.includes("__tests__")) {
      return "tests";
    }
    if (filename.includes("readme") || filename.endsWith(".md") || filename.includes("license") || filename.startsWith("docs/")) {
      return "readme";
    }
    if (
      ["package.json", "tsconfig.json", "dockerfile", ".dockerignore", ".env.example", ".gitignore", "cargo.toml", "pom.xml", "makefile"].some(c => filename.includes(c)) ||
      (["yaml", "yml", "json", "dockerfile", "xml"].includes(format) && (filename.includes("config") || filename.includes("setting") || filename.includes(".env") || filename.includes("package") || filename.includes("docker") || filename.includes("tsconfig")))
    ) {
      return "config";
    }
    if (filename.includes("example") || filename.includes("sample") || filename.includes("demo")) {
      return "examples";
    }
    return "source";
  };

  const highlightCodeLine = (lineStr, format) => {
    const escaped = E(lineStr);
    const fmt = String(format || "").toLowerCase();
    if (["txt", "text"].includes(fmt)) return escaped;

    // Comments
    if (/^\s*(\/\/|#|--|\/\*|\*)/.test(lineStr)) {
      return `<span class="token-com">${escaped}</span>`;
    }

    let res = escaped;
    // Strings
    res = res.replace(/(["'`])(?:(?=(\\?))\2.)*?\1/g, '<span class="token-str">$&</span>');

    // Keywords
    const kwRegex = /\b(const|let|var|function|return|import|export|from|as|default|class|extends|implements|interface|type|enum|public|private|protected|async|await|try|catch|finally|throw|new|typeof|instanceof|if|else|switch|case|break|continue|for|while|do|in|of|def|self|None|True|False|elif|lambda|with|yield|pass|struct|fn|pub|impl|mut|match|trait|where|select|from|where|insert|into|values|update|set|delete|create|table|drop|alter|null|true|false)\b/gi;
    res = res.replace(kwRegex, match => `<span class="token-kw">${match}</span>`);

    // Numbers
    res = res.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="token-num">$1</span>');

    return res;
  };

  const renderCodeLines = (content, format) => {
    if (!content) return '<div class="code-line"><span class="line-num">1</span><span class="line-text" style="color:#64748b;">(empty file)</span></div>';
    const lines = String(content).split(/\r?\n/);
    return lines.map((line, idx) => `
      <div class="code-line">
        <span class="line-num">${idx + 1}</span>
        <span class="line-text">${highlightCodeLine(line, format)}</span>
      </div>
    `).join("");
  };

  // Phase A & B: Artifact normalization
  const rawArtifacts = Array.isArray(c.artifacts) ? [...c.artifacts].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.id - b.id) : [];

  // If Code component and no artifacts, synthesize primary artifacts from content or metadata
  const getSynthesizedCodeArtifacts = () => {
    if (rawArtifacts.length > 0) return rawArtifacts;

    if (c.artifactContent) {
      const ext = { javascript: "js", typescript: "ts", python: "py", json: "json", yaml: "yaml", markdown: "md", html: "html", css: "css" }[c.artifactFormat] || "txt";
      return [{
        id: 0,
        componentId: c.id,
        name: `${c.name} Source`,
        description: c.usageNotes || c.description || "Primary component source file",
        variantType: "Source",
        deliveryMethod: c.deliveryMethod || "Editable Source",
        artifactFormat: c.artifactFormat || (c.tech || "typescript").toLowerCase(),
        content: c.artifactContent,
        binaryContent: null,
        downloadFilename: `${(c.name || "code").toLowerCase().replace(/[^a-z0-9._-]/g, "-")}.${ext}`,
        reuseMethod: c.reuseMethod || "Copy and edit",
        isPrimary: true,
        sortOrder: 0
      }];
    }

    if (c.type === "Code") {
      const cleanName = (c.name || "component").toLowerCase().replace(/[^a-z0-9._-]/g, "-");
      const tech = String(c.tech || c.language || "").toLowerCase();
      let ext = "js";
      if (tech.includes("python") || tech.includes("py")) ext = "py";
      else if (tech.includes("typescript") || tech.includes("ts") || tech.includes("react")) ext = "ts";
      else if (tech.includes("javascript") || tech.includes("js") || tech.includes("node")) ext = "js";
      else if (tech.includes("c#") || tech.includes("csharp")) ext = "cs";
      else if (tech.includes("java")) ext = "java";
      else if (tech.includes("c++") || tech.includes("cpp")) ext = "cpp";
      else if (tech.includes("go")) ext = "go";
      else if (tech.includes("rust")) ext = "rs";
      else if (tech.includes("sql")) ext = "sql";
      else if (tech.includes("yaml") || tech.includes("yml")) ext = "yaml";
      else if (tech.includes("json")) ext = "json";
      else if (tech.includes("html")) ext = "html";
      else if (tech.includes("css")) ext = "css";

      const list = [];

      // 1. Example / Starter File
      if (c.exampleContent) {
        list.push({
          id: 0,
          componentId: c.id,
          name: `Example Usage (${c.name})`,
          description: "Integration and usage example snippet",
          variantType: "Example",
          deliveryMethod: c.deliveryMethod || "Package",
          artifactFormat: ext,
          content: c.exampleContent,
          binaryContent: null,
          downloadFilename: `example.${ext}`,
          reuseMethod: c.reuseMethod || "Install package",
          isPrimary: true,
          sortOrder: 0
        });
      }

      // 2. README Documentation File
      const readmeDoc = [
        `# ${c.name}`,
        "",
        c.description || "",
        "",
        c.installCommand ? `## Installation\n\`\`\`bash\n${c.installCommand}\n\`\`\`\n` : "",
        c.reuseMethod ? `## Reuse Approach\n${c.reuseMethod}\n` : "",
        c.usageNotes ? `## Usage Guidance\n${c.usageNotes}\n` : "",
        c.exampleContent ? `## Example Adaptation\n\`\`\`${ext}\n${c.exampleContent}\n\`\`\`\n` : "",
        c.url ? `## Official Reference\n[${c.name} Documentation & Repository](${c.url})\n` : ""
      ].filter(Boolean).join("\n");

      list.push({
        id: 0,
        componentId: c.id,
        name: "README & Docs",
        description: "Component setup and integration guide",
        variantType: "Documentation",
        deliveryMethod: c.deliveryMethod || "Package",
        artifactFormat: "markdown",
        content: readmeDoc,
        binaryContent: null,
        downloadFilename: "README.md",
        reuseMethod: c.reuseMethod || "Install package",
        isPrimary: !c.exampleContent,
        sortOrder: 1
      });

      // 3. Starter Package Configuration
      if (c.installCommand && (ext === "js" || ext === "ts")) {
        const pkgContent = JSON.stringify({
          name: cleanName,
          version: "1.0.0",
          description: c.description || "",
          main: `example.${ext}`,
          scripts: { start: `node example.${ext}` }
        }, null, 2);
        list.push({
          id: 0,
          componentId: c.id,
          name: "package.json",
          description: "Starter npm package configuration",
          variantType: "Config",
          deliveryMethod: "Package",
          artifactFormat: "json",
          content: pkgContent,
          binaryContent: null,
          downloadFilename: "package.json",
          reuseMethod: "Install package",
          isPrimary: false,
          sortOrder: 2
        });
      } else if (c.installCommand && ext === "py") {
        const pkgMatch = c.installCommand.match(/pip\s+install\s+([a-zA-Z0-9_\-]+)/);
        const reqText = pkgMatch ? `${pkgMatch[1]}\n` : `# Dependencies for ${c.name}\n`;
        list.push({
          id: 0,
          componentId: c.id,
          name: "requirements.txt",
          description: "Python package requirements",
          variantType: "Config",
          deliveryMethod: "Package",
          artifactFormat: "txt",
          content: reqText,
          binaryContent: null,
          downloadFilename: "requirements.txt",
          reuseMethod: "Install package",
          isPrimary: false,
          sortOrder: 2
        });
      }

      return list;
    }

    return [];
  };

  const codeArtifacts = getSynthesizedCodeArtifacts();

  // Design component artifact groups (grouped strictly by variantType)
  const designGroupsMap = rawArtifacts.reduce((groups, artifact) => {
    const key = artifact.variantType || artifact.name || "General Template";
    (groups[key] ??= []).push(artifact);
    return groups;
  }, {});

  for (const key in designGroupsMap) {
    designGroupsMap[key].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }
  const designGroups = Object.entries(designGroupsMap);

  // Active state indices
  let activeVariantIdx = 0;
  let activeFormatIdx = 0;
  let activeCodeCat = "all";
  let activeFileIdx = 0;

  const qualityChecks = [
    ["Name", Boolean(c.name)],
    ["Description", Boolean(c.description)],
    ["Category", Boolean(c.categoryPath)],
    ["Technology / notation", Boolean(C.tech(c))],
    ["Keywords", c.keywords.length > 0],
    ["Reusable material", (rawArtifacts.length > 0) || Boolean(c.artifactContent)],
    ["Reuse guidance", Boolean(c.reuseMethod || c.usageNotes)],
    ["Reference", c.type === "Code" ? Boolean(c.url) : Boolean(c.url || (rawArtifacts.length > 0))]
  ];
  const qualityScore = Math.round(
    qualityChecks.filter(([, passed]) => passed).length / qualityChecks.length * 100
  );

  // Design helpers
  const getActiveDesignArtifacts = () => {
    if (!designGroups.length) return [];
    const group = designGroups[activeVariantIdx] || designGroups[0];
    return group ? group[1] : [];
  };

  const getActiveDesignArtifact = () => {
    const currentArtifacts = getActiveDesignArtifacts();
    if (!currentArtifacts.length) return null;
    return currentArtifacts[activeFormatIdx] || currentArtifacts[0];
  };

  // Code categorization buckets
  const codeBuckets = {
    all: codeArtifacts,
    source: codeArtifacts.filter(a => categorizeCodeArtifact(a) === "source"),
    readme: codeArtifacts.filter(a => categorizeCodeArtifact(a) === "readme"),
    tests: codeArtifacts.filter(a => categorizeCodeArtifact(a) === "tests"),
    config: codeArtifacts.filter(a => categorizeCodeArtifact(a) === "config"),
    examples: codeArtifacts.filter(a => categorizeCodeArtifact(a) === "examples")
  };

  const getActiveCodeFiles = () => {
    const list = codeBuckets[activeCodeCat];
    if (list && list.length > 0) return list;
    return codeBuckets.all;
  };

  const getActiveCodeArtifact = () => {
    const list = getActiveCodeFiles();
    if (!list.length) return null;
    return list[activeFileIdx] || list[0];
  };

  const curDesignGroup = designGroups[activeVariantIdx] || (designGroups.length ? designGroups[0] : null);
  const curDesignVariantName = curDesignGroup ? curDesignGroup[0] : "Default";
  const curDesignArtifacts = getActiveDesignArtifacts();
  const curDesignArtifact = getActiveDesignArtifact();

  const curCodeArtifacts = getActiveCodeFiles();
  const curCodeArtifact = getActiveCodeArtifact();

  main.innerHTML = `
<section class="pagehead">
  <div class="wrap">
    <nav class="crumb">
      <a href="${url("index")}">Home</a> /
      <a href="${url("browse")}">Browse</a> /
      ${E(c.name)}
    </nav>
    <div class="dh">
      <span class="ini xl">${E(c.name[0])}</span>
      <div>
        <span class="badge${c.type === "Design" ? " d" : ""}">${E(c.type)}</span>
        ${C.tech(c) ? `<span class="badge" style="background:#f1f5f9;color:#334155;margin-left:4px;">${E(C.tech(c))}</span>` : ""}
        <h1>${E(c.name)}</h1>
        <p>${E(C.categoryPath(c.categoryId))}</p>
      </div>
    </div>
  </div>
</section>

<div class="wrap">
  ${notice ? `<p class="ok">${E(notice)}</p>` : ""}
</div>

<div class="wrap detail">
  <section>
    <!-- About Card -->
    <div class="card pad">
      <h2>About</h2>
      <p>${E(c.description)}</p>
      <div class="quality">
        <strong>Component quality: ${qualityScore}%</strong>
        <div class="quality-bar"><span style="width:${qualityScore}%"></span></div>
        <small>${qualityChecks.filter(([, passed]) => passed).length}/${qualityChecks.length} quality checks passed</small>
      </div>
      <h3>Keywords</h3>
      <div class="tags">
        ${c.keywords.map(k => `<span>${E(k)}</span>`).join("") || '<small class="muted">No keywords yet</small>'}
      </div>
    </div>

    <!-- CODE COMPONENT VIEW (Phase 1 & 2) -->
    ${c.type === "Code" && codeArtifacts.length ? `
      <div class="code-package-card">
        <!-- Package Header -->
        <div class="code-package-header">
          <div>
            <div class="code-package-meta">
              <span class="code-meta-badge lang">${ic("code")} ${E(C.tech(c) || curCodeArtifact?.artifactFormat || "Code")}</span>
              <span class="code-meta-badge files-count">${ic("package")} ${codeArtifacts.length} ${codeArtifacts.length === 1 ? "file" : "files"} in package</span>
              ${curCodeArtifact?.deliveryMethod ? `<span class="code-meta-badge">${E(curCodeArtifact.deliveryMethod)}</span>` : ""}
            </div>
            <h2 style="margin-top:8px;font-size:16px;">Multi-File Code Package</h2>
          </div>
          <div class="code-viewer-actions">
            <button type="button" class="btn" id="btn-download-zip" title="Download all files in this component as a ZIP package">
              ${ic("archive")} Download ZIP Package
            </button>
            <button type="button" class="btn ghost" id="btn-code-open-editor">
              ${ic("file-text")} Interactive Editor
            </button>
            <button type="button" class="btn ghost" id="btn-code-copy">
              ${ic("copy")} Copy File
            </button>
            <button type="button" class="btn ghost" id="btn-code-download">
              ${ic("download")} Download File
            </button>
            ${role === "Cataloguer" ? `
              <button type="button" class="btn ghost sm" id="add-artifact-trigger" title="Add a file to this code package">
                ${ic("plus")} Add File
              </button>
              <button type="button" class="btn ghost sm" id="btn-code-edit" title="Edit active file metadata/content">
                ${ic("pencil")} Edit
              </button>
              <button type="button" class="btn danger sm" id="btn-code-del" title="Delete active file">
                ${ic("trash-2")} Delete
              </button>
            ` : ""}
          </div>
        </div>

        <!-- Category Tabs -->
        <div class="code-cat-nav" id="code-cat-nav-container">
          <button type="button" class="code-cat-tab ${activeCodeCat === "all" ? "on" : ""}" data-cat="all">
            ${ic("folder")} All Files <span class="count-badge">${codeBuckets.all.length}</span>
          </button>
          ${codeBuckets.source.length ? `
            <button type="button" class="code-cat-tab ${activeCodeCat === "source" ? "on" : ""}" data-cat="source">
              ${ic("file-code")} Source <span class="count-badge">${codeBuckets.source.length}</span>
            </button>
          ` : ""}
          ${codeBuckets.readme.length ? `
            <button type="button" class="code-cat-tab ${activeCodeCat === "readme" ? "on" : ""}" data-cat="readme">
              ${ic("file-text")} README & Docs <span class="count-badge">${codeBuckets.readme.length}</span>
            </button>
          ` : ""}
          ${codeBuckets.tests.length ? `
            <button type="button" class="code-cat-tab ${activeCodeCat === "tests" ? "on" : ""}" data-cat="tests">
              ${ic("check-circle")} Tests <span class="count-badge">${codeBuckets.tests.length}</span>
            </button>
          ` : ""}
          ${codeBuckets.config.length ? `
            <button type="button" class="code-cat-tab ${activeCodeCat === "config" ? "on" : ""}" data-cat="config">
              ${ic("settings")} Config <span class="count-badge">${codeBuckets.config.length}</span>
            </button>
          ` : ""}
          ${codeBuckets.examples.length ? `
            <button type="button" class="code-cat-tab ${activeCodeCat === "examples" ? "on" : ""}" data-cat="examples">
              ${ic("play")} Examples <span class="count-badge">${codeBuckets.examples.length}</span>
            </button>
          ` : ""}
        </div>

        <!-- File Switcher Navigation -->
        <div class="code-files-nav" id="code-files-nav-container">
          ${curCodeArtifacts.map((art, idx) => `
            <button type="button" class="code-file-tab ${idx === activeFileIdx ? "on" : ""}" data-file-idx="${idx}">
              <span class="file-ext-tag">${E(art.artifactFormat || "file")}</span>
              <span>${E(art.downloadFilename || art.name)}</span>
            </button>
          `).join("")}
        </div>

        <!-- Code Viewer Toolbar -->
        <div class="code-viewer-toolbar">
          <div class="code-viewer-file-info" id="code-viewer-file-info">
            <span>${ic("file")} <b>${E(curCodeArtifact?.downloadFilename || curCodeArtifact?.name || "file")}</b></span>
            <span>•</span>
            <span>${E(curCodeArtifact?.artifactFormat || "text")}</span>
            <span>•</span>
            <span>${curCodeArtifact?.content ? String(curCodeArtifact.content).split(/\r?\n/).length : 0} lines (${curCodeArtifact?.content ? curCodeArtifact.content.length : 0} chars)</span>
          </div>
          <div class="code-viewer-actions">
            <button type="button" id="btn-toggle-wrap">
              ${ic("align-left")} Wrap Lines
            </button>
          </div>
        </div>

        <!-- Line Numbered & Syntax Highlighted Code Viewer -->
        <div class="code-viewer-wrap" id="code-viewer-wrap">
          <div class="code-viewer-lines" id="code-viewer-lines">
            ${renderCodeLines(curCodeArtifact?.content, curCodeArtifact?.artifactFormat)}
          </div>
        </div>
      </div>
    ` : ""}

    <!-- DESIGN COMPONENT VIEW (Diagrams, ERD, Visual Renderers) -->
    ${c.type === "Design" && designGroups.length ? `
      <div class="card pad" style="margin-top:18px;">
        <div class="row" style="align-items:flex-start;">
          <div>
            <h2>${C.tech(c) === "ERD" ? "Reusable ERD Variants" : "Reusable Diagram & Design Variants"}</h2>
            <p class="muted" style="margin-top:2px;">Select a design variant below to preview, edit, copy, or download.</p>
          </div>
          ${role === "Cataloguer" ? `<button class="btn ghost sm" id="add-artifact-trigger" type="button">${ic("plus")} Add artifact</button>` : ""}
        </div>

        <!-- Variant Tabs -->
        <div class="variant-nav">
          ${designGroups.map(([vName], idx) => `
            <button type="button" class="variant-tab ${idx === activeVariantIdx ? "on" : ""}" data-variant-idx="${idx}">
              ${E(vName)}
            </button>
          `).join("")}
        </div>

        <!-- Main Diagram Viewer Card -->
        <div class="diagram-card">
          <div class="diagram-toolbar">
            <div class="diagram-format-pills" id="format-pills-container">
              ${curDesignArtifacts.map((art, fIdx) => `
                <button type="button" class="format-pill ${fIdx === activeFormatIdx ? "on" : ""}" data-format-idx="${fIdx}">
                  ${E(art.artifactFormat)}
                </button>
              `).join("")}
            </div>
            <div class="diagram-actions">
              <button type="button" class="btn ghost sm" id="btn-open-erd-editor">
                ${ic("layout")} Open Interactive Editor
              </button>
              <button type="button" class="btn ghost sm" id="btn-active-copy">
                ${ic("copy")} Copy Source
              </button>
              <button type="button" class="btn ghost sm" id="btn-active-download">
                ${ic("download")} Download
              </button>
              ${role === "Cataloguer" ? `
                <button type="button" class="btn ghost sm" id="btn-active-edit" title="Edit this artifact">
                  ${ic("pencil")} Edit
                </button>
                <button type="button" class="btn danger sm" id="btn-active-del" title="Delete this artifact">
                  ${ic("trash-2")} Delete
                </button>
              ` : ""}
            </div>
          </div>

          <!-- Description banner -->
          <div style="padding:10px 18px;background:#f8fafc;border-bottom:1px solid var(--line);font-size:13px;color:#334155;" id="cur-artifact-desc">
            ${E(curDesignArtifact?.description || curDesignVariantName)}
          </div>

          <!-- Canvas Preview Area -->
          <div id="main-diagram-viewport" class="diagram-canvas-container"></div>

          <!-- Collapsible Source / Code View -->
          <details class="collapsible-source" id="active-source-details">
            <summary>
              <span id="active-source-label">${ic("code")} View <b>${E(curDesignArtifact?.artifactFormat || "source")}</b> (${E(curDesignArtifact?.downloadFilename || "artifact")})</span>
              <small class="muted">Click to toggle</small>
            </summary>
            <div class="collapsible-source-body">
              <pre class="source-pre"><code id="active-source-code">${E(curDesignArtifact?.content || "")}</code></pre>
            </div>
          </details>
        </div>
      </div>
    ` : ""}

    <!-- Usage and Adaptation details -->
    ${c.usageNotes || c.exampleContent ? `
      <div class="card pad" style="margin-top:18px;">
        <h2>How to use this component</h2>
        ${c.usageNotes ? `<p>${E(c.usageNotes)}</p>` : ""}
        ${c.exampleContent ? `
          <h3 style="margin-top:12px;">Example adaptation</h3>
          <p>${E(c.exampleContent)}</p>
        ` : ""}
      </div>
    ` : ""}

    <!-- Cataloguer empty state helper -->
    ${role === "Cataloguer" && !rawArtifacts.length && !c.artifactContent ? `
      <div class="card pad artifact-editor-empty" style="margin-top:18px;">
        <h2>Reusable artifacts</h2>
        <p class="muted">Add reusable source files, multi-file packages, diagrams, or templates for this component.</p>
        <button class="btn ghost" id="add-artifact-trigger" type="button">${ic("plus")} Add artifact</button>
      </div>
    ` : ""}

    <!-- Cataloguer Artifact Management & Reordering Card (Phase 3) -->
    ${role === "Cataloguer" && rawArtifacts.length > 0 ? `
      <div class="card pad artifact-manager-card">
        <div class="artifact-manager-header">
          <div>
            <h2>Package Artifacts & Ordering (${rawArtifacts.length})</h2>
            <p class="muted" style="margin-top:2px;">Reorder files or edit metadata for multi-file components.</p>
          </div>
          <button class="btn ghost sm" id="add-artifact-trigger" type="button">${ic("plus")} Add File / Artifact</button>
        </div>
        <div class="artifact-manager-list" id="artifact-manager-list">
          ${rawArtifacts.map((art, idx) => `
            <div class="artifact-manager-item" data-art-id="${art.id}">
              <div class="artifact-manager-info">
                <div class="artifact-manager-name">
                  <span style="color:#64748b;font-size:12px;font-weight:700;">#${idx + 1}</span>
                  <span>${E(art.downloadFilename || art.name)}</span>
                  <span class="code-meta-badge">${E(art.artifactFormat)}</span>
                  ${art.variantType ? `<span class="code-meta-badge" style="background:#f1f5f9;">${E(art.variantType)}</span>` : ""}
                </div>
                <div class="artifact-manager-sub">
                  ${E(art.description || "No description")} • ${art.content ? art.content.length : 0} bytes
                </div>
              </div>
              <div class="artifact-manager-actions">
                <button type="button" class="reorder-btn btn-move-up" data-idx="${idx}" ${idx === 0 ? "disabled" : ""} title="Move file up in package order">
                  ▲ Up
                </button>
                <button type="button" class="reorder-btn btn-move-down" data-idx="${idx}" ${idx === rawArtifacts.length - 1 ? "disabled" : ""} title="Move file down in package order">
                  ▼ Down
                </button>
                <button type="button" class="btn ghost sm btn-item-edit" data-art-id="${art.id}" title="Edit artifact">
                  ${ic("pencil")} Edit
                </button>
                <button type="button" class="btn danger sm btn-item-del" data-art-id="${art.id}" title="Delete artifact">
                  ${ic("trash-2")}
                </button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    ` : ""}

    <!-- Cataloguer Add / Edit Artifact Form (Always in DOM when role is Cataloguer) -->
    ${role === "Cataloguer" ? `
      <form id="artifact-editor" class="card pad artifact-editor" style="margin-top:16px;" hidden>
        <h3 id="artifact-editor-title">Add reusable artifact</h3>
        <p class="bad" id="artifact-editor-error" hidden></p>
        <div class="cols">
          <label>Name *<input id="artifact-name" required placeholder="e.g. Repository Class"></label>
          <label>Variant / Category *<input id="artifact-variant" required placeholder="e.g. Source, Example, or Default"></label>
        </div>
        <label>Description *<textarea id="artifact-description" rows="2" required placeholder="Describe this file and its role in the component"></textarea></label>
        <div class="cols">
          <label>Delivery method *<input id="artifact-delivery" required placeholder="Editable Source"></label>
          <label>Format *
            <select id="artifact-format" required>
              ${[
                "typescript", "javascript", "python", "json", "yaml", "markdown",
                "html", "css", "sql", "sh", "bash", "go", "rust", "java", "c", "cpp", "csharp", "php", "ruby", "dockerfile", "xml", "txt",
                "mermaid", "plantuml", "drawio", "svg", "png"
              ].map(format => `<option value="${format}">${format}</option>`).join("")}
            </select>
          </label>
        </div>
        <label>Source / Content *<textarea id="artifact-content" rows="8" required placeholder="Paste file content or source code here"></textarea></label>
        <label>Optional artifact file<input id="artifact-file" type="file" accept=".mmd,.puml,.drawio,.svg,.png,.md,.js,.mjs,.cjs,.ts,.tsx,.py,.json,.yaml,.yml,.txt,.html,.css,.sql,.sh,.bash,.go,.rs,.java,.c,.cpp,.h,.hpp,.cs,.php,.rb,.xml,Dockerfile"></label>
        <div class="cols">
          <label>Download filename / Relative path *<input id="artifact-filename" required placeholder="e.g. src/Repository.ts or README.md"></label>
          <label>Reuse method *<input id="artifact-reuse" required placeholder="e.g. Copy and edit"></label>
        </div>
        <div class="actions">
          <button class="btn ghost" id="artifact-cancel" type="button">Cancel</button>
          <button class="btn" type="submit">Save artifact</button>
        </div>
      </form>
    ` : ""}

    <!-- Related Components -->
    ${rel.length ? `
      <h2 class="rt">More in this category</h2>
      <div class="grid">
        ${rel.map(card).join("")}
      </div>
    ` : ""}
  </section>

  <!-- Sidebar Column -->
  <aside>
    <div class="card pad">
      <button class="btn block" id="use">
        ${ic("check")} Use this component
      </button>

      ${c.type === "Code" && c.installCommand ? `
        <button class="btn ghost block" id="copy-install" type="button">
          ${ic("terminal")} Copy installation command
        </button>
      ` : ""}

      ${role === "Cataloguer" ? `
        <button class="btn ghost block" id="edit">
          ${ic("pencil")} Edit
        </button>
        <button class="btn ghost block" id="kw">
          ${ic("tags")} Edit keywords
        </button>
        <button class="btn danger block" id="del">
          ${ic("trash-2")} Delete
        </button>
      ` : ""}
    </div>

    <div class="card pad">
      <h3>Ways to reuse this component</h3>
      <div class="tags">
        ${c.installCommand ? `
          <button type="button" class="btn-tag-action" id="tag-copy-install" title="Copy ${E(c.installCommand)}">
            ${ic("terminal")} Install package
          </button>
        ` : (c.deliveryMethod ? `<span class="btn-tag-action primary">${E(c.deliveryMethod)}</span>` : "")}

        <button type="button" class="btn-tag-action primary" id="tag-download-pkg" title="Download component ZIP package">
          ${ic("archive")} ${c.type === "Design" ? "Diagram Package" : "Code Package (ZIP)"}
        </button>

        ${c.url ? `
          <a href="${E(c.url)}" target="_blank" rel="noopener noreferrer" class="btn-tag-action" id="tag-open-repo" title="Open official documentation or repository">
            ${ic("external-link")} Reference repository
          </a>
        ` : `
          <span class="tag-unavailable" title="No repository URL specified">
            ${ic("slash")} No repository linked
          </span>
        `}
      </div>
      ${c.reuseMethod ? `<p class="reuse-method" style="margin-top:10px;"><strong>Recommended approach:</strong> ${E(c.reuseMethod)}</p>` : ""}
    </div>

    <div class="card pad">
      <h3>Usage activity</h3>
      <div class="kv">
        <span>Times this component was used</span>
        <b id="usage-used">${c.usage.used}</b>
      </div>
      <div class="kv">
        <span>Search views without use</span>
        <b>${c.usage.queriedNotUsed}</b>
      </div>
    </div>

    <div class="card pad">
      <h3>Details</h3>
      <div class="kv">
        <span>${c.type === "Design" ? "Notation" : "Language"}</span>
        <b>${E(C.tech(c) || "—")}</b>
      </div>
      <div class="kv">
        <span>Added</span>
        <b>${c.addedOn}</b>
      </div>
      ${c.url ? `
        <div class="kv">
          <span>Documentation</span>
          <a href="${E(c.url)}" target="_blank" rel="noopener noreferrer">Open documentation</a>
        </div>
      ` : ""}
    </div>
  </aside>
</div>
`;

  // Recording reuse helper
  const recordReuse = async () => {
    const updated = await C.markUsed(id);
    c.usage = updated.usage;
    const usage = $("#usage-used");
    if (usage) usage.textContent = String(c.usage.used);
  };

  /* =========================================================
     CODE COMPONENT INTERACTIVITY (Phase 1 & 2)
     ========================================================= */
  const updateActiveCodeFile = () => {
    const currentFiles = getActiveCodeFiles();
    if (activeFileIdx >= currentFiles.length) activeFileIdx = 0;
    const artifact = currentFiles[activeFileIdx] || currentFiles[0];

    // Sync category tabs
    document.querySelectorAll(".code-cat-tab").forEach(tab => {
      tab.classList.toggle("on", tab.dataset.cat === activeCodeCat);
    });

    // Sync file switcher tabs
    const filesNav = $("#code-files-nav-container");
    if (filesNav) {
      filesNav.innerHTML = currentFiles.map((art, idx) => `
        <button type="button" class="code-file-tab ${idx === activeFileIdx ? "on" : ""}" data-file-idx="${idx}">
          <span class="file-ext-tag">${E(art.artifactFormat || "file")}</span>
          <span>${E(art.downloadFilename || art.name)}</span>
        </button>
      `).join("");

      filesNav.querySelectorAll(".code-file-tab").forEach(tab => {
        tab.onclick = () => {
          activeFileIdx = Number(tab.dataset.fileIdx);
          updateActiveCodeFile();
        };
      });
    }

    // Sync file info header
    const fileInfo = $("#code-viewer-file-info");
    if (fileInfo && artifact) {
      const lineCount = artifact.content ? String(artifact.content).split(/\r?\n/).length : 0;
      fileInfo.innerHTML = `
        <span>${ic("file")} <b>${E(artifact.downloadFilename || artifact.name || "file")}</b></span>
        <span>•</span>
        <span>${E(artifact.artifactFormat || "text")}</span>
        <span>•</span>
        <span>${lineCount} lines (${artifact.content ? artifact.content.length : 0} chars)</span>
      `;
    }

    // Sync lines
    const linesContainer = $("#code-viewer-lines");
    if (linesContainer) {
      linesContainer.innerHTML = renderCodeLines(artifact?.content, artifact?.artifactFormat);
    }

    // Open Interactive Editor button
    const openCodeEditorBtn = $("#btn-code-open-editor");
    if (openCodeEditorBtn && artifact) {
      openCodeEditorBtn.onclick = () => {
        if (typeof ErdEditor !== "undefined") {
          ErdEditor.open({
            initialMermaid: artifact.content || "",
            title: `${c.name} — ${artifact.downloadFilename || artifact.name}`,
            component: c,
            activeArtifact: artifact,
            artifacts: rawArtifacts,
            variantName: artifact.variantType || "Source",
            isCataloguer: role === "Cataloguer",
            onSave: async ({ content }) => {
              if (role === "Cataloguer" && artifact.id) {
                try {
                  await C.updateArtifact(id, artifact.id, { ...artifact, content });
                  artifact.content = content;
                  componentNotice = "File updated in catalogue.";
                  P.component();
                } catch (err) {
                  showError(err);
                }
              } else {
                artifact.content = content;
                updateActiveCodeFile();
              }
            }
          });
        }
      };
    }

    lucide.createIcons();
  };

  // Wire Category Tab clicks
  document.querySelectorAll(".code-cat-tab").forEach(tab => {
    tab.onclick = () => {
      activeCodeCat = tab.dataset.cat;
      activeFileIdx = 0;
      updateActiveCodeFile();
    };
  });

  // Wire Code View Buttons
  const btnToggleWrap = $("#btn-toggle-wrap");
  if (btnToggleWrap) {
    btnToggleWrap.onclick = () => {
      const wrapEl = $("#code-viewer-wrap");
      if (wrapEl) {
        wrapEl.classList.toggle("wrap-lines");
        const isWrapped = wrapEl.classList.contains("wrap-lines");
        btnToggleWrap.innerHTML = isWrapped ? `${ic("align-justify")} No Wrap` : `${ic("align-left")} Wrap Lines`;
        lucide.createIcons();
      }
    };
  }

  const btnCodeCopy = $("#btn-code-copy");
  if (btnCodeCopy) {
    btnCodeCopy.onclick = async () => {
      const art = getActiveCodeArtifact();
      if (!art || !art.content) return;
      try {
        await copyText(art.content);
        await recordReuse();
        const orig = btnCodeCopy.innerHTML;
        btnCodeCopy.innerHTML = `${ic("check")} Copied!`;
        setTimeout(() => { btnCodeCopy.innerHTML = orig; lucide.createIcons(); }, 1800);
      } catch (err) {
        showError(err);
      }
    };
  }

  const btnCodeDownload = $("#btn-code-download");
  if (btnCodeDownload) {
    btnCodeDownload.onclick = async () => {
      const art = getActiveCodeArtifact();
      if (!art) return;
      try {
        if (art.id) {
          const result = await C.downloadArtifact(id, art.id);
          const link = document.createElement("a");
          link.href = URL.createObjectURL(result.blob);
          link.download = result.filename || art.downloadFilename;
          link.click();
          URL.revokeObjectURL(link.href);
        } else {
          const blob = new Blob([art.content || ""], { type: "text/plain;charset=utf-8" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = art.downloadFilename || "code.txt";
          link.click();
          URL.revokeObjectURL(link.href);
        }
        await recordReuse();
      } catch (err) {
        showError(err);
      }
    };
  }

  const btnDownloadZip = $("#btn-download-zip");
  if (btnDownloadZip) {
    btnDownloadZip.onclick = async () => {
      try {
        const cleanName = (c.name || "package").toLowerCase().replace(/[^a-z0-9._-]/g, "-");
        const result = await C.downloadZip(id, `${cleanName}.zip`);
        const link = document.createElement("a");
        link.href = URL.createObjectURL(result.blob);
        link.download = result.filename || `${cleanName}.zip`;
        link.click();
        URL.revokeObjectURL(link.href);
        await recordReuse();
      } catch (err) {
        showError(err);
      }
    };
  }

  // Initial code file activation
  if (c.type === "Code" && codeArtifacts.length) {
    updateActiveCodeFile();
  }

  /* =========================================================
     DESIGN COMPONENT INTERACTIVITY (Diagrams)
     ========================================================= */
  const updateActiveDiagram = () => {
    const currentArtifacts = getActiveDesignArtifacts();
    if (activeFormatIdx >= currentArtifacts.length) activeFormatIdx = 0;
    const artifact = currentArtifacts[activeFormatIdx] || currentArtifacts[0];
    const group = designGroups[activeVariantIdx];
    const variantName = group ? group[0] : "";

    // Sync variant tabs
    document.querySelectorAll(".variant-tab").forEach((tab, idx) => {
      tab.classList.toggle("on", idx === activeVariantIdx);
    });

    // Sync format pills
    const pillsContainer = $("#format-pills-container");
    if (pillsContainer) {
      pillsContainer.innerHTML = currentArtifacts.map((art, fIdx) => `
        <button type="button" class="format-pill ${fIdx === activeFormatIdx ? "on" : ""}" data-format-idx="${fIdx}">
          ${E(art.artifactFormat)}
        </button>
      `).join("");

      pillsContainer.querySelectorAll(".format-pill").forEach(pill => {
        pill.onclick = () => {
          activeFormatIdx = Number(pill.dataset.formatIdx);
          updateActiveDiagram();
        };
      });
    }

    // Sync description and source panel
    const descEl = $("#cur-artifact-desc");
    if (descEl) descEl.textContent = artifact?.description || variantName;

    const sourceCode = $("#active-source-code");
    if (sourceCode) sourceCode.textContent = artifact?.content || "";

    const sourceLabel = $("#active-source-label");
    if (sourceLabel) {
      sourceLabel.innerHTML = `${ic("code")} View <b>${E(artifact?.artifactFormat || "source")}</b> (${E(artifact?.downloadFilename || "artifact")})`;
    }

    const detectedType = typeof ErdEditor !== "undefined"
      ? ErdEditor.detectDiagramType(artifact?.content, c.name, C.tech(c), c.type, artifact?.artifactFormat)
      : "erd";
    const isSourceDoc = detectedType === "source";

    const sourceDetails = $("#active-source-details");
    if (sourceDetails) {
      sourceDetails.hidden = isSourceDoc;
    }

    // Render Canvas via DiagramRenderer
    const viewport = $("#main-diagram-viewport");
    if (viewport && artifact && typeof DiagramRenderer !== "undefined") {
      DiagramRenderer.render(viewport, artifact);
    }

    // Dynamic Open Editor button update
    const openEditorBtn = $("#btn-open-erd-editor");
    if (openEditorBtn) {
      const meta = typeof ErdEditor !== "undefined" && ErdEditor.DIAGRAM_META[detectedType]
        ? ErdEditor.DIAGRAM_META[detectedType]
        : { badge: "Editor" };
      openEditorBtn.innerHTML = `${ic(isSourceDoc ? "file-text" : "layout")} Open ${meta.badge}`;

      openEditorBtn.onclick = () => {
        const mmdArt = currentArtifacts.find(a => a.artifactFormat === "mermaid") || currentArtifacts[0];
        const svgArt = currentArtifacts.find(a => a.artifactFormat === "svg");
        const drawioArt = currentArtifacts.find(a => a.artifactFormat === "drawio");

        if (!artifact) {
          alert("No editable artifact found for this variant.");
          return;
        }

        if (typeof ErdEditor !== "undefined") {
          ErdEditor.open({
            initialMermaid: artifact.content || "",
            title: `${c.name} — ${variantName}`,
            component: c,
            activeArtifact: artifact,
            artifacts: currentArtifacts,
            variantName: variantName,
            isCataloguer: role === "Cataloguer",
            onSave: async ({ mermaid, svg, drawio, content }) => {
              if (role === "Cataloguer") {
                try {
                  if (isSourceDoc && content !== undefined) {
                    await C.updateArtifact(id, artifact.id, { ...artifact, content });
                    artifact.content = content;
                  } else {
                    if (mmdArt && mermaid) {
                      await C.updateArtifact(id, mmdArt.id, { ...mmdArt, content: mermaid });
                      mmdArt.content = mermaid;
                    }
                    if (svgArt && svg) {
                      await C.updateArtifact(id, svgArt.id, { ...svgArt, content: svg });
                      svgArt.content = svg;
                    }
                    if (drawioArt && drawio) {
                      await C.updateArtifact(id, drawioArt.id, { ...drawioArt, content: drawio });
                      drawioArt.content = drawio;
                    }
                  }
                  componentNotice = "Changes saved to catalogue.";
                  P.component();
                } catch (err) {
                  showError(err);
                }
              } else {
                if (isSourceDoc && content !== undefined) {
                  artifact.content = content;
                } else {
                  if (mmdArt && mermaid) mmdArt.content = mermaid;
                  if (svgArt && svg) svgArt.content = svg;
                  if (drawioArt && drawio) drawioArt.content = drawio;
                }
                updateActiveDiagram();
              }
            }
          });
        }
      };
    }

    lucide.createIcons();
  };

  // Attach Design Variant Tab Event Handlers
  document.querySelectorAll(".variant-tab").forEach(tab => {
    tab.onclick = () => {
      activeVariantIdx = Number(tab.dataset.variantIdx);
      activeFormatIdx = 0;
      updateActiveDiagram();
    };
  });

  // Attach Design Copy Source Button
  const activeCopyBtn = $("#btn-active-copy");
  if (activeCopyBtn) {
    activeCopyBtn.onclick = async () => {
      const artifact = getActiveDesignArtifact();
      if (!artifact || !artifact.content) return;
      try {
        await copyText(artifact.content);
        await recordReuse();
        const orig = activeCopyBtn.innerHTML;
        activeCopyBtn.innerHTML = `${ic("check")} Copied!`;
        setTimeout(() => { activeCopyBtn.innerHTML = orig; lucide.createIcons(); }, 1800);
      } catch (err) {
        showError(err);
      }
    };
  }

  // Attach Design Download Button
  const activeDlBtn = $("#btn-active-download");
  if (activeDlBtn) {
    activeDlBtn.onclick = async () => {
      const artifact = getActiveDesignArtifact();
      if (!artifact) return;
      try {
        const result = await C.downloadArtifact(id, artifact.id);
        const link = document.createElement("a");
        link.href = URL.createObjectURL(result.blob);
        link.download = result.filename || artifact.downloadFilename;
        link.click();
        URL.revokeObjectURL(link.href);
        await recordReuse();
      } catch (err) {
        showError(err);
      }
    };
  }

  /* =========================================================
     CATALOGUER ARTIFACT MANAGEMENT (Phase 3)
     ========================================================= */
  const activeEditBtn = $("#btn-active-edit");
  const activeDelBtn = $("#btn-active-del");
  const codeEditBtn = $("#btn-code-edit");
  const codeDelBtn = $("#btn-code-del");
  const editor = $("#artifact-editor");
  let editingArtifactId = null;

  const openArtifactEditor = artifact => {
    if (!editor) return;
    editingArtifactId = artifact?.id || null;
    $("#artifact-editor-title").textContent = artifact ? "Edit reusable artifact" : "Add reusable artifact";
    $("#artifact-name").value = artifact?.name || (artifact ? "" : `${c.name} File`);
    $("#artifact-variant").value = artifact?.variantType || (c.type === "Code" ? "Source" : curDesignVariantName || "Default");
    $("#artifact-description").value = artifact?.description || (artifact ? "" : c.description || "");
    $("#artifact-delivery").value = artifact?.deliveryMethod || c.deliveryMethod || "Editable Source";
    const defaultFormat = artifact?.artifactFormat || (c.type === "Design" ? "mermaid" : (c.language ? c.language.toLowerCase() : "typescript"));
    $("#artifact-format").value = defaultFormat;
    $("#artifact-content").value = artifact?.content || "";
    const defaultExt = {
      mermaid: ".mmd",
      plantuml: ".puml",
      drawio: ".drawio",
      svg: ".svg",
      png: ".png",
      markdown: ".md",
      javascript: ".js",
      typescript: ".ts",
      python: ".py",
      json: ".json",
      yaml: ".yaml",
      html: ".html",
      css: ".css",
      sql: ".sql",
      sh: ".sh",
      bash: ".sh",
      go: ".go",
      rust: ".rs",
      java: ".java",
      c: ".c",
      cpp: ".cpp",
      csharp: ".cs",
      php: ".php",
      ruby: ".rb",
      dockerfile: "Dockerfile",
      xml: ".xml",
      txt: ".txt"
    }[defaultFormat] || ".txt";
    $("#artifact-filename").value = artifact?.downloadFilename || (defaultExt === "Dockerfile" ? "Dockerfile" : `${c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}${defaultExt}`);
    $("#artifact-reuse").value = artifact?.reuseMethod || c.reuseMethod || "Copy and edit";
    $("#artifact-editor-error").hidden = true;
    editor.hidden = false;
    editor.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  if (activeEditBtn) {
    activeEditBtn.onclick = () => {
      const artifact = getActiveDesignArtifact();
      if (artifact) openArtifactEditor(artifact);
    };
  }

  if (activeDelBtn) {
    activeDelBtn.onclick = async () => {
      const artifact = getActiveDesignArtifact();
      if (!artifact) return;
      if (!confirm(`Delete artifact "${artifact.name}" (${artifact.artifactFormat})?`)) return;
      try {
        await C.deleteArtifact(id, artifact.id);
        componentNotice = "Artifact deleted successfully.";
        await C.getComponent(id);
        P.component();
      } catch (err) {
        showError(err);
      }
    };
  }

  if (codeEditBtn) {
    codeEditBtn.onclick = () => {
      const artifact = getActiveCodeArtifact();
      if (artifact) openArtifactEditor(artifact);
    };
  }

  if (codeDelBtn) {
    codeDelBtn.onclick = async () => {
      const artifact = getActiveCodeArtifact();
      if (!artifact) return;
      if (!artifact.id) {
        alert("Cannot delete primary source without replacement.");
        return;
      }
      if (!confirm(`Delete file "${artifact.downloadFilename || artifact.name}"?`)) return;
      try {
        await C.deleteArtifact(id, artifact.id);
        componentNotice = "File deleted successfully.";
        await C.getComponent(id);
        P.component();
      } catch (err) {
        showError(err);
      }
    };
  }

  // Wire Reorder Move Up / Move Down buttons
  document.querySelectorAll(".btn-move-up").forEach(btn => {
    btn.onclick = async () => {
      const idx = Number(btn.dataset.idx);
      if (idx <= 0 || idx >= rawArtifacts.length) return;
      const newOrder = [...rawArtifacts];
      const temp = newOrder[idx - 1];
      newOrder[idx - 1] = newOrder[idx];
      newOrder[idx] = temp;
      try {
        await C.reorderArtifacts(id, newOrder.map(a => a.id));
        componentNotice = "Artifacts reordered successfully.";
        await C.getComponent(id);
        P.component();
      } catch (err) {
        showError(err);
      }
    };
  });

  document.querySelectorAll(".btn-move-down").forEach(btn => {
    btn.onclick = async () => {
      const idx = Number(btn.dataset.idx);
      if (idx < 0 || idx >= rawArtifacts.length - 1) return;
      const newOrder = [...rawArtifacts];
      const temp = newOrder[idx + 1];
      newOrder[idx + 1] = newOrder[idx];
      newOrder[idx] = temp;
      try {
        await C.reorderArtifacts(id, newOrder.map(a => a.id));
        componentNotice = "Artifacts reordered successfully.";
        await C.getComponent(id);
        P.component();
      } catch (err) {
        showError(err);
      }
    };
  });

  document.querySelectorAll(".btn-item-edit").forEach(btn => {
    btn.onclick = () => {
      const artId = Number(btn.dataset.artId);
      const art = rawArtifacts.find(a => a.id === artId);
      if (art) openArtifactEditor(art);
    };
  });

  document.querySelectorAll(".btn-item-del").forEach(btn => {
    btn.onclick = async () => {
      const artId = Number(btn.dataset.artId);
      const art = rawArtifacts.find(a => a.id === artId);
      if (!art) return;
      if (!confirm(`Delete artifact "${art.downloadFilename || art.name}"?`)) return;
      try {
        await C.deleteArtifact(id, art.id);
        componentNotice = "Artifact deleted successfully.";
        await C.getComponent(id);
        P.component();
      } catch (err) {
        showError(err);
      }
    };
  });

  // Handle all triggers for Add Artifact
  document.querySelectorAll("#add-artifact-trigger").forEach(btn => {
    btn.onclick = () => openArtifactEditor(null);
  });
  $("#artifact-cancel")?.addEventListener("click", () => { if (editor) editor.hidden = true; });

  $("#artifact-format")?.addEventListener("change", () => {
    const format = $("#artifact-format").value;
    const defaultExt = {
      mermaid: ".mmd",
      plantuml: ".puml",
      drawio: ".drawio",
      svg: ".svg",
      png: ".png",
      markdown: ".md",
      javascript: ".js",
      typescript: ".ts",
      python: ".py",
      json: ".json",
      yaml: ".yaml",
      html: ".html",
      css: ".css",
      sql: ".sql",
      sh: ".sh",
      bash: ".sh",
      go: ".go",
      rust: ".rs",
      java: ".java",
      c: ".c",
      cpp: ".cpp",
      csharp: ".cs",
      php: ".php",
      ruby: ".rb",
      dockerfile: "Dockerfile",
      xml: ".xml",
      txt: ".txt"
    }[format] || ".txt";

    const curFilename = $("#artifact-filename").value.trim();
    if (defaultExt === "Dockerfile") {
      $("#artifact-filename").value = "Dockerfile";
    } else if (curFilename && curFilename !== "Dockerfile") {
      const base = curFilename.includes(".") ? curFilename.substring(0, curFilename.lastIndexOf(".")) : curFilename;
      $("#artifact-filename").value = base + defaultExt;
    } else {
      $("#artifact-filename").value = (c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "artifact") + defaultExt;
    }
  });

  $("#artifact-file")?.addEventListener("change", async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 500000) {
      event.target.value = "";
      showError(new Error("Artifact files must be smaller than 500 KB."));
      return;
    }
    if (file.type === "image/png" || file.name.toLowerCase().endsWith(".png")) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (let index = 0; index < bytes.length; index += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
      }
      $("#artifact-format").value = "png";
      $("#artifact-content").value = "";
      event.target.dataset.binaryContent = btoa(binary);
      event.target.dataset.contentType = "image/png";
    } else {
      $("#artifact-content").value = await file.text();
      delete event.target.dataset.binaryContent;
      delete event.target.dataset.contentType;
    }
    if (!$("#artifact-filename").value) $("#artifact-filename").value = file.name;
  });

  editor?.addEventListener("submit", async event => {
    event.preventDefault();
    const error = $("#artifact-editor-error");
    error.hidden = true;
    const payload = {
      name: $("#artifact-name").value.trim(),
      description: $("#artifact-description").value.trim(),
      variantType: $("#artifact-variant").value.trim(),
      deliveryMethod: $("#artifact-delivery").value.trim(),
      artifactFormat: $("#artifact-format").value,
      content: $("#artifact-content").value,
      binaryContent: $("#artifact-file")?.dataset.binaryContent || "",
      contentType: $("#artifact-file")?.dataset.contentType || "text/plain",
      downloadFilename: $("#artifact-filename").value.trim(),
      reuseMethod: $("#artifact-reuse").value.trim(),
      isPrimary: false,
      sortOrder: editingArtifactId ? (rawArtifacts.find(a => a.id === editingArtifactId)?.sortOrder || 0) : rawArtifacts.length
    };
    try {
      if (editingArtifactId) await C.updateArtifact(id, editingArtifactId, payload);
      else await C.addArtifact(id, payload);
      componentNotice = editingArtifactId ? "Artifact updated successfully." : "Artifact added successfully.";
      await C.getComponent(id);
      P.component();
    } catch (err) {
      error.textContent = err.message || "Failed to save artifact.";
      error.hidden = false;
      error.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });

  // Copy Install Command in Sidebar
  const copyInstallBtn = $("#copy-install");
  if (copyInstallBtn) {
    copyInstallBtn.onclick = async () => {
      try {
        await copyText(c.installCommand);
        await recordReuse();
        copyInstallBtn.innerHTML = `${ic("check")} Copied installation command`;
        setTimeout(() => { copyInstallBtn.innerHTML = `${ic("terminal")} Copy installation command`; lucide.createIcons(); }, 1800);
      } catch (err) {
        showError(err);
      }
    };
  }

  // Tag: Copy Install Command
  const tagCopyInstall = $("#tag-copy-install");
  if (tagCopyInstall) {
    tagCopyInstall.onclick = async () => {
      try {
        await copyText(c.installCommand);
        await recordReuse();
        tagCopyInstall.innerHTML = `${ic("check")} Copied!`;
        setTimeout(() => { tagCopyInstall.innerHTML = `${ic("terminal")} Install package`; lucide.createIcons(); }, 1800);
      } catch (err) {
        showError(err);
      }
    };
  }

  // Tag: Download Package ZIP
  const tagDownloadPkg = $("#tag-download-pkg");
  if (tagDownloadPkg) {
    tagDownloadPkg.onclick = async () => {
      try {
        const cleanName = (c.name || "package").toLowerCase().replace(/[^a-z0-9._-]/g, "-");
        const result = await C.downloadZip(id, `${cleanName}.zip`);
        const link = document.createElement("a");
        link.href = URL.createObjectURL(result.blob);
        link.download = result.filename || `${cleanName}.zip`;
        link.click();
        URL.revokeObjectURL(link.href);
        await recordReuse();
      } catch (err) {
        showError(err);
      }
    };
  }

  // Interactive Use Component Modal Dialog
  const openUseModal = () => {
    const existing = document.getElementById("use-modal-backdrop");
    if (existing) existing.remove();

    const cleanName = (c.name || "package").toLowerCase().replace(/[^a-z0-9._-]/g, "-");
    const exampleSnippet = c.exampleContent || (codeArtifacts.length ? codeArtifacts[0].content : "");

    const modal = document.createElement("div");
    modal.id = "use-modal-backdrop";
    modal.className = "use-modal-backdrop";
    modal.innerHTML = `
      <div class="use-modal-window" role="dialog" aria-modal="true" aria-labelledby="use-modal-title">
        <div class="use-modal-header">
          <h2 id="use-modal-title">${ic("check-circle")} Use ${E(c.name)}</h2>
          <button type="button" class="btn ghost sm" id="use-modal-close" aria-label="Close modal">${ic("x")}</button>
        </div>
        <div class="use-modal-body">
          <p style="color:#475569;margin:0 0 4px 0;font-size:13.5px;">Follow these steps to integrate and reuse <strong>${E(c.name)}</strong> in your software project.</p>

          <div id="use-modal-notice" class="ok" style="margin-bottom:8px;" hidden></div>
          <div id="use-modal-error" class="bad" style="margin-bottom:8px;" hidden></div>

          <!-- Step 1: Delivery & Setup -->
          <div class="use-step-card">
            <div class="use-step-title">
              <span class="code-meta-badge" style="background:#dbeafe;color:#1e40af;">1</span>
              <span>${c.type === "Code" ? "Installation & Package Download" : "Artifact Setup"}</span>
            </div>
            ${c.installCommand ? `
              <p style="font-size:12.5px;color:#64748b;margin:4px 0 6px 0;">Run this command in your project terminal:</p>
              <div class="use-code-box">
                <pre><code>${E(c.installCommand)}</code></pre>
                <button type="button" id="use-modal-copy-install">${ic("copy")} Copy</button>
              </div>
            ` : ""}
            <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
              <button type="button" class="btn" id="use-modal-download-zip">
                ${ic("archive")} Download Component Package (ZIP)
              </button>
              ${c.url ? `
                <a href="${E(c.url)}" target="_blank" rel="noopener noreferrer" class="btn ghost" id="use-modal-open-repo">
                  ${ic("external-link")} Reference Repository
                </a>
              ` : ""}
            </div>
          </div>

          <!-- Step 2: Code Integration Example -->
          ${exampleSnippet ? `
            <div class="use-step-card">
              <div class="use-step-title">
                <span class="code-meta-badge" style="background:#dbeafe;color:#1e40af;">2</span>
                <span>Integration & Usage Example</span>
              </div>
              <div class="use-code-box" style="align-items:flex-start;max-height:220px;">
                <pre><code>${E(exampleSnippet)}</code></pre>
                <button type="button" id="use-modal-copy-code">${ic("copy")} Copy Example</button>
              </div>
            </div>
          ` : ""}

          <!-- Step 3: Reuse Guidance & Best Practices -->
          ${c.usageNotes || c.reuseMethod ? `
            <div class="use-step-card">
              <div class="use-step-title">
                <span class="code-meta-badge" style="background:#dbeafe;color:#1e40af;">3</span>
                <span>Guidance & Best Practices</span>
              </div>
              ${c.reuseMethod ? `<p style="font-size:13px;margin:0 0 6px 0;"><strong>Recommended approach:</strong> ${E(c.reuseMethod)}</p>` : ""}
              ${c.usageNotes ? `<p style="font-size:12.5px;color:#475569;margin:0;">${E(c.usageNotes)}</p>` : ""}
            </div>
          ` : ""}
        </div>
        <div class="use-modal-actions">
          <span style="font-size:12px;color:#64748b;">Times this component was used: <b id="use-modal-used-count">${c.usage.used}</b></span>
          <button type="button" class="btn ghost" id="use-modal-done">Done</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons();

    const showNotice = msg => {
      const el = $("#use-modal-notice");
      if (el) { el.textContent = msg; el.hidden = false; }
    };

    const showModalError = err => {
      const el = $("#use-modal-error");
      if (el) { el.textContent = err?.message || String(err); el.hidden = false; }
    };

    const closeModal = () => {
      modal.remove();
    };

    $("#use-modal-close").onclick = closeModal;
    $("#use-modal-done").onclick = closeModal;
    modal.onclick = e => { if (e.target === modal) closeModal(); };

    // Modal Copy Install
    const copyInstall = $("#use-modal-copy-install");
    if (copyInstall) {
      copyInstall.onclick = async () => {
        try {
          await copyText(c.installCommand);
          await recordReuse();
          copyInstall.innerHTML = `${ic("check")} Copied!`;
          showNotice("Installation command copied and reuse recorded.");
          const cnt = $("#use-modal-used-count");
          if (cnt) cnt.textContent = String(c.usage.used);
          setTimeout(() => { copyInstall.innerHTML = `${ic("copy")} Copy`; lucide.createIcons(); }, 1800);
        } catch (err) {
          showModalError(err);
        }
      };
    }

    // Modal Download ZIP
    const downloadZip = $("#use-modal-download-zip");
    if (downloadZip) {
      downloadZip.onclick = async () => {
        try {
          const result = await C.downloadZip(id, `${cleanName}.zip`);
          const link = document.createElement("a");
          link.href = URL.createObjectURL(result.blob);
          link.download = result.filename || `${cleanName}.zip`;
          link.click();
          URL.revokeObjectURL(link.href);
          await recordReuse();
          showNotice("Package ZIP downloaded and reuse recorded.");
          const cnt = $("#use-modal-used-count");
          if (cnt) cnt.textContent = String(c.usage.used);
        } catch (err) {
          showModalError(err);
        }
      };
    }

    // Modal Copy Code
    const copyCode = $("#use-modal-copy-code");
    if (copyCode) {
      copyCode.onclick = async () => {
        try {
          await copyText(exampleSnippet);
          await recordReuse();
          copyCode.innerHTML = `${ic("check")} Copied!`;
          showNotice("Example code copied and reuse recorded.");
          const cnt = $("#use-modal-used-count");
          if (cnt) cnt.textContent = String(c.usage.used);
          setTimeout(() => { copyCode.innerHTML = `${ic("copy")} Copy Example`; lucide.createIcons(); }, 1800);
        } catch (err) {
          showModalError(err);
        }
      };
    }
  };

  // Use Component Button opens Integration & Reuse workflow modal
  $("#use").onclick = () => {
    openUseModal();
  };

  // Cataloguer Component Controls
  if ($("#edit")) {
    $("#edit").onclick = () => P.editComponent();
  }

  if ($("#kw")) {
    $("#kw").onclick = async () => {
      const v = prompt("Keywords (comma separated):", c.keywords.join(", "));
      if (v !== null) {
        try {
          await C.setKeywords(id, v.split(","));
          componentNotice = "Keywords updated successfully.";
          P.component();
        } catch (err) {
          showError(err);
        }
      }
    };
  }

  if ($("#del")) {
    $("#del").onclick = async () => {
      if (confirm("Delete this component from the catalogue?")) {
        try {
          await C.remove(id);
          location.href = url("browse");
        } catch (err) {
          showError(err);
        }
      }
    };
  }

  // Initial Diagram render
  if (artifactGroups.length) {
    updateActiveDiagram();
  }

  lucide.createIcons();
};

// Render the cataloguer form used to edit an existing component.
P.editComponent = async () => {
  const id = Number(qs.get("id"));
  let c;

  if (role !== "Cataloguer") {
    return;
  }

  main.innerHTML = `
    <div class="wrap">
      <div class="card pad">Loading component...</div>
    </div>
  `;

  try {
    c = await C.getComponent(id);
  } catch (err) {
    if (err.status === 404) {
      main.innerHTML =
        head("Component not found", "It may have been removed.") +
        `<div class="wrap"><a class="btn" href="${url("browse")}">Back to browse</a></div>`;
      return;
    }
    showError(err);
    return;
  }

  const opt = (parent, depth = 0) =>
    C.childrenOf(parent)
      .map(category => `
        <option value="${category.id}" ${category.id === c.categoryId ? "selected" : ""}>
          ${"\u00a0\u00a0".repeat(depth)}${E(category.name)}
        </option>
      ` + opt(category.id, depth + 1))
      .join("");

  main.innerHTML =
    head("Edit component", "Update the component metadata and resource reference.") +
    `
<div class="wrap narrow">
  <form class="card pad form" id="edit-form" autocomplete="off">
    <p class="bad" id="edit-err" hidden></p>
    <label>
      Name *
      <input id="edit-name" autocomplete="off" required value="${E(c.name)}">
    </label>
    <div class="cols">
      <label>
        Category *
        <select id="edit-cat" required>
          ${opt(null)}
        </select>
      </label>
      <label>
        Type *
        <select id="edit-type" required>
          <option ${c.type === "Code" ? "selected" : ""}>Code</option>
          <option ${c.type === "Design" ? "selected" : ""}>Design</option>
        </select>
      </label>
    </div>
    <label>
      <span id="edit-tl">${c.type === "Design" ? "Notation" : "Language"}</span>
      <input id="edit-tech" autocomplete="off" required value="${E(C.tech(c))}">
    </label>
    <label>
      Description *
      <textarea id="edit-desc" autocomplete="off" rows="4" required>${E(c.description)}</textarea>
    </label>
    <label>
      Keywords
      <input id="edit-kw" autocomplete="off" value="${E(c.keywords.join(", "))}">
      <small>Separate with commas.</small>
    </label>
    <label>
      Resource URL
      <input id="edit-url" autocomplete="off" type="url" value="${E(c.url)}" placeholder="https://github.com/...">
    </label>
    <label>
      Artifact format
      <select id="edit-artifact-format">
        ${["", "snippet", "file", "package", "mermaid", "plantuml", "drawio", "svg", "markdown", "typescript"]
          .map(format => `<option value="${format}" ${c.artifactFormat === format ? "selected" : ""}>${format || "None"}</option>`)
          .join("")}
      </select>
    </label>
    <label>
      Reusable artifact
      <textarea id="edit-artifact-content" rows="8">${E(c.artifactContent)}</textarea>
    </label>
    <label>
      Usage notes
      <textarea id="edit-usage-notes" rows="3">${E(c.usageNotes)}</textarea>
    </label>
    <label>
      Example or adaptation notes
      <textarea id="edit-example-content" rows="3">${E(c.exampleContent)}</textarea>
    </label>
    <label>
      Delivery method
      <input id="edit-delivery-method" value="${E(c.deliveryMethod)}" placeholder="Package, Source File, Editable Diagram">
    </label>
    <label>
      Reuse method
      <input id="edit-reuse-method" value="${E(c.reuseMethod)}" placeholder="Install package, Copy and edit">
    </label>
    <label>
      Install command
      <input id="edit-install-command" value="${E(c.installCommand)}" placeholder="npm install package">
    </label>
    <div class="actions">
      <button type="button" class="btn ghost" id="edit-cancel">Cancel</button>
      <button class="btn">Save Changes</button>
    </div>
  </form>
</div>
`;

  $("#edit-type").onchange = () => {
    $("#edit-tl").textContent = $("#edit-type").value === "Design" ? "Notation" : "Language";
  };

  $("#edit-cancel").onclick = () => P.component();

  $("#edit-form").onsubmit = async event => {
    event.preventDefault();
    const type = $("#edit-type").value;
    const tech = $("#edit-tech").value.trim();
    const error = $("#edit-err");

    error.hidden = true;

    try {
      await C.updateComponent(id, {
        name: $("#edit-name").value.trim(),
        description: $("#edit-desc").value.trim(),
        categoryId: Number($("#edit-cat").value),
        type,
        tech,
        keywords: $("#edit-kw").value.split(","),
        url: $("#edit-url").value.trim(),
        artifactFormat: $("#edit-artifact-format").value.trim(),
        artifactContent: $("#edit-artifact-content").value.trim(),
        usageNotes: $("#edit-usage-notes").value.trim(),
        exampleContent: $("#edit-example-content").value.trim(),
        deliveryMethod: $("#edit-delivery-method").value.trim(),
        reuseMethod: $("#edit-reuse-method").value.trim(),
        installCommand: $("#edit-install-command").value.trim()
      });

      componentNotice = "Component updated successfully.";
      P.component();
      lucide.createIcons();
    } catch (err) {
      error.textContent = err.message;
      error.hidden = false;
    }
  };

  lucide.createIcons();
};



/* ---------- ADD COMPONENT ---------- */

// Render the cataloguer form used to add a new component.
P["add-component"] = () => {

  if (role !== "Cataloguer") {

    main.innerHTML =
      head(
        "Add component",
        "Cataloguers only."
      ) +

      `
      <div class="wrap">

        <div class="card pad">

          Switch your role to
          <b>Cataloguer</b>
          (top right) to add components.

        </div>

      </div>
      `;

    return;
  }


  // Build nested category options for the add-component form.
  const opt = (p, d = 0) =>
    C.childrenOf(p)
      .map(
        c =>
          `<option value="${c.id}">
            ${"\u00a0\u00a0".repeat(d)}
            ${E(c.name)}
          </option>` +
          opt(c.id, d + 1)
      )
      .join("");


  main.innerHTML =
    head(
      "Add component",
      "Contribute a reusable code or design component to the catalogue."
    ) +

    `
<div class="wrap narrow">

  <form
    class="card pad form"
    id="f"
  >

    <p
      class="ok"
      id="ok"
      hidden
    >
      Component added to the catalogue.
    </p>


    <p
      class="bad"
      id="err"
      hidden
    ></p>


    <label>
      Name *

      <input
        id="name"
        required
        placeholder="e.g. JWT Authentication"
      >

    </label>


    <div class="cols">

      <label>

        Category *

        <select
          id="cat"
          required
        >

          <option value="">
            Select category
          </option>

          ${opt(null)}

        </select>

      </label>


      <label>

        Type *

        <select
          id="type"
          required
        >

          <option value="">
            Select type
          </option>

          <option>
            Code
          </option>

          <option>
            Design
          </option>

        </select>

      </label>

    </div>


    <label>

      <span id="tl">
        Language
      </span>

      <input
        id="tech"
        placeholder="e.g. Python"
      >

    </label>


    <label>

      Description *

      <textarea
        id="desc"
        rows="4"
        required
        placeholder="What does it do and when should it be used?"
      ></textarea>

    </label>


    <label>

      Keywords

      <input
        id="kw"
        placeholder="authentication, JWT, security"
      >

      <small>
        Separate with commas.
      </small>

    </label>


    <label>

      Resource URL

      <input
        id="url"
        type="url"
        placeholder="https://github.com/…"
      >

    </label>

    <label>
      Artifact format
      <select id="artifact-format">
        <option value="">None</option>
        <option value="snippet">Snippet</option>
        <option value="file">File</option>
        <option value="package">Package</option>
        <option value="mermaid">Mermaid</option>
        <option value="plantuml">PlantUML</option>
        <option value="drawio">Draw.io</option>
        <option value="svg">SVG</option>
        <option value="markdown">Markdown</option>
        <option value="typescript">TypeScript</option>
      </select>
    </label>

    <label>
      Reusable artifact
      <textarea id="artifact-content" rows="8" placeholder="Paste editable Mermaid, Markdown, or code content"></textarea>
    </label>

    <label>
      Usage notes
      <textarea id="usage-notes" rows="3"></textarea>
    </label>

    <label>
      Example or adaptation notes
      <textarea id="example-content" rows="3"></textarea>
    </label>

    <label>
      Delivery method
      <input id="delivery-method" placeholder="Package, Source File, Editable Diagram">
    </label>

    <label>
      Reuse method
      <input id="reuse-method" placeholder="Install package, Copy and edit">
    </label>

    <label>
      Install command
      <input id="install-command" placeholder="npm install package">
    </label>


    <div class="actions">

      <a
        class="btn ghost"
        href="${url("index")}"
      >
        Cancel
      </a>


      <button class="btn">
        Add component
      </button>

    </div>

  </form>

</div>
`;


  $("#type").onchange = () => {

    const d =
      $("#type").value === "Design";

    $("#tl").textContent =
      d
        ? "Notation"
        : "Language";

    $("#tech").placeholder =
      d
        ? "e.g. UML, ERD, Structured Design"
        : "e.g. Python";
  };


  $("#f").onsubmit = async e => {

    e.preventDefault();

    const d =
      $("#type").value === "Design";

    const t =
      $("#tech").value.trim();

    $("#err").hidden = true;


    try {

      await C.add({

        name:
          $("#name").value.trim(),

        description:
          $("#desc").value.trim(),

        categoryId:
          Number($("#cat").value),

        type:
          $("#type").value,

        language:
          d ? null : t,

        notation:
          d ? t : null,

        keywords:
          $("#kw").value
            .split(",")
            .map(k => k.trim())
            .filter(Boolean),

        url:
          $("#url").value.trim(),

        artifactFormat:
          $("#artifact-format").value.trim(),

        artifactContent:
          $("#artifact-content").value.trim(),

        usageNotes:
          $("#usage-notes").value.trim(),

        exampleContent:
          $("#example-content").value.trim(),
        deliveryMethod:
          $("#delivery-method").value.trim(),
        reuseMethod:
          $("#reuse-method").value.trim(),
        installCommand:
          $("#install-command").value.trim()

      });


      e.target.reset();

      $("#ok").hidden = false;

      scrollTo({
        top: 0,
        behavior: "smooth"
      });


    } catch (err) {

      $("#err").textContent =
        err.message;

      $("#err").hidden = false;
    }

  };

};


/* ---------- STATISTICS ---------- */

// Render usage statistics for the catalogue.
P.statistics = () => {

  const all = C.list();
  const tops = C.childrenOf(null);

  const used =
    sum(all, c => c.usage.used);

  const nu =
    sum(
      all,
      c => c.usage.queriedNotUsed
    );


  const cnt =
    tops.map(
      c => [
        c.name,
        C.list({
          categoryId: c.id
        }).length
      ]
    );


  const mx =
    Math.max(
      1,
      ...cnt.map(x => x[1])
    );


  main.innerHTML =
    head(
      "Catalogue statistics",
      "Components, categories and how often they are reused."
    ) +

    `
<div class="wrap">

  <div class="stats">

    ${[
      ["box", all.length, "Components"],
      ["folder", tops.length, "Categories"],
      ["bar-chart-3", used, "Total uses"],
      ["search", nu, "Search appearances (not used)"]
    ]
      .map(
        ([i, v, l]) => `
        <div class="stat">

          <span class="si">
            ${ic(i)}
          </span>

          <div>
            <b>${v}</b>
            <small>${l}</small>
          </div>

        </div>
        `
      )
      .join("")}

  </div>


  ${
    role === "Cataloguer"
      ? `
      <div class="card pad">

        <h2>
          ${ic("trash-2")}
          Purge candidates
        </h2>

        <p class="muted">

          Components used fewer than

          <input
            id="thr"
            type="number"
            min="1"
            value="15"
            class="num"
          >

          times.

        </p>


        <div class="scroll">

          <table>

            <thead>

              <tr>

                <th>
                  Component
                </th>

                <th>
                  Used
                </th>

                <th>
                  Shown, not used
                </th>

                <th></th>

              </tr>

            </thead>

            <tbody id="pb"></tbody>

          </table>

        </div>

      </div>
      `
      : ""
  }


  <div class="two">

    <div class="card pad">

      <h2>
        Components by category
      </h2>

      ${cnt
        .map(
          ([n, k]) => `
          <div class="bar">

            <span>
              ${E(n)}
            </span>

            <div class="meter">

              <i
                style="width:${
                  (k / mx) * 100
                }%"
              ></i>

            </div>

            <b>
              ${k}
            </b>

          </div>
          `
        )
        .join("")}

    </div>


    <div class="card pad">

      <h2>
        Most used
      </h2>

      ${[...all]
        .sort(
          (a, b) =>
            b.usage.used -
            a.usage.used
        )
        .slice(0, 5)
        .map(
          c => `
          <a
            class="kv"
            href="${url("component")}?id=${c.id}"
          >

            <span>
              ${E(c.name)}
            </span>

            <b>
              ${c.usage.used}
            </b>

          </a>
          `
        )
        .join("")}

    </div>

  </div>


  <div class="card pad">

    <h2>
      All components
    </h2>

    <div class="scroll">

      <table>

        <thead>

          <tr>

            <th>
              Component
            </th>

            <th>
              Category
            </th>

            <th>
              Type
            </th>

            <th>
              Language / notation
            </th>

            <th>
              Used
            </th>

            <th>
              Shown, not used
            </th>

          </tr>

        </thead>


        <tbody>

          ${all
            .map(
              c => `
              <tr>

                <td>

                  <a
                    href="${url("component")}?id=${c.id}"
                  >
                    ${E(c.name)}
                  </a>

                </td>

                <td>
                  ${E(
                    C.categoryPath(
                      c.categoryId
                    )
                  )}
                </td>

                <td>
                  ${E(c.type)}
                </td>

                <td>
                  ${E(C.tech(c))}
                </td>

                <td>
                  ${c.usage.used}
                </td>

                <td>
                  ${c.usage.queriedNotUsed}
                </td>

              </tr>
              `
            )
            .join("")}

        </tbody>

      </table>

    </div>

  </div>

</div>
`;


  if ($("#pb")) {

    // Load the selected component data before submitting an edit.
    const d = async () => {

      try {

        const rows =
          await C.purgeCandidates(
            Number($("#thr").value) || 0
          );


        $("#pb").innerHTML =
          rows
            .map(
              c => `
              <tr>

                <td>
                  ${E(c.name)}
                </td>

                <td>
                  ${c.usage.used}
                </td>

                <td>
                  ${c.usage.queriedNotUsed}
                </td>

                <td>

                  <button
                    class="btn sm danger"
                    data-id="${c.id}"
                  >
                    Purge
                  </button>

                </td>

              </tr>
              `
            )
            .join("") ||

          `
          <tr>
            <td colspan="4">
              No candidates.
            </td>
          </tr>
          `;

      } catch (err) {

        showError(err);
      }

    };


    $("#thr").oninput = d;

    d();


    $("#pb").onclick = async e => {

      const id =
        e.target.dataset.id;


      if (
        id &&
        confirm(
          "Permanently remove this component?"
        )
      ) {

        try {

          await C.remove(
            Number(id)
          );

          P.statistics();

          lucide.createIcons();

        } catch (err) {

          showError(err);
        }
      }

    };

  }

};


/* ---------- error display ---------- */

// Display an API or page error in the shared application error area.
function showError(err) {

  main.innerHTML = `
    <div class="wrap">

      <div class="card pad">

        <h2>
          Something went wrong
        </h2>

        <p>
          ${E(
            err?.message ||
            String(err)
          )}
        </p>

        <p class="muted">

          Make sure the ComponentHub
          backend is running on

          <code>
            http://localhost:3000
          </code>

        </p>

      </div>

    </div>
  `;

}


/* ---------- startup ---------- */

// Initialize the catalogue, select the requested page, and render it.
async function boot() {

  if (!C.isLoggedIn()) {
    const here = (pg === "index" ? "index.html" : `pages/${pg}.html`) + location.search;
    location.replace(`${root}login.html?next=${encodeURIComponent(here)}`);
    return;
  }

  try {

    await C.init();

    P[pg]();

    lucide.createIcons();

  } catch (err) {

    console.error(
      "ComponentHub initialization failed:",
      err
    );

    showError(err);
  }

}


boot();
