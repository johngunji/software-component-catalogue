/* Sign-in page. */
const $ = (selector) => document.querySelector(selector);
const icon = (name) => `<i data-lucide="${name}"></i>`;
const renderIcons = () => window.lucide && lucide.createIcons();
const safeNext = (value) =>
    /^(index\.html|pages\/[a-z-]+\.html)(\?[\w=&%.\-]*)?$/.test(value || '')
        ? value
        : 'index.html';
const next = safeNext(new URLSearchParams(location.search).get('next'));

if (Catalogue.isLoggedIn()) {
    location.replace(next);
} else {
    document.body.innerHTML = `
    <div class="auth">
      <aside class="auth-side">
        <a class="brand" href="login.html"><span class="logo">${icon('box')}</span><span><b>ComponentHub</b><small>Software Component Catalogue</small></span></a>
        <div>
          <h1>Find reusable components.<br><em>Build software faster.</em></h1>
          <ul>
            <li>${icon('search')}<span><b>Search by keyword</b><br>Find code and design components in seconds.</span></li>
            <li>${icon('folder-tree')}<span><b>Browse by category</b><br>A hierarchy that keeps hundreds of components organised.</span></li>
            <li>${icon('bar-chart-3')}<span><b>See what gets reused</b><br>Usage tracking shows which components earn their place.</span></li>
          </ul>
        </div>
        <small>© 2026 ComponentHub · Software Engineering project</small>
      </aside>
      <main class="auth-main">
        <form class="card pad form auth-card" id="lf" novalidate>
          <div class="auth-logo"><span class="logo">${icon('box')}</span><b>ComponentHub</b></div>
          <div><h2 class="auth-title">Sign in</h2><p class="muted">Use the account issued to you by the catalogue administrator.</p></div>
          <p class="bad" id="err" role="alert" hidden></p>
          <label>Username<input id="u" autocomplete="username" autocapitalize="none" spellcheck="false" autofocus></label>
          <label>Password<span class="pw"><input id="p" type="password" autocomplete="current-password"><button type="button" id="eye" aria-label="Show password">${icon('eye')}</button></span></label>
          <label class="chk"><input type="checkbox" id="rem"> Keep me signed in on this device</label>
          <button class="btn block" id="go">Sign in</button>
          <p class="muted" id="wake" hidden>The server is waking up. This can take up to a minute the first time…</p>
        </form>
      </main>
    </div>`;
    renderIcons();

    $('#eye').onclick = () => {
        const input = $('#p');
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        $('#eye').setAttribute(
            'aria-label',
            show ? 'Hide password' : 'Show password',
        );
        $('#eye').innerHTML = icon(show ? 'eye-off' : 'eye');
        renderIcons();
    };

    $('#lf').onsubmit = async (event) => {
        event.preventDefault();
        const username = $('#u').value.trim();
        const password = $('#p').value;
        const error = $('#err');
        const submit = $('#go');
        error.hidden = true;
        if (!username || !password) {
            error.textContent = 'Enter both username and password.';
            error.hidden = false;
            return;
        }
        submit.disabled = true;
        submit.textContent = 'Signing in…';
        const wakeTimer = setTimeout(() => ($('#wake').hidden = false), 3000);
        try {
            await Catalogue.login(username, password, $('#rem').checked);
            location.replace(next);
        } catch (err) {
            error.textContent =
                err instanceof TypeError
                    ? 'Cannot reach the server. Please try again in a moment.'
                    : err.message;
            error.hidden = false;
            submit.disabled = false;
            submit.textContent = 'Sign in';
            $('#p').value = '';
            $('#p').focus();
        } finally {
            clearTimeout(wakeTimer);
            $('#wake').hidden = true;
        }
    };
}
