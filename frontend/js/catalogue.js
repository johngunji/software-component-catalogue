/* ComponentHub data layer: REST API client and login session. */

const API_BASE =
  localStorage.getItem("componentHub.apiBase") ||
  (["localhost", "127.0.0.1"].includes(location.hostname)
    ? "http://localhost:3000/api"
    : "https://componenthub-backend.onrender.com/api");
const ROLES = ["User", "Cataloguer"];
const SESSION_KEY = "componentHub.session";

// Normalize role values returned by the API to the supported role names.
const normaliseRole = value =>
  ROLES.find(r => r.toLowerCase() === String(value ?? "").trim().toLowerCase()) || "User";

// Convert an API category record into the frontend category model.
const normaliseCategory = c => ({
  id: Number(c.id),
  name: c.name,
  parent: c.parentId == null ? null : Number(c.parentId),
  parentId: c.parentId == null ? null : Number(c.parentId),
  path: c.path || c.name,
  componentCount: Number(c.componentCount || 0)
});

// Convert an API artifact record into the frontend artifact model.
const normaliseArtifact = artifact => ({
  id: Number(artifact.id),
  componentId: Number(artifact.componentId),
  name: String(artifact.name || ""),
  description: String(artifact.description || ""),
  variantType: String(artifact.variantType || ""),
  deliveryMethod: String(artifact.deliveryMethod || ""),
  artifactFormat: String(artifact.artifactFormat || "").toLowerCase(),
  contentType: String(artifact.contentType || "text/plain"),
  content: artifact.content ?? "",
  binaryContent: artifact.binaryContent ?? null,
  downloadFilename: String(artifact.downloadFilename || artifact.name || "component-artifact"),
  reuseMethod: String(artifact.reuseMethod || ""),
  isPrimary: Boolean(artifact.isPrimary),
  sortOrder: Number(artifact.sortOrder || 0),
  createdAt: artifact.createdAt || ""
});

// Convert an API component record into the frontend component model.
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
  artifactFormat: c.artifactFormat || "",
  artifactContent: c.artifactContent || "",
  usageNotes: c.usageNotes || "",
  exampleContent: c.exampleContent || "",
  deliveryMethod: c.deliveryMethod || "",
  reuseMethod: c.reuseMethod || "",
  installCommand: c.installCommand || "",
  artifacts: Array.isArray(c.artifacts) ? c.artifacts.map(normaliseArtifact) : [],
  usage: {
    used: Number(c.usage?.used || 0),
    queriedNotUsed: Number(c.usage?.queriedNotUsed || 0)
  },
  addedOn: c.addedOn || ""
});

