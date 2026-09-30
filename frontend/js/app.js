/* ComponentHub UI: shared shell (header/footer) + all pages. */

const C = Catalogue, E = C.esc;
const $ = s => document.querySelector(s);
const ic = n => `<i data-lucide="${n}"></i>`;
const qs = new URLSearchParams(location.search);

const pg = document.body.dataset.page;
const root = document.body.dataset.root || "";

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

const sum = (a, f) => a.reduce((t, x) => t + f(x), 0);

let role = C.role();


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

    <label class="role">
      Role
      <select id="role">
        ${ROLES.map(
          r => `<option${r === role ? " selected" : ""}>${r}</option>`
        ).join("")}
      </select>
    </label>

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
      <span>Student: search &amp; reuse</span>
      <span>Cataloguer: add &amp; maintain</span>
      <span>Manager: usage &amp; purge</span>
    </div>

  </div>

  <div class="wrap copy">
    © 2026 ComponentHub · Software Engineering project
  </div>
</footer>
`;

const main = $("#main");


/* ---------- role selector ---------- */

$("#role").onchange = async e => {
  try {
    await C.setRole(e.target.value);
    location.reload();
  } catch (err) {
    showError(err);
  }
};


/* ---------- reusable component card ---------- */

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

const head = (t, s) => `
<section class="pagehead">
  <div class="wrap">
    <h1>${t}</h1>
    <p>${s}</p>
  </div>
</section>
`;


/* ---------- popular search chips ---------- */

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


  const run = async () => {

    const v = $("#q").value.trim();

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

    history.replaceState(
      null,
      "",
      $("#q").value.trim()
        ? `?q=${encodeURIComponent(
            $("#q").value.trim()
          )}`
        : "search.html"
    );

    await run();
  };


  $("#q").value =
    qs.get("q") || "";

  run().catch(showError);
};


/* ---------- COMPONENT DETAILS ---------- */

P.component = () => {

  const id =
    Number(qs.get("id"));

  const c = C.get(id);


  if (!c) {

    main.innerHTML =
      head(
        "Component not found",
        "It may have been removed."
      ) +

      `
      <div class="wrap">

        <a
          class="btn"
          href="${url("browse")}"
        >
          Back to browse
        </a>

      </div>
      `;

    return;
  }


  const rel =
    C.list({
      categoryId: c.categoryId
    })
      .filter(x => x.id !== id)
      .slice(0, 3);


  main.innerHTML = `

<section class="pagehead">

  <div class="wrap">

    <nav class="crumb">

      <a href="${url("index")}">
        Home
      </a>

      /

      <a href="${url("browse")}">
        Browse
      </a>

      /

      ${E(c.name)}

    </nav>


    <div class="dh">

      <span class="ini xl">
        ${E(c.name[0])}
      </span>

      <div>

        <span
          class="badge${c.type === "Design" ? " d" : ""}"
        >
          ${E(c.type)}
        </span>

        <h1>
          ${E(c.name)}
        </h1>

        <p>
          ${E(C.categoryPath(c.categoryId))}
        </p>

      </div>

    </div>

  </div>

</section>


<div class="wrap detail">

  <section>

    <div class="card pad">

      <h2>
        About
      </h2>

      <p>
        ${E(c.description)}
      </p>


      <h3>
        Keywords
      </h3>

      <div class="tags">

        ${
          c.keywords
            .map(k => `<span>${E(k)}</span>`)
            .join("") ||
          '<small class="muted">No keywords yet</small>'
        }

      </div>

    </div>


    ${
      rel.length
        ? `
        <h2 class="rt">
          More in this category
        </h2>

        <div class="grid">
          ${rel.map(card).join("")}
        </div>
        `
        : ""
    }

  </section>


  <aside>

    <div class="card pad">

      <button
        class="btn block"
        id="use"
      >
        ${ic("download")}
        Use this component
      </button>


      ${
        role === "Cataloguer"
          ? `
          <button
            class="btn ghost block"
            id="kw"
          >
            ${ic("tags")}
            Edit keywords
          </button>

          <button
            class="btn danger block"
            id="del"
          >
            ${ic("trash-2")}
            Delete
          </button>
          `
          : ""
      }

    </div>


    <div class="card pad">

      <h3>
        Usage
      </h3>

      <div class="kv">

        <span>
          Times used
        </span>

        <b>
          ${c.usage.used}
        </b>

      </div>


      <div class="kv">

        <span>
          Shown in search, not used
        </span>

        <b>
          ${c.usage.queriedNotUsed}
        </b>

      </div>

    </div>


    <div class="card pad">

      <h3>
        Details
      </h3>

      <div class="kv">

        <span>
          ${c.type === "Design"
            ? "Notation"
            : "Language"}
        </span>

        <b>
          ${E(C.tech(c) || "—")}
        </b>

      </div>


      <div class="kv">

        <span>
          Added
        </span>

        <b>
          ${c.addedOn}
        </b>

      </div>


      ${
        c.url
          ? `
          <div class="kv">

            <span>
              Resource
            </span>

            <a
              href="${E(c.url)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open
            </a>

          </div>
          `
          : ""
      }

    </div>

  </aside>

</div>
`;


  $("#use").onclick = async () => {

    try {

      await C.markUsed(id);

      P.component();

      lucide.createIcons();

    } catch (err) {

      showError(err);
    }
  };


  if ($("#kw")) {

    $("#kw").onclick = async () => {

      const v =
        prompt(
          "Keywords (comma separated):",
          c.keywords.join(", ")
        );


      if (v !== null) {

        try {

          await C.setKeywords(
            id,
            v.split(",")
          );

          P.component();

          lucide.createIcons();

        } catch (err) {

          showError(err);
        }
      }

    };
  }


  if ($("#del")) {

    $("#del").onclick = async () => {

      if (
        confirm(
          "Delete this component from the catalogue?"
        )
      ) {

        try {

          await C.remove(id);

          location.href =
            url("browse");

        } catch (err) {

          showError(err);
        }
      }

    };
  }

};


/* ---------- ADD COMPONENT ---------- */

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
          $("#url").value.trim()

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
    role === "Manager"
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

async function boot() {

  try {

    await C.init();

    role = C.role();

    const roleSelect =
      document.querySelector("#role");

    if (roleSelect) {
      roleSelect.value = role;
    }

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