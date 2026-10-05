/* ComponentHub data layer: REST API client and login session. */

const API_BASE =
  localStorage.getItem("componentHub.apiBase") ||
  "https://componenthub-backend.onrender.com/api";
const ROLES = ["Student", "Cataloguer", "Manager"];
const SESSION_KEY = "componentHub.session";

const normaliseRole = value =>
  ROLES.find(r => r.toLowerCase() === String(value ?? "").trim().toLowerCase()) || "Student";

const normaliseCategory = c => ({
  id: Number(c.id),
  name: c.name,
  parent: c.parentId == null ? null : Number(c.parentId),
  parentId: c.parentId == null ? null : Number(c.parentId),
  path: c.path || c.name,
  componentCount: Number(c.componentCount || 0)
});

const normaliseComponent = c => ({
  id: Number(c.id),
  name: c.name,
  description: c.description,
  categoryId: Number(c.categoryId),
  categoryPath: c.categoryPath || "",
  type: c.type,
  language: c.language ?? null,
  notation: c.notation ?? null,
  keywords: Array.isArray(c.keywords) ? c.keywords : [],
  url: c.url || "",
  usage: {
    used: Number(c.usage?.used || 0),
    queriedNotUsed: Number(c.usage?.queriedNotUsed || 0)
  },
  addedOn: c.addedOn || ""
});

const Catalogue = {
  _d: { categories: [], components: [] },
  _ready: false,

  esc: s => String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
  tech: c => (c.type === "Design" ? c.notation : c.language) || "",

  _session() {
    for (const storage of [sessionStorage, localStorage]) {
      try {
        const value = JSON.parse(storage.getItem(SESSION_KEY));
        if (value?.token && value?.user) return value;
      } catch {
        // Ignore malformed persisted sessions.
      }
    }
    return null;
  },

  _tokenExpired(token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  },

  isLoggedIn() {
    const session = this._session();
    return !!session && !this._tokenExpired(session.token);
  },

  user() {
    const session = this._session();
    return session ? { ...session.user, role: normaliseRole(session.user.role) } : null;
  },

  role() {
    return this.user()?.role || "Student";
  },

  async login(username, password, remember = false) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Sign-in failed (${response.status})`);
    this.logout();
    (remember ? localStorage : sessionStorage).setItem(
      SESSION_KEY,
      JSON.stringify({ token: data.token, user: data.user })
    );
    return this.user();
  },

  logout() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    this._ready = false;
    this._d = { categories: [], components: [] };
  },

  async init() {
    if (this._ready) return this._d;
    await this.refresh();
    this._ready = true;
    return this._d;
  },

  async request(path, options = {}, retry = true) {
    const headers = new Headers(options.headers || {});
    if (options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const session = this._session();
    if (session) headers.set("Authorization", `Bearer ${session.token}`);

    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await response.json().catch(() => null);
    if (response.status === 401 && retry) {
      this.logout();
      location.replace(`${document.body?.dataset.root || ""}login.html`);
      throw new Error("Your session has expired. Please sign in again.");
    }
    if (!response.ok) {
      const error = new Error(data?.error || `Request failed (${response.status})`);
      error.status = response.status;
      throw error;
    }
    return data;
  },

  async refresh() {
    const [categories, components] = await Promise.all([
      this.request("/categories"),
      this.request("/components")
    ]);
    this._d.categories = categories.map(normaliseCategory);
    this._d.components = components.map(normaliseComponent);
    return this._d;
  },

  _mergeComponents(rows) {
    for (const row of rows) {
      const component = normaliseComponent(row);
      const index = this._d.components.findIndex(c => c.id === component.id);
      index < 0
        ? this._d.components.push(component)
        : (this._d.components[index] = component);
    }
  },

  childrenOf(parentId) {
    return this._d.categories.filter(c => c.parent === parentId);
  },

  subtreeIds(id) {
    return [id, ...this.childrenOf(id).flatMap(c => this.subtreeIds(c.id))];
  },

  categoryPath(id) {
    const category = this._d.categories.find(c => c.id === Number(id));
    if (category) return category.path;
    return this._d.components.find(c => c.categoryId === Number(id))?.categoryPath || "";
  },

  get(id) {
    return this._d.components.find(c => c.id === Number(id));
  },

  async getComponent(id) {
    const component = await this.request(`/components/${Number(id)}`);
    this._mergeComponents([component]);
    return normaliseComponent(component);
  },

  list({ categoryId = null } = {}) {
    if (categoryId == null) return [...this._d.components];
    const ids = this.subtreeIds(Number(categoryId));
    return this._d.components.filter(c => ids.includes(c.categoryId));
  },

  async add(c) {
    const created = await this.request("/components", {
      method: "POST",
      body: JSON.stringify({
        name: c.name,
        description: c.description,
        categoryId: Number(c.categoryId),
        type: c.type,
        language: c.type === "Code" ? (c.language || "") : null,
        notation: c.type === "Design" ? (c.notation || "") : null,
        keywords: c.keywords || [],
        url: c.url || ""
      })
    });
    this._mergeComponents([created]);
    return normaliseComponent(created);
  },

  async updateComponent(id, c) {
    const updated = await this.request(`/components/${Number(id)}`, {
      method: "PUT",
      body: JSON.stringify({
        name: c.name,
        description: c.description,
        categoryId: Number(c.categoryId),
        type: c.type,
        tech: c.tech || "",
        keywords: c.keywords || [],
        url: c.url || ""
      })
    });
    this._mergeComponents([updated]);
    return normaliseComponent(updated);
  },

  async remove(id) {
    await this.request(`/components/${Number(id)}`, { method: "DELETE" });
    this._d.components = this._d.components.filter(c => c.id !== Number(id));
  },

  async setKeywords(id, keywords) {
    const updated = await this.request(`/components/${Number(id)}/keywords`, {
      method: "PUT",
      body: JSON.stringify({ keywords: keywords.map(s => String(s).trim()).filter(Boolean) })
    });
    this._mergeComponents([updated]);
    return normaliseComponent(updated);
  },

  async search(q) {
    const data = await this.request(`/search?q=${encodeURIComponent(q)}`);
    const results = data.results || [];
    this._mergeComponents(results);
    return results.map(normaliseComponent);
  },

  async markUsed(id) {
    const updated = await this.request(`/components/${Number(id)}/use`, { method: "POST" });
    this._mergeComponents([updated]);
    return normaliseComponent(updated);
  },

  async purgeCandidates(threshold) {
    const rows = await this.request(
      `/stats/purge-candidates?threshold=${encodeURIComponent(Number(threshold) || 15)}`
    );
    return rows.map(normaliseComponent);
  }
};
