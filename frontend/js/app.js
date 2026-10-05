/* ComponentHub UI: shared shell (header/footer) + all pages. */

const C = Catalogue,
    E = C.esc;
const $ = (s) => document.querySelector(s);
const ic = (n) => `<i data-lucide="${n}"></i>`;
const qs = new URLSearchParams(location.search);

const pg = document.body.dataset.page;
const root = document.body.dataset.root || '';

const url = (p) => root + (p === 'index' ? 'index.html' : `pages/${p}.html`);

const P = {};

const NAV = [
    ['index', 'Home'],
    ['browse', 'Browse'],
    ['search', 'Search'],
    ['add-component', 'Add Component', true],
    ['categories', 'Categories', true],
    ['statistics', 'Statistics'],
];

const sum = (a, f) => a.reduce((t, x) => t + f(x), 0);
const debounce = (fn, ms = 300) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
};

const role = C.role();
const isCat = C.isCataloguer();
const U = C.user() || {username: '?', role: 'User'};
let componentNotice = '';

/* ---------- shared shell ---------- */

document.body.innerHTML = `
<header class="topbar">
  <div class="wrap bar">

    <a class="brand" href="${url('index')}">
      <span class="logo">${ic('box')}</span>
      <span>
        <b>ComponentHub</b>
        <small>Software Component Catalogue</small>
      </span>
    </a>

    <nav>
      ${NAV.filter(([, , catOnly]) => !catOnly || isCat)
          .map(
              ([p, l]) =>
                  `<a href="${url(p)}" ${p === pg || (pg === 'component' && p === 'browse') ? 'class="on"' : ''}>${l}</a>`,
          )
          .join('')}
    </nav>

    <div class="userbox">
      <span class="uavatar">${E(U.username[0].toUpperCase())}</span>
      <span class="uname"><b>${E(U.username)}</b><small>${E(U.role)}</small></span>
      <button class="btn ghost sm" id="logout">${ic('log-out')} Log out</button>
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
      <a href="${url('browse')}">Browse</a>
      <a href="${url('search')}">Search</a>
      <a href="${url('statistics')}">Statistics</a>
    </div>

    <div>
      <h4>Roles</h4>
      <span>User: search, browse &amp; reuse</span>
      <span>Cataloguer: add, maintain &amp; purge</span>
    </div>

  </div>

  <div class="wrap copy">
    © 2026 ComponentHub · Software Engineering project
  </div>
</footer>
`;

const main = $('#main');

$('#logout').onclick = () => {
    C.logout();
    location.href = root + 'login.html';
};

/* ---------- shared pieces ---------- */

/* qid links a later "use" to the search the component came from. */
const card = (c, qid) => `
<article class="card comp">

  <div class="row">
    <span class="ini">${E(c.name[0])}</span>
    <span class="badge${c.type === 'Design' ? ' d' : ''}">${E(c.type)}</span>
  </div>

  <h3>
    <a href="${url('component')}?id=${c.id}${qid ? `&qid=${qid}` : ''}">${E(c.name)}</a>
  </h3>

  <p>${E(c.description)}</p>

  <div class="tags">
    ${[
        C.categoryPath(c.categoryId).split(' › ').pop(),
        C.tech(c),
        ...c.keywords.slice(0, 2),
    ]
        .filter(Boolean)
        .map((t) => `<span>${E(t)}</span>`)
        .join('')}
  </div>

  <div class="row foot">
    <small>${ic('activity')} ${c.usage.used} uses</small>
    <a href="${url('component')}?id=${c.id}${qid ? `&qid=${qid}` : ''}">
      View details ${ic('arrow-right')}
    </a>
  </div>

</article>
`;

const head = (t, s) => `
<section class="pagehead">
  <div class="wrap">
    <h1>${t}</h1>
    <p>${s}</p>
  </div>
</section>
`;

const chips = (a) =>
    a
        .map(
            (t) =>
                `<a href="${url('search')}?q=${encodeURIComponent(t)}">${E(t)}</a>`,
        )
        .join('');

const POP = [
    'authentication',
    'uml class diagram',
    'binary search',
    'python web framework',
    'logging',
    'erd',
];

const pager = (page, pages) =>
    pages > 1
        ? `<div class="pager">
         <button class="btn ghost sm" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>${ic('chevron-left')} Previous</button>
         <span>Page ${page} of ${pages}</span>
         <button class="btn ghost sm" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''}>Next ${ic('chevron-right')}</button>
       </div>`
        : '';

const bindPager = (box, go) =>
    box.querySelectorAll('[data-page]').forEach((b) => {
        b.onclick = () => go(Number(b.dataset.page));
    });