const Catalogue = {
  _d: { categories: [], components: [] },
  _ready: false,

  // Escape user-controlled text before inserting it into HTML.
  esc: s => String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
  // Return the language or notation used by a component.
  tech: c => (c.type === "Design" ? c.notation : c.language) || "",

  // Read a valid persisted login session from browser storage.
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

  // Check whether a JWT has passed its expiry timestamp.
  _tokenExpired(token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  },

  // Report whether the current browser session is authenticated.
  isLoggedIn() {
    const session = this._session();
    return !!session && !this._tokenExpired(session.token);
  },

  // Return the authenticated user with a normalized role.
  user() {
    const session = this._session();
    return session ? { ...session.user, role: normaliseRole(session.user.role) } : null;
  },

  // Return the current user's role for frontend access checks.
  role() {
    return this.user()?.role || "User";
  },

  // Authenticate a user and persist the returned session.
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

  // Clear authentication data and the in-memory catalogue cache.
  logout() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    this._ready = false;
    this._d = { categories: [], components: [] };
  },

  // Load catalogue data once before pages begin rendering.
  async init() {
    if (this._ready) return this._d;
    await this.refresh();
    this._ready = true;
    return this._d;
  },

  // Send an authenticated API request and normalize API failures.
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

  // Fetch the latest categories and components from the backend.
  async refresh() {
    const [categories, components] = await Promise.all([
      this.request("/categories"),
      this.request("/components")
    ]);
    this._d.categories = categories.map(normaliseCategory);
    this._d.components = components.map(normaliseComponent);
    return this._d;
  },

  // Merge refreshed component records into the local cache.
  _mergeComponents(rows) {
    for (const row of rows) {
      const component = normaliseComponent(row);
      const index = this._d.components.findIndex(c => c.id === component.id);
      index < 0
        ? this._d.components.push(component)
        : (this._d.components[index] = component);
    }
  },

  // Return the direct child categories of a category.
  childrenOf(parentId) {
    return this._d.categories.filter(c => c.parent === parentId);
  },

  // Return a category ID and all descendant category IDs.
  subtreeIds(id) {
    return [id, ...this.childrenOf(id).flatMap(c => this.subtreeIds(c.id))];
  },

  // Resolve a category or component category ID to its display path.
  categoryPath(id) {
    const category = this._d.categories.find(c => c.id === Number(id));
    if (category) return category.path;
    return this._d.components.find(c => c.categoryId === Number(id))?.categoryPath || "";
  },

  // Find a cached component by numeric ID.
  get(id) {
    return this._d.components.find(c => c.id === Number(id));
  },

  // Fetch one component and update the local cache.
  async getComponent(id) {
    const component = await this.request(`/components/${Number(id)}`);
    const normalized = normaliseComponent(component);
    if (normalized.artifacts.length === 0) {
      normalized.artifacts = await this.getArtifacts(id);
    }
    this._mergeComponents([normalized]);
    return normalized;
  },

  // Fetch reusable variants and artifacts for a component.
  async getArtifacts(id) {
    const data = await this.request(`/components/${Number(id)}/artifacts`);
    const rows = Array.isArray(data) ? data : (data.artifacts || []);
    return rows.map(normaliseArtifact).sort((a, b) => a.sortOrder - b.sortOrder);
  },

  // Download an artifact through the authenticated API and return its bytes.
  async downloadArtifact(componentId, artifactId) {
    const session = this._session();
    const response = await fetch(
      `${API_BASE}/components/${Number(componentId)}/artifacts/${Number(artifactId)}/download`,
      { headers: session ? { Authorization: `Bearer ${session.token}` } : {} }
    );
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `Download failed (${response.status})`);
    }
    return {
      blob: await response.blob(),
      filename: response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] || "component-artifact"
    };
  },

  // Download complete component package as a ZIP archive.
  async downloadZip(componentId, fallbackFilename = "package.zip") {
    const session = this._session();
    const response = await fetch(
      `${API_BASE}/components/${Number(componentId)}/zip`,
      { headers: session ? { Authorization: `Bearer ${session.token}` } : {} }
    );
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `ZIP package download failed (${response.status})`);
    }
    return {
      blob: await response.blob(),
      filename: response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] || fallbackFilename
    };
  },

  // Add a text artifact to a component as a cataloguer.
  async addArtifact(componentId, artifact) {
    const created = await this.request(`/components/${Number(componentId)}/artifacts`, {
      method: "POST",
      body: JSON.stringify({
        ...artifact,
        name: String(artifact.name || "").trim(),
        description: String(artifact.description || "").trim(),
        variantType: String(artifact.variantType || "").trim(),
        deliveryMethod: String(artifact.deliveryMethod || "").trim(),
        artifactFormat: String(artifact.artifactFormat || "").trim().toLowerCase(),
        contentType: String(artifact.contentType || "text/plain").trim(),
        content: artifact.content ?? "",
        downloadFilename: String(artifact.downloadFilename || "").trim(),
        reuseMethod: String(artifact.reuseMethod || "").trim(),
        isPrimary: Boolean(artifact.isPrimary),
        sortOrder: Number(artifact.sortOrder || 0)
      })
    });
    const normalized = normaliseArtifact(created);
    const cached = this.get(componentId);
    if (cached) {
      if (!Array.isArray(cached.artifacts)) cached.artifacts = [];
      const idx = cached.artifacts.findIndex(a => a.id === normalized.id);
      if (idx >= 0) cached.artifacts[idx] = normalized;
      else cached.artifacts.push(normalized);
      cached.artifacts.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    }
    return normalized;
  },

  // Update one reusable artifact as a cataloguer.
  async updateArtifact(componentId, artifactId, artifact) {
    const updated = await this.request(`/components/${Number(componentId)}/artifacts/${Number(artifactId)}`, {
      method: "PUT",
      body: JSON.stringify({
        ...artifact,
        name: String(artifact.name || "").trim(),
        description: String(artifact.description || "").trim(),
        variantType: String(artifact.variantType || "").trim(),
        deliveryMethod: String(artifact.deliveryMethod || "").trim(),
        artifactFormat: String(artifact.artifactFormat || "").trim().toLowerCase(),
        contentType: String(artifact.contentType || "text/plain").trim(),
        content: artifact.content ?? "",
        downloadFilename: String(artifact.downloadFilename || "").trim(),
        reuseMethod: String(artifact.reuseMethod || "").trim(),
        isPrimary: Boolean(artifact.isPrimary),
        sortOrder: Number(artifact.sortOrder || 0)
      })
    });
    const normalized = normaliseArtifact(updated);
    const cached = this.get(componentId);
    if (cached && Array.isArray(cached.artifacts)) {
      const idx = cached.artifacts.findIndex(a => a.id === normalized.id);
      if (idx >= 0) cached.artifacts[idx] = normalized;
      else cached.artifacts.push(normalized);
      cached.artifacts.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    }
    return normalized;
  },

  // Delete one reusable artifact as a cataloguer.
  async deleteArtifact(componentId, artifactId) {
    await this.request(`/components/${Number(componentId)}/artifacts/${Number(artifactId)}`, {
      method: "DELETE"
    });
    const cached = this.get(componentId);
    if (cached && Array.isArray(cached.artifacts)) {
      cached.artifacts = cached.artifacts.filter(a => a.id !== Number(artifactId));
    }
  },

  // Reorder artifacts of a component as a cataloguer.
  async reorderArtifacts(componentId, order) {
    const updated = await this.request(`/components/${Number(componentId)}/artifacts/reorder`, {
      method: "PUT",
      body: JSON.stringify({ order })
    });
    const normalized = Array.isArray(updated) ? updated.map(normaliseArtifact) : [];
    const cached = this.get(componentId);
    if (cached) {
      cached.artifacts = normalized;
    }
    return normalized;
  },

  // Copy text artifact content using the browser clipboard API.
  async copyArtifact(componentId, artifact) {
    if (artifact?.content == null || String(artifact.content).length === 0) {
      throw new Error("This artifact has no copyable text content.");
    }
    await navigator.clipboard.writeText(String(artifact.content));
    return true;
  },

  // List cached components, optionally limited to a category subtree.
  list({ categoryId = null } = {}) {
    if (categoryId == null) return [...this._d.components];
    const ids = this.subtreeIds(Number(categoryId));
    return this._d.components.filter(c => ids.includes(c.categoryId));
  },

  // Create a component through the catalogue API.
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
        url: c.url || "",
        artifactFormat: c.artifactFormat || "",
        artifactContent: c.artifactContent || "",
        usageNotes: c.usageNotes || "",
        exampleContent: c.exampleContent || ""
        ,deliveryMethod: c.deliveryMethod || ""
        ,reuseMethod: c.reuseMethod || ""
        ,installCommand: c.installCommand || ""
      })
    });
    this._mergeComponents([created]);
    return normaliseComponent(created);
  },

  // Update an existing component and refresh its cached record.
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
        url: c.url || "",
        artifactFormat: c.artifactFormat || "",
        artifactContent: c.artifactContent || "",
        usageNotes: c.usageNotes || "",
        exampleContent: c.exampleContent || ""
        ,deliveryMethod: c.deliveryMethod || ""
        ,reuseMethod: c.reuseMethod || ""
        ,installCommand: c.installCommand || ""
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

// Render a safe, format-aware preview for a reusable artifact.
function artifactPreviewHTML(artifact) {
  const format = String(artifact.artifactFormat || "").toLowerCase();
  const content = String(artifact.content || "");
  const escaped = Catalogue.esc(content);

  if (format === "svg") {
    return `<div class="artifact-preview artifact-preview-svg">${content}</div>`;
  }
  if (format === "png" && artifact.binaryContent) {
    return `<div class="artifact-preview"><img src="data:image/png;base64,${Catalogue.esc(artifact.binaryContent)}" alt="${Catalogue.esc(artifact.name)}" loading="lazy"></div>`;
  }
  if (["mermaid", "plantuml"].includes(format)) {
    return `<details class="artifact-source"><summary>View reusable source</summary><pre><code>${escaped}</code></pre></details>`;
  }
  if (["markdown", "text", "javascript", "python", "sql", "json", "yaml", "typescript", "txt"].includes(format)) {
    return `<details class="artifact-source" open><summary>Reusable source</summary><pre><code>${escaped}</code></pre></details>`;
  }
  return `<pre class="artifact-preview">${escaped}</pre>`;
}
