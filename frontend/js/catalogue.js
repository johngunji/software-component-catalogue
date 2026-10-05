/* ComponentHub data layer: REST API client and login session.

   Components are not cached in the browser. Every list is a server
   side page, so the catalogue can grow without slowing the pages
   down. Only the (small) category tree and the language / notation
   lists are loaded once per page view. */

const LOCAL_HOSTS = ['localhost', '127.0.0.1'];
const API_BASE =
    localStorage.getItem('componentHub.apiBase') ||
    (LOCAL_HOSTS.includes(location.hostname)
        ? 'http://localhost:3000/api'
        : 'https://componenthub-backend.onrender.com/api');

/* Roles from the problem statement. */
const ROLES = ['User', 'Cataloguer'];
const SESSION_KEY = 'componentHub.session';

const normaliseRole = (value) =>
    ROLES.find(
        (r) =>
            r.toLowerCase() ===
            String(value ?? '')
                .trim()
                .toLowerCase(),
    ) || 'User';

const normaliseCategory = (c) => ({
    id: Number(c.id),
    name: c.name,
    parent: c.parentId == null ? null : Number(c.parentId),
    parentId: c.parentId == null ? null : Number(c.parentId),
    path: c.path || c.name,
    componentCount: Number(c.componentCount || 0),
});

const normaliseComponent = (c) => ({
    id: Number(c.id),
    name: c.name,
    description: c.description,
    categoryId: Number(c.categoryId),
    categoryPath: c.categoryPath || '',
    type: c.type,
    language: c.language ?? null,
    notation: c.notation ?? null,
    keywords: Array.isArray(c.keywords) ? c.keywords : [],
    url: c.url || '',
    usage: {
        used: Number(c.usage?.used || 0),
        queriedNotUsed: Number(c.usage?.queriedNotUsed || 0),
        notUsedRatio: c.usage?.notUsedRatio ?? null,
    },
    addedOn: c.addedOn || '',
    ageDays: Number(c.ageDays || 0),
});

const normalisePage = (data, key = 'items') => ({
    items: (data[key] || []).map(normaliseComponent),
    total: Number(data.total || 0),
    page: Number(data.page || 1),
    pages: Number(data.pages || 0),
    pageSize: Number(data.pageSize || 0),
});

const queryString = (params) =>
    Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');