const statCards = (items) => `
<div class="stats">
  ${items
      .map(
          ([i, v, l]) => `
    <div class="stat">
      <span class="si">${ic(i)}</span>
      <div><b>${v}</b><small>${l}</small></div>
    </div>`,
      )
      .join('')}
</div>`;

const catOptions = (selected, parent = null, depth = 0) =>
    C.childrenOf(parent)
        .map(
            (c) =>
                `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${'\u00a0\u00a0'.repeat(depth)}${E(c.name)}</option>` +
                catOptions(selected, c.id, depth + 1),
        )
        .join('');

/* Language / notation: a list of known values plus "Other". */
const techChoices = (type, value) => {
    const list = C.techList(type);
    const known = list.find(
        (x) => x.toLowerCase() === String(value || '').toLowerCase(),
    );
    return (
        `<option value="">Select…</option>` +
        list
            .map(
                (x) =>
                    `<option ${x === known ? 'selected' : ''}>${E(x)}</option>`,
            )
            .join('') +
        `<option value="__other" ${value && !known ? 'selected' : ''}>Other…</option>`
    );
};

const techField = (p) => `
<label>
  <span id="${p}-tl">Language</span>
  <select id="${p}-tech" required></select>
  <input id="${p}-other" placeholder="Type the language or notation" hidden>
</label>`;

const bindTech = (p, initial) => {
    const type = $(`#${p}-type`),
        sel = $(`#${p}-tech`),
        other = $(`#${p}-other`);
    const sync = () => {
        other.hidden = sel.value !== '__other';
        other.required = !other.hidden;
    };
    const fill = (value) => {
        $(`#${p}-tl`).textContent =
            type.value === 'Design' ? 'Notation' : 'Language';
        sel.innerHTML = techChoices(type.value, value);
        other.value = sel.value === '__other' ? value : '';
        sync();
    };
    type.onchange = () => fill('');
    sel.onchange = sync;
    fill(initial);
};

const readTech = (p) =>
    $(`#${p}-tech`).value === '__other'
        ? $(`#${p}-other`).value.trim()
        : $(`#${p}-tech`).value;

const notFound = () => {
    main.innerHTML =
        head('Component not found', 'It may have been removed.') +
        `<div class="wrap"><a class="btn" href="${url('browse')}">Back to browse</a></div>`;
};

/* ---------- HOME ---------- */

P.index = async () => {
    const s = await C.stats();
    const tops = C.childrenOf(null);

    main.innerHTML = `
<section class="hero">
  <div class="wrap">

    <span class="eyebrow">DISCOVER · REUSE · BUILD FASTER</span>

    <h1>Find reusable components.<br><em>Build software faster.</em></h1>

    <p>
      Search a shared catalogue of code and design components,
      browse by category, and see what your peers actually reuse.
    </p>

    <form class="search" id="sf">
      ${ic('search')}
      <input id="q" placeholder="Search by key words, e.g. authentication python" autocomplete="off">
      <button class="btn">Search</button>
    </form>

    <div class="chips"><b>Popular:</b> ${chips(POP)}</div>

  </div>
</section>

<section class="wrap">

  ${statCards([
      ['box', s.components, 'Components'],
      ['folder', s.categories, 'Categories'],
      ['bar-chart-3', s.used, 'Total uses'],
      ['search', s.notUsed, 'Search appearances (not used)'],
  ])}

  <div class="two">

    <div class="card">
      <div class="ch">
        <h2>${ic('clock-3')} Recently added</h2>
        <a href="${url('browse')}">View all</a>
      </div>

      ${s.recent
          .map(
              (c) => `
        <a class="li" href="${url('component')}?id=${c.id}">
          <span class="ini">${E(c.name[0])}</span>
          <div><b>${E(c.name)}</b><small>${E(c.description)}</small></div>
          <div class="meta"><small>${E(c.addedOn)}</small><b>${c.usage.used} uses</b></div>
        </a>`,
          )
          .join('')}
    </div>

    <div class="card">
      <div class="ch"><h2>${ic('folder')} Browse by category</h2></div>

      ${tops
          .map(
              (c) => `
        <a class="li cat" href="${url('browse')}?category=${c.id}">
          ${ic('folder')}
          <div>
            <b>${E(c.name)}</b>
            <small>${
                C.childrenOf(c.id)
                    .map((x) => E(x.name))
                    .join(', ') || '&nbsp;'
            }</small>
          </div>
          <span class="count">${c.componentCount}</span>
        </a>`,
          )
          .join('')}
    </div>

  </div>

  <div class="card pad">
    <h2>${ic('bar-chart-3')} Usage overview</h2>
    <div class="meter"><i style="width:${(s.used / (s.used + s.notUsed || 1)) * 100}%"></i></div>
    <div class="legend">
      <span><i></i> ${s.used} used in projects</span>
      <span><i class="y"></i> ${s.notUsed} shown in search, not used</span>
    </div>
  </div>

</section>
`;

    $('#sf').onsubmit = (e) => {
        e.preventDefault();
        const v = $('#q').value.trim();
        if (v) location.href = `${url('search')}?q=${encodeURIComponent(v)}`;
    };
};

