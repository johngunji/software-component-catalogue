/* ComponentHub frontend data layer connected to the REST API. */

const API_BASE =
  localStorage.getItem("componentHub.apiBase") ||
  "http://localhost:3000/api";

const ROLES = [
  "Student",
  "Cataloguer",
  "Manager"
];

const TOKEN_KEY = "componentHub.jwt";
const ROLE_KEY = "componentHub.role";

const DEMO_PASSWORD = "changeme123";
// Local demo only.
// Replace with a real login flow before production.


/* ---------- normalisers ---------- */

const normaliseRole = value => {
  const text = String(value ?? "").trim().toLowerCase();

  const role = ROLES.find(
    r => r.toLowerCase() === text
  );

  return role || "Student";
};


const normaliseCategory = c => ({
  id: Number(c.id),

  name: c.name,

  parent:
    c.parentId == null
      ? null
      : Number(c.parentId),

  parentId:
    c.parentId == null
      ? null
      : Number(c.parentId),

  path:
    c.path ||
    c.name,

  componentCount:
    Number(c.componentCount || 0)
});


const normaliseComponent = c => ({
  id: Number(c.id),

  name: c.name,

  description: c.description,

  categoryId:
    Number(c.categoryId),

  categoryPath:
    c.categoryPath || "",

  type:
    c.type,

  language:
    c.language ?? null,

  notation:
    c.notation ?? null,

  keywords:
    Array.isArray(c.keywords)
      ? c.keywords
      : [],

  url:
    c.url || "",

  usage: {
    used:
      Number(c.usage?.used || 0),

    queriedNotUsed:
      Number(
        c.usage?.queriedNotUsed || 0
      )
  },

  addedOn:
    c.addedOn || ""
});


/* ---------- catalogue ---------- */