const Catalogue = {
    _d: {categories: [], languages: [], notations: []},
    _ready: false,

    esc: (s) =>
        String(s ?? '').replace(
            /[&<>"']/g,
            (c) =>
                ({
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#39;',
                })[c],
        ),
    tech: (c) => (c.type === 'Design' ? c.notation : c.language) || '',

    /* ---------- session ---------- */

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
            const payload = JSON.parse(
                atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
            );
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
        return session
            ? {...session.user, role: normaliseRole(session.user.role)}
            : null;
    },

    role() {
        return this.user()?.role || 'User';
    },

    isCataloguer() {
        return this.role() === 'Cataloguer';
    },

    async login(username, password, remember = false) {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password}),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok)
            throw new Error(
                data.error || `Sign-in failed (${response.status})`,
            );
        this.logout();
        (remember ? localStorage : sessionStorage).setItem(
            SESSION_KEY,
            JSON.stringify({token: data.token, user: data.user}),
        );
        return this.user();
    },

    logout() {
        sessionStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_KEY);
        this._ready = false;
        this._d = {categories: [], languages: [], notations: []};
    },

    /* ---------- HTTP ---------- */

    async request(path, options = {}, retry = true) {
        const headers = new Headers(options.headers || {});
        if (options.body && !headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }
        const session = this._session();
        if (session) headers.set('Authorization', `Bearer ${session.token}`);

        const response = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers,
        });
        const data = await response.json().catch(() => null);
        if (response.status === 401 && retry) {
            this.logout();
            location.replace(`${document.body?.dataset.root || ''}login.html`);
            throw new Error('Your session has expired. Please sign in again.');
        }
        if (!response.ok) {
            const error = new Error(
                data?.error || `Request failed (${response.status})`,
            );
            error.status = response.status;
            throw error;
        }
        return data;
    },

    /* ---------- categories and vocabularies ---------- */

    async init() {
        if (this._ready) return this._d;
        const [categories, meta] = await Promise.all([
            this.request('/categories'),
            this.request('/meta'),
        ]);
        this._d.categories = categories.map(normaliseCategory);
        this._d.languages = meta.languages || [];
        this._d.notations = meta.notations || [];
        this._ready = true;
        return this._d;
    },

    async refreshCategories() {
        const categories = await this.request('/categories');
        this._d.categories = categories.map(normaliseCategory);
        return this._d.categories;
    },

    techList(type) {
        return type === 'Design' ? this._d.notations : this._d.languages;
    },

    category(id) {
        return this._d.categories.find((c) => c.id === Number(id));
    },

    childrenOf(parentId) {
        return this._d.categories
            .filter((c) => c.parent === parentId)
            .sort((a, b) => a.name.localeCompare(b.name));
    },

    subtreeIds(id) {
        return [
            id,
            ...this.childrenOf(id).flatMap((c) => this.subtreeIds(c.id)),
        ];
    },

    categoryPath(id) {
        return this.category(id)?.path || '';
    },

    async addCategory(name, parentId) {
        await this.request('/categories', {
            method: 'POST',
            body: JSON.stringify({name, parentId: parentId ?? null}),
        });
        return this.refreshCategories();
    },

    async updateCategory(id, changes) {
        await this.request(`/categories/${Number(id)}`, {
            method: 'PUT',
            body: JSON.stringify(changes),
        });
        return this.refreshCategories();
    },

    async removeCategory(id) {
        await this.request(`/categories/${Number(id)}`, {method: 'DELETE'});
        return this.refreshCategories();
    },

    /* ---------- components ---------- */

    async listComponents(params = {}) {
        return normalisePage(
            await this.request(`/components?${queryString(params)}`),
        );
    },

    async getComponent(id) {
        return normaliseComponent(
            await this.request(`/components/${Number(id)}`),
        );
    },

    _payload(c) {
        return JSON.stringify({
            name: c.name,
            description: c.description,
            categoryId: Number(c.categoryId),
            type: c.type,
            tech: c.tech || '',
            keywords: c.keywords || [],
            url: c.url || '',
        });
    },

    async add(c) {
        return normaliseComponent(
            await this.request('/components', {
                method: 'POST',
                body: this._payload(c),
            }),
        );
    },

    async updateComponent(id, c) {
        return normaliseComponent(
            await this.request(`/components/${Number(id)}`, {
                method: 'PUT',
                body: this._payload(c),
            }),
        );
    },

    async remove(id) {
        await this.request(`/components/${Number(id)}`, {method: 'DELETE'});
    },

    async setKeywords(id, keywords) {
        return normaliseComponent(
            await this.request(`/components/${Number(id)}/keywords`, {
                method: 'PUT',
                body: JSON.stringify({
                    keywords: keywords
                        .map((s) => String(s).trim())
                        .filter(Boolean),
                }),
            }),
        );
    },

    /* ---------- search and usage ---------- */

    /* Searching is recorded on the server: every component returned
     counts as "came up in a query" until it is used. */
    async search(params) {
        const data = await this.request(`/search?${queryString(params)}`);
        return {
            ...normalisePage(data, 'results'),
            queryId: data.queryId,
            query: data.query,
        };
    },

    /* queryId links the use to the search it came from. */
    async markUsed(id, queryId) {
        const data = await this.request(`/components/${Number(id)}/use`, {
            method: 'POST',
            body: JSON.stringify({queryId: queryId ? Number(queryId) : null}),
        });
        return {
            component: normaliseComponent(data.component),
            counted: data.counted,
        };
    },

    /* ---------- statistics and reports ---------- */

    async stats() {
        const data = await this.request('/stats');
        return {
            ...data,
            mostUsed: data.mostUsed.map(normaliseComponent),
            mostShownNotUsed: data.mostShownNotUsed.map(normaliseComponent),
            recent: data.recent.map(normaliseComponent),
        };
    },

    queryStats() {
        return this.request('/stats/queries');
    },

    async purgeCandidates(criteria) {
        const data = await this.request(
            `/stats/purge-candidates?${queryString(criteria)}`,
        );
        return {...data, items: data.items.map(normaliseComponent)};
    },

    purgeComponents(ids) {
        return this.request('/components/purge', {
            method: 'POST',
            body: JSON.stringify({ids}),
        });
    },
};