/* ---------- BROWSE ---------- */

P.browse = async () => {
    const req = qs.get('category');
    const found = C._d.categories.find(
        (c) => String(c.id) === req || c.name === req,
    );
    const cat = found ? found.id : null;
    const total = sum(C.childrenOf(null), (c) => c.componentCount);

    const tree = (parent) =>
        C.childrenOf(parent)
            .map(
                (c) => `
        <li>
          <a class="${c.id === cat ? 'on' : ''}" href="?category=${c.id}">
            ${ic('folder')}<span>${E(c.name)}</span><b>${c.componentCount}</b>
          </a>
          ${C.childrenOf(c.id).length ? `<ul>${tree(c.id)}</ul>` : ''}
        </li>`,
            )
            .join('');

    const techs = [...new Set([...C._d.languages, ...C._d.notations])].sort();

    main.innerHTML =
        head(
            'Browse components',
            cat
                ? E(C.categoryPath(cat))
                : 'Explore reusable components organised by category.',
        ) +
        `
<div class="wrap side">

  <aside class="card pad">
    <h3>Categories</h3>
    <ul class="tree">
      <li>
        <a class="${cat == null ? 'on' : ''}" href="browse.html">
          ${ic('layers')}<span>All components</span><b>${total}</b>
        </a>
      </li>
      ${tree(null)}
    </ul>
  </aside>

  <section>

    <div class="card filters">
      <div class="search sm">
        ${ic('search')}
        <input id="f" placeholder="Filter by name, description, key word…">
      </div>

      <select id="t">
        <option value="">All types</option>
        <option>Code</option>
        <option>Design</option>
      </select>

      <select id="l">
        <option value="">All languages / notations</option>
        ${techs.map((t) => `<option>${E(t)}</option>`).join('')}
      </select>

      <select id="s">
        <option value="name">Name</option>
        <option value="usage">Most used</option>
        <option value="new">Newest</option>
      </select>
    </div>

    <p class="muted" id="n"></p>
    <div class="grid" id="g"></div>
    <div id="pg"></div>

  </section>

</div>
`;

    let page = 1;

    const draw = async () => {
        try {
            const r = await C.listComponents({
                category: cat,
                q: $('#f').value.trim(),
                type: $('#t').value,
                tech: $('#l').value,
                sort: $('#s').value,
                page,
                limit: 12,
            });

            page = r.page;
            $('#n').textContent =
                `${r.total} component${r.total === 1 ? '' : 's'}`;
            $('#g').innerHTML =
                r.items.map((c) => card(c)).join('') ||
                `<div class="empty card">No components match your filters.</div>`;
            $('#pg').innerHTML = pager(r.page, r.pages);
            bindPager($('#pg'), (n) => {
                page = n;
                draw();
                scrollTo({top: 0});
            });
            lucide.createIcons();
        } catch (err) {
            showError(err);
        }
    };

    const reset = () => {
        page = 1;
        draw();
    };

    $('#f').addEventListener('input', debounce(reset));
    ['#t', '#l', '#s'].forEach((i) => $(i).addEventListener('input', reset));

    await draw();
};

/* ---------- SEARCH ---------- */