const Catalogue = {

  _d: {
    categories: [],
    components: []
  },

  _token:
    sessionStorage.getItem(TOKEN_KEY) || "",

  _user: null,

  _ready: false,


  /* ---------- utility ---------- */

  esc: s =>
    String(s ?? "").replace(
      /[&<>"']/g,
      c =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        })[c]
    ),


  tech: c =>
    (
      c.type === "Design"
        ? c.notation
        : c.language
    ) || "",


  /* ---------- role ---------- */

  role() {

    const saved =
      localStorage.getItem(ROLE_KEY);

    return normaliseRole(saved);
  },


  setRole(r) {

    const canonical =
      normaliseRole(r);

    localStorage.setItem(
      ROLE_KEY,
      canonical
    );

    /*
     * Role changed, so discard the previous
     * JWT and authenticate again using the
     * new role.
     */

    sessionStorage.removeItem(
      TOKEN_KEY
    );

    this._token = "";
    this._user = null;
    this._ready = false;
  },


  /* ---------- startup ---------- */

  async init() {

    if (this._ready) {
      return this._d;
    }

    await this.loginAsCurrentRole();

    await this.refresh();

    this._ready = true;

    return this._d;
  },


  /* ---------- authentication ---------- */

  async loginAsCurrentRole() {

    const selectedRole =
      this.role();

    const username =
      selectedRole.toLowerCase();

    const response =
      await this.login(
        username,
        DEMO_PASSWORD
      );

    /*
     * IMPORTANT:
     *
     * Backend returns:
     *   "cataloguer"
     *
     * Frontend uses:
     *   "Cataloguer"
     *
     * Do NOT overwrite ROLE_KEY with
     * response.user.role directly.
     */

    if (response?.user?.role) {

      const backendRole =
        normaliseRole(
          response.user.role
        );

      /*
       * Keep the canonical frontend role.
       * This also protects against the backend
       * returning lowercase role names.
       */

      localStorage.setItem(
        ROLE_KEY,
        backendRole
      );

      this._user = {
        ...response.user,
        role: backendRole
      };
    }

    return response;
  },


  async login(username, password) {

    const res =
      await fetch(
        `${API_BASE}/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            username,
            password
          })
        }
      );

    const data =
      await res.json()
        .catch(() => ({}));


    if (!res.ok) {

      throw new Error(
        data.error ||
        `Login failed (${res.status})`
      );
    }


    this._token =
      data.token || "";

    this._user =
      data.user || null;


    sessionStorage.setItem(
      TOKEN_KEY,
      this._token
    );


    return data;
  },


  logout() {

    sessionStorage.removeItem(
      TOKEN_KEY
    );

    this._token = "";
    this._user = null;
    this._ready = false;
  },


  /* ---------- API request helper ---------- */

  async request(
    path,
    options = {},
    retry = true
  ) {

    const headers =
      new Headers(
        options.headers || {}
      );


    if (
      !headers.has("Content-Type") &&
      options.body
    ) {

      headers.set(
        "Content-Type",
        "application/json"
      );
    }


    if (this._token) {

      headers.set(
        "Authorization",
        `Bearer ${this._token}`
      );
    }


    const res =
      await fetch(
        `${API_BASE}${path}`,
        {
          ...options,
          headers
        }
      );


    const data =
      await res
        .json()
        .catch(() => null);


    /*
     * Token expired/invalid.
     * Re-login using the currently
     * selected frontend role.
     */

    if (
      res.status === 401 &&
      retry
    ) {

      await this.loginAsCurrentRole();

      return this.request(
        path,
        options,
        false
      );
    }


    if (!res.ok) {

      throw new Error(
        data?.error ||
        `Request failed (${res.status})`
      );
    }


    return data;
  },


  /* ---------- refresh data ---------- */

  async refresh() {

    const [
      categories,
      components
    ] = await Promise.all([

      this.request(
        "/categories"
      ),

      this.request(
        "/components"
      )

    ]);


    this._d.categories =
      categories.map(
        normaliseCategory
      );


    this._d.components =
      components.map(
        normaliseComponent
      );


    return this._d;
  },


  /* ---------- merge API results ---------- */

  _mergeComponents(rows) {

    for (const row of rows) {

      const c =
        normaliseComponent(row);


      const index =
        this._d.components.findIndex(
          x => x.id === c.id
        );


      if (index === -1) {

        this._d.components.push(c);

      } else {

        this._d.components[index] = c;
      }
    }
  },


  /* ---------- categories ---------- */

  childrenOf(parentId) {

    return this._d.categories.filter(
      c => c.parent === parentId
    );
  },


  subtreeIds(id) {

    return [
      id,
      ...this
        .childrenOf(id)
        .flatMap(c =>
          this.subtreeIds(c.id)
        )
    ];
  },


  categoryPath(id) {

    const local =
      this._d.categories.find(
        c => c.id === Number(id)
      );


    if (local) {

      return (
        local.path ||
        (
          local.parent != null
            ? `${this.categoryPath(local.parent)} › `
            : ""
        ) +
        local.name
      );
    }


    const component =
      this._d.components.find(
        c =>
          c.categoryId === Number(id)
      );


    return (
      component?.categoryPath ||
      ""
    );
  },


  /* ---------- component retrieval ---------- */

  get(id) {

    return this._d.components.find(
      c =>
        c.id === Number(id)
    );
  },


  list({
    categoryId = null
  } = {}) {

    if (
      categoryId == null
    ) {

      return [
        ...this._d.components
      ];
    }


    const ids =
      this.subtreeIds(
        Number(categoryId)
      );


    return this._d.components.filter(
      c =>
        ids.includes(
          c.categoryId
        )
    );
  },


  /* ---------- add component ---------- */

  async add(c) {

    const payload = {

      name:
        c.name,

      description:
        c.description,

      categoryId:
        Number(c.categoryId),

      type:
        c.type,

      language:
        c.type === "Code"
          ? (c.language || "")
          : null,

      notation:
        c.type === "Design"
          ? (c.notation || "")
          : null,

      keywords:
        c.keywords || [],

      url:
        c.url || ""
    };


    const created =
      await this.request(
        "/components",
        {
          method: "POST",

          body:
            JSON.stringify(payload)
        }
      );


    this._mergeComponents([
      created
    ]);


    return normaliseComponent(
      created
    );
  },


  /* ---------- delete component ---------- */

  async remove(id) {

    await this.request(
      `/components/${Number(id)}`,
      {
        method: "DELETE"
      }
    );


    this._d.components =
      this._d.components.filter(
        c =>
          c.id !== Number(id)
      );
  },


  /* ---------- update keywords ---------- */

  async setKeywords(
    id,
    keywords
  ) {

    const clean =
      keywords
        .map(s =>
          String(s).trim()
        )
        .filter(Boolean);


    const updated =
      await this.request(
        `/components/${Number(id)}/keywords`,
        {
          method: "PUT",

          body:
            JSON.stringify({
              keywords: clean
            })
        }
      );


    this._mergeComponents([
      updated
    ]);


    return normaliseComponent(
      updated
    );
  },


  /* ---------- search ---------- */

  async search(q) {

    const data =
      await this.request(
        `/search?q=${encodeURIComponent(q)}`
      );


    const results =
      data.results || [];


    this._mergeComponents(
      results
    );


    return results.map(
      normaliseComponent
    );
  },


  /* ---------- mark used ---------- */

  async markUsed(id) {

    const updated =
      await this.request(
        `/components/${Number(id)}/use`,
        {
          method: "POST"
        }
      );


    this._mergeComponents([
      updated
    ]);


    return normaliseComponent(
      updated
    );
  },


  /* ---------- manager purge ---------- */

  async purgeCandidates(
    threshold
  ) {

    const rows =
      await this.request(
        `/stats/purge-candidates?threshold=${encodeURIComponent(
          Number(threshold) || 15
        )}`
      );


    return rows.map(
      normaliseComponent
    );
  }

};