P.search = async () => {
    main.innerHTML =
        head(
            'Search components',
            'Describe the component you need with key words. Each search is recorded so unused components can be found later.',
        ) +
        `
<div class="wrap">

  <form class="search big" id="sf">
    ${ic('search')}
    <input id="q" placeholder="e.g. authentication python" autocomplete="off">
    <button class="btn">Search</button>
  </form>

  <div class="card filters">
    <select id="m">
      <option value="all">Match all words</option>
      <option value="any">Match any word</option>
    </select>
    <select id="t">
      <option value="">All types</option>
      <option>Code</option>
      <option>Design</option>
    </select>
  </div>

  <div class="chips"><b>Popular:</b> ${chips(POP)}</div>

  <h2 id="rt" class="rt"></h2>
  <div class="grid" id="g"></div>
  <div id="pg"></div>

</div>
`;

    const run = async (page = 1) => {
        const v = $('#q').value.trim();

        if (!v) {
            $('#rt').textContent = '';
            $('#g').innerHTML =
                `<div class="empty card">Type one or more key words to search the catalogue.</div>`;
            $('#pg').innerHTML = '';
            return;
        }

        const r = await C.search({
            q: v,
            match: $('#m').value,
            type: $('#t').value,
            page,
            limit: 12,
        });

        $('#rt').textContent =
            `${r.total} result${r.total === 1 ? '' : 's'} for “${v}”`;

        $('#g').innerHTML =
            r.items.map((c) => card(c, r.queryId)).join('') ||
            `<div class="empty card">
         No components found. Try fewer or different key words, or “match any word”.
       </div>`;

        $('#pg').innerHTML = pager(r.page, r.pages);
        bindPager($('#pg'), (n) => run(n).catch(showError));
        lucide.createIcons();
    };

    const submit = (e) => {
        e && e.preventDefault();
        const v = $('#q').value.trim();
        const params = new URLSearchParams();
        if (v) params.set('q', v);
        if ($('#m').value !== 'all') params.set('match', $('#m').value);
        if ($('#t').value) params.set('type', $('#t').value);
        history.replaceState(
            null,
            '',
            params.toString() ? `?${params}` : 'search.html',
        );
        return run().catch(showError);
    };

    $('#sf').onsubmit = submit;
    $('#m').onchange = submit;
    $('#t').onchange = submit;

    $('#q').value = qs.get('q') || '';
    $('#m').value = qs.get('match') === 'any' ? 'any' : 'all';
    $('#t').value = ['Code', 'Design'].includes(qs.get('type'))
        ? qs.get('type')
        : '';

    await run().catch(showError);
};

/* ---------- COMPONENT DETAILS ---------- */

P.component = async () => {
    const id = Number(qs.get('id'));
    const qid = Number(qs.get('qid')) || null;

    const notice = componentNotice;
    componentNotice = '';

    main.innerHTML = `<div class="wrap"><div class="card pad">Loading component...</div></div>`;

    let c;
    try {
        c = await C.getComponent(id);
    } catch (err) {
        if (err.status === 404) return notFound();
        return showError(err);
    }

    const related = (
        await C.listComponents({category: c.categoryId, limit: 4})
    ).items
        .filter((x) => x.id !== id)
        .slice(0, 3);

    main.innerHTML = `

<section class="pagehead">
  <div class="wrap">

    <nav class="crumb">
      <a href="${url('index')}">Home</a> /
      <a href="${url('browse')}">Browse</a> /
      ${E(c.name)}
    </nav>

    <div class="dh">
      <span class="ini xl">${E(c.name[0])}</span>
      <div>
        <span class="badge${c.type === 'Design' ? ' d' : ''}">${E(c.type)}</span>
        <h1>${E(c.name)}</h1>
        <p>${E(C.categoryPath(c.categoryId))}</p>
      </div>
    </div>

  </div>
</section>

<div class="wrap">${notice ? `<p class="ok">${E(notice)}</p>` : ''}<p class="bad" id="err" hidden></p></div>

<div class="wrap detail">

  <section>

    <div class="card pad">

      <h2>About</h2>
      <p>${E(c.description)}</p>

      <h3>Key words</h3>
      <div class="tags" id="tags">
        ${
            c.keywords.map((k) => `<span>${E(k)}</span>`).join('') ||
            '<small class="muted">No key words yet</small>'
        }
      </div>

      ${
          isCat
              ? `
        <form class="inline" id="kwform" hidden>
          <input id="kwinput" value="${E(c.keywords.join(', '))}" placeholder="authentication, jwt, security">
          <button class="btn sm">Save</button>
          <button type="button" class="btn ghost sm" id="kwcancel">Cancel</button>
        </form>`
              : ''
      }

    </div>

    ${
        related.length
            ? `
      <h2 class="rt">More in this category</h2>
      <div class="grid">${related.map((x) => card(x)).join('')}</div>`
            : ''
    }

  </section>

  <aside>

    <div class="card pad">

      <button class="btn block" id="use">${ic('download')} Use this component</button>

      ${
          isCat
              ? `
        <button class="btn ghost block" id="edit">${ic('pencil')} Edit</button>
        <button class="btn ghost block" id="kw">${ic('tags')} Edit key words</button>
        <button class="btn danger block" id="del">${ic('trash-2')} Delete</button>`
              : ''
      }

    </div>

    <div class="card pad">
      <h3>Usage</h3>
      <div class="kv"><span>Times used</span><b>${c.usage.used}</b></div>
      <div class="kv"><span>Shown in search, not used</span><b>${c.usage.queriedNotUsed}</b></div>
    </div>

    <div class="card pad">
      <h3>Details</h3>
      <div class="kv">
        <span>${c.type === 'Design' ? 'Notation' : 'Language'}</span>
        <b>${E(C.tech(c) || '—')}</b>
      </div>
      <div class="kv"><span>Added</span><b>${E(c.addedOn)}</b></div>
      ${
          c.url
              ? `
        <div class="kv">
          <span>Resource</span>
          <a href="${E(c.url)}" target="_blank" rel="noopener noreferrer">Open</a>
        </div>`
              : ''
      }
    </div>

  </aside>

</div>
`;

    const fail = (err) => {
        $('#err').textContent = err.message;
        $('#err').hidden = false;
    };

    $('#use').onclick = async () => {
        let resourceWindow = null;

        try {
            if (c.url) resourceWindow = window.open('about:blank', '_blank');

            const r = await C.markUsed(id, qid);

            if (resourceWindow) resourceWindow.location.href = c.url;

            componentNotice = r.counted
                ? 'Use recorded.'
                : 'This use was already recorded a moment ago.';
            await P.component();
        } catch (err) {
            if (resourceWindow && !resourceWindow.closed)
                resourceWindow.close();
            fail(err);
        }
    };

    if (isCat) {
        $('#edit').onclick = () => P.editComponent();

        $('#kw').onclick = () => {
            $('#kwform').hidden = false;
            $('#kwinput').focus();
        };
        $('#kwcancel').onclick = () => {
            $('#kwform').hidden = true;
        };

        $('#kwform').onsubmit = async (e) => {
            e.preventDefault();
            try {
                await C.setKeywords(id, $('#kwinput').value.split(','));
                componentNotice = 'Key words saved.';
                await P.component();
            } catch (err) {
                fail(err);
            }
        };

        $('#del').onclick = async () => {
            if (
                !confirm(
                    `Delete “${c.name}” from the catalogue?\n\n` +
                        `It has been used ${c.usage.used} time(s) and shown in searches ${c.usage.queriedNotUsed} time(s) without being used.`,
                )
            )
                return;

            try {
                await C.remove(id);
                location.href = url('browse');
            } catch (err) {
                fail(err);
            }
        };
    }

    lucide.createIcons();
};

P.editComponent = async () => {
    if (!isCat) return;

    const id = Number(qs.get('id'));
    let c;

    main.innerHTML = `<div class="wrap"><div class="card pad">Loading component...</div></div>`;

    try {
        c = await C.getComponent(id);
    } catch (err) {
        if (err.status === 404) return notFound();
        return showError(err);
    }

    main.innerHTML =
        head(
            'Edit component',
            'Update the component details, key words and resource reference.',
        ) +
        `
<div class="wrap narrow">

  <form class="card pad form" id="edit-form" autocomplete="off">

    <p class="bad" id="edit-err" hidden></p>

    <label>Name *
      <input id="edit-name" required value="${E(c.name)}">
    </label>

    <div class="cols">
      <label>Category *
        <select id="edit-cat" required>${catOptions(c.categoryId)}</select>
      </label>

      <label>Type *
        <select id="edit-type" required>
          <option ${c.type === 'Code' ? 'selected' : ''}>Code</option>
          <option ${c.type === 'Design' ? 'selected' : ''}>Design</option>
        </select>
      </label>
    </div>

    ${techField('edit')}

    <label>Description *
      <textarea id="edit-desc" rows="4" required>${E(c.description)}</textarea>
    </label>

    <label>Key words
      <input id="edit-kw" value="${E(c.keywords.join(', '))}">
      <small>Separate with commas.</small>
    </label>

    <label>Resource URL
      <input id="edit-url" type="url" value="${E(c.url)}" placeholder="https://github.com/...">
    </label>

    <div class="actions">
      <button type="button" class="btn ghost" id="edit-cancel">Cancel</button>
      <button class="btn">Save Changes</button>
    </div>

  </form>

</div>
`;

    bindTech('edit', C.tech(c));

    $('#edit-cancel').onclick = () => P.component();

    $('#edit-form').onsubmit = async (event) => {
        event.preventDefault();
        $('#edit-err').hidden = true;

        try {
            await C.updateComponent(id, {
                name: $('#edit-name').value.trim(),
                description: $('#edit-desc').value.trim(),
                categoryId: Number($('#edit-cat').value),
                type: $('#edit-type').value,
                tech: readTech('edit'),
                keywords: $('#edit-kw').value.split(','),
                url: $('#edit-url').value.trim(),
            });

            componentNotice = 'Component updated successfully.';
            await P.component();
        } catch (err) {
            $('#edit-err').textContent = err.message;
            $('#edit-err').hidden = false;
        }
    };

    lucide.createIcons();
};

/* ---------- ADD COMPONENT ---------- */

P['add-component'] = () => {
    if (!isCat) {
        main.innerHTML =
            head('Add component', 'Cataloguers only.') +
            `<div class="wrap"><div class="card pad">
         Only a <b>cataloguer</b> can add components to the catalogue.
       </div></div>`;
        return;
    }

    main.innerHTML =
        head(
            'Add component',
            'Add a reusable code or design component to the catalogue.',
        ) +
        `
<div class="wrap narrow">

  <form class="card pad form" id="f" autocomplete="off">

    <p class="ok" id="ok" hidden></p>
    <p class="bad" id="err" hidden></p>

    <label>Name *
      <input id="name" required placeholder="e.g. JWT Authentication">
    </label>

    <div class="cols">
      <label>Category *
        <select id="cat" required>
          <option value="">Select category</option>
          ${catOptions(null)}
        </select>
      </label>

      <label>Type *
        <select id="add-type" required>
          <option>Code</option>
          <option>Design</option>
        </select>
      </label>
    </div>

    ${techField('add')}

    <label>Description *
      <textarea id="desc" rows="4" required
        placeholder="What does it do and when should it be used?"></textarea>
    </label>

    <label>Key words
      <input id="kw" placeholder="authentication, jwt, security">
      <small>Separate with commas. Users find the component by these words.</small>
    </label>

    <label>Resource URL
      <input id="url" type="url" placeholder="https://github.com/…">
    </label>

    <div class="actions">
      <a class="btn ghost" href="${url('index')}">Cancel</a>
      <button class="btn">Add component</button>
    </div>

  </form>

</div>
`;

    bindTech('add', '');

    $('#f').onsubmit = async (e) => {
        e.preventDefault();
        $('#err').hidden = true;
        $('#ok').hidden = true;

        try {
            const created = await C.add({
                name: $('#name').value.trim(),
                description: $('#desc').value.trim(),
                categoryId: Number($('#cat').value),
                type: $('#add-type').value,
                tech: readTech('add'),
                keywords: $('#kw')
                    .value.split(',')
                    .map((k) => k.trim())
                    .filter(Boolean),
                url: $('#url').value.trim(),
            });

            await C.refreshCategories();
            e.target.reset();
            bindTech('add', '');

            $('#ok').innerHTML =
                `Added “${E(created.name)}”. <a href="${url('component')}?id=${created.id}">View it</a>`;
            $('#ok').hidden = false;
            scrollTo({top: 0, behavior: 'smooth'});
        } catch (err) {
            $('#err').textContent = err.message;
            $('#err').hidden = false;
        }
    };
};

/* ---------- CATEGORIES (cataloguer) ---------- */

P.categories = () => {
    if (!isCat) {
        main.innerHTML =
            head('Categories', 'Cataloguers only.') +
            `<div class="wrap"><div class="card pad">
         Only a <b>cataloguer</b> can manage categories. You can browse them on the
         <a href="${url('browse')}">Browse</a> page.
       </div></div>`;
        return;
    }

    /* editing: null = adding, otherwise the category being edited */
    let editing = null;
    let message = null;

    const parentOptions = (selected, excluded, parent = null, depth = 0) =>
        C.childrenOf(parent)
            .filter((c) => !excluded.includes(c.id))
            .map(
                (c) =>
                    `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${'\u00a0\u00a0'.repeat(depth)}${E(c.name)}</option>` +
                    parentOptions(selected, excluded, c.id, depth + 1),
            )
            .join('');

    const rows = (parent, depth = 0) =>
        C.childrenOf(parent)
            .map(
                (c) =>
                    `
        <div class="catrow" style="padding-left:${depth * 22}px">
          ${ic('folder')}
          <span class="catname">${E(c.name)}</span>
          <small>${c.componentCount} component${c.componentCount === 1 ? '' : 's'}</small>
          <span class="rowbtns">
            <button class="btn ghost sm" data-act="child" data-id="${c.id}" title="Add subcategory">${ic('plus')}</button>
            <button class="btn ghost sm" data-act="edit" data-id="${c.id}" title="Rename or move">${ic('pencil')}</button>
            <button class="btn danger sm" data-act="del" data-id="${c.id}" title="Delete">${ic('trash-2')}</button>
          </span>
        </div>` + rows(c.id, depth + 1),
            )
            .join('');

    const draw = (presetParent = null) => {
        const current = editing ? C.category(editing) : null;
        const excluded = current ? C.subtreeIds(current.id) : [];
        const parent = current ? current.parent : presetParent;

        main.innerHTML =
            head(
                'Categories',
                'Organise components into a hierarchy. Users browse the catalogue through these categories.',
            ) +
            `
<div class="wrap side">

  <aside class="card pad">

    <h3>${current ? 'Edit category' : 'Add category'}</h3>

    ${message ? `<p class="${message.ok ? 'ok' : 'bad'}">${E(message.text)}</p>` : ''}

    <form class="form" id="cf">
      <label>Name *
        <input id="cname" required maxlength="60" value="${E(current ? current.name : '')}">
      </label>

      <label>Parent category
        <select id="cparent">
          <option value="">— Top level —</option>
          ${parentOptions(parent, excluded)}
        </select>
      </label>

      <div class="actions">
        ${current ? `<button type="button" class="btn ghost" id="ccancel">Cancel</button>` : ''}
        <button class="btn">${current ? 'Save changes' : 'Add category'}</button>
      </div>
    </form>

  </aside>

  <section class="card pad">
    <h2>${ic('folder-tree')} Category tree</h2>
    ${rows(null) || '<p class="muted">No categories yet.</p>'}
  </section>

</div>
`;

        lucide.createIcons();
        $('#cname').focus();

        if ($('#ccancel'))
            $('#ccancel').onclick = () => {
                editing = null;
                message = null;
                draw();
            };

        $('#cf').onsubmit = async (e) => {
            e.preventDefault();
            const name = $('#cname').value.trim();
            const parentId =
                $('#cparent').value === '' ? null : Number($('#cparent').value);

            try {
                if (editing) {
                    await C.updateCategory(editing, {name, parentId});
                    message = {ok: true, text: `Saved “${name}”.`};
                    editing = null;
                } else {
                    await C.addCategory(name, parentId);
                    message = {ok: true, text: `Added “${name}”.`};
                }
                draw();
            } catch (err) {
                message = {ok: false, text: err.message};
                draw(parentId);
            }
        };

        main.querySelectorAll('[data-act]').forEach((b) => {
            b.onclick = async () => {
                const id = Number(b.dataset.id);
                const category = C.category(id);
                message = null;

                if (b.dataset.act === 'edit') {
                    editing = id;
                    return draw();
                }

                if (b.dataset.act === 'child') {
                    editing = null;
                    return draw(id);
                }

                if (!confirm(`Delete the category “${category.name}”?`)) return;

                try {
                    await C.removeCategory(id);
                    message = {ok: true, text: `Deleted “${category.name}”.`};
                } catch (err) {
                    message = {ok: false, text: err.message};
                }
                editing = null;
                draw();
            };
        });
    };

    draw();
};

/* ---------- STATISTICS ---------- */

P.statistics = async () => {
    const s = await C.stats();
    const mx = Math.max(1, ...s.byCategory.map((x) => x.count));
    const mt = Math.max(1, ...s.byType.map((x) => x.count));

    const bars = (items, max) =>
        items
            .map(
                (x) => `
    <div class="bar">
      <span>${E(x.name || x.type)}</span>
      <div class="meter"><i style="width:${(x.count / max) * 100}%"></i></div>
      <b>${x.count}</b>
    </div>`,
            )
            .join('');

    const list = (items, value) =>
        items
            .map(
                (c) => `
    <a class="kv" href="${url('component')}?id=${c.id}">
      <span>${E(c.name)}</span><b>${value(c)}</b>
    </a>`,
            )
            .join('');

    main.innerHTML =
        head(
            'Catalogue statistics',
            'Components, categories and how often they are reused.',
        ) +
        `
<div class="wrap">

  ${statCards([
      ['box', s.components, 'Components'],
      ['folder', s.categories, 'Categories'],
      ['bar-chart-3', s.used, 'Total uses'],
      ['search', s.notUsed, 'Search appearances (not used)'],
      ['text-search', s.queries, 'Searches made'],
  ])}

  <div class="two">

    <div class="card pad">
      <h2>Components by category</h2>
      ${bars(s.byCategory, mx)}
      <h3>By type</h3>
      ${bars(s.byType, mt)}
    </div>

    <div class="card pad">
      <h2>Most used</h2>
      ${list(s.mostUsed, (c) => c.usage.used)}
      <h3>Most often shown in search, not used</h3>
      ${list(s.mostShownNotUsed, (c) => c.usage.queriedNotUsed)}
    </div>

  </div>

  ${
      isCat
          ? `
  <div class="card pad" id="purge">

    <h2>${ic('trash-2')} Purge candidates</h2>

    <p class="muted">
      Components that keep coming up in searches but are rarely used, and have been in the
      catalogue long enough to be judged:
    </p>

    <div class="criteria">
      <label>shown, not used at least
        <input id="p-shown" type="number" min="0" value="5" class="num"> times</label>
      <label>used at most
        <input id="p-used" type="number" min="0" value="2" class="num"> times</label>
      <label>in the catalogue at least
        <input id="p-age" type="number" min="0" value="30" class="num"> days</label>
    </div>

    <div class="scroll">
      <table>
        <thead>
          <tr>
            <th><input type="checkbox" id="p-all" aria-label="Select all"></th>
            <th>Component</th>
            <th>Category</th>
            <th>Used</th>
            <th>Shown, not used</th>
            <th>Not used</th>
            <th>Age (days)</th>
          </tr>
        </thead>
        <tbody id="pb"></tbody>
      </table>
    </div>

    <p class="bad" id="p-err" hidden></p>

    <div class="actions">
      <button class="btn danger" id="p-go" disabled>Purge selected</button>
    </div>

  </div>

  <div class="two">
    <div class="card pad">
      <h2>${ic('search')} Top searches</h2>
      <div id="q-top"></div>
    </div>
    <div class="card pad">
      <h2>${ic('search-x')} Searches with no results</h2>
      <p class="muted">Components users looked for but could not find.</p>
      <div id="q-none"></div>
    </div>
  </div>`
          : ''
  }

</div>
`;

    if (!isCat) return;

    const failPurge = (err) => {
        $('#p-err').textContent = err.message;
        $('#p-err').hidden = false;
    };

    const selected = () =>
        [...document.querySelectorAll('#pb input:checked')].map((i) =>
            Number(i.value),
        );

    const refreshButton = () => {
        const n = selected().length;
        $('#p-go').disabled = n === 0;
        $('#p-go').textContent = n ? `Purge ${n} selected` : 'Purge selected';
    };

    const load = async () => {
        $('#p-err').hidden = true;
        try {
            const r = await C.purgeCandidates({
                minShown: $('#p-shown').value,
                maxUsed: $('#p-used').value,
                minAgeDays: $('#p-age').value,
            });

            $('#pb').innerHTML =
                r.items
                    .map(
                        (c) => `
          <tr>
            <td><input type="checkbox" value="${c.id}"></td>
            <td><a href="${url('component')}?id=${c.id}">${E(c.name)}</a></td>
            <td>${E(C.categoryPath(c.categoryId))}</td>
            <td>${c.usage.used}</td>
            <td>${c.usage.queriedNotUsed}</td>
            <td>${c.usage.notUsedRatio == null ? '—' : Math.round(c.usage.notUsedRatio * 100) + '%'}</td>
            <td>${c.ageDays}</td>
          </tr>`,
                    )
                    .join('') ||
                `<tr><td colspan="7">No candidates for these criteria.</td></tr>`;

            $('#p-all').checked = false;
            refreshButton();
        } catch (err) {
            failPurge(err);
        }
    };

    ['#p-shown', '#p-used', '#p-age'].forEach((i) =>
        $(i).addEventListener('input', debounce(load)),
    );

    $('#p-all').onchange = () => {
        document.querySelectorAll('#pb input[type=checkbox]').forEach((i) => {
            i.checked = $('#p-all').checked;
        });
        refreshButton();
    };

    $('#pb').onchange = refreshButton;

    $('#p-go').onclick = async () => {
        const ids = selected();
        if (!ids.length) return;
        if (
            !confirm(
                `Permanently remove ${ids.length} component(s) from the catalogue?`,
            )
        )
            return;

        try {
            await C.purgeComponents(ids);
            await C.refreshCategories();
            await P.statistics();
            lucide.createIcons();
        } catch (err) {
            failPurge(err);
        }
    };

    const queryRows = (rows) =>
        rows
            .map(
                (r) => `
      <div class="kv"><span>${E(r.q)}</span><b>${r.count}×</b></div>`,
            )
            .join('') || '<small class="muted">Nothing yet.</small>';

    try {
        const q = await C.queryStats();
        $('#q-top').innerHTML = queryRows(q.top);
        $('#q-none').innerHTML = queryRows(q.noResults);
    } catch (err) {
        failPurge(err);
    }

    await load();
};

/* ---------- error display ---------- */

function showError(err) {
    main.innerHTML = `
    <div class="wrap">
      <div class="card pad">
        <h2>Something went wrong</h2>
        <p>${E(err?.message || String(err))}</p>
        <p class="muted">
          Make sure the ComponentHub backend is running
          (locally: <code>npm start</code> in the backend folder, port 3000).
        </p>
      </div>
    </div>
  `;
}

/* ---------- startup ---------- */

async function boot() {
    if (!C.isLoggedIn()) {
        const here =
            (pg === 'index' ? 'index.html' : `pages/${pg}.html`) +
            location.search;
        location.replace(`${root}login.html?next=${encodeURIComponent(here)}`);
        return;
    }

    try {
        await C.init();
        await P[pg]();
        lucide.createIcons();
    } catch (err) {
        console.error('ComponentHub initialization failed:', err);
        showError(err);
    }
}

boot();
