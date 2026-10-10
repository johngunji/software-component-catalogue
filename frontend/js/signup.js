/* Account creation and email verification page. */
const $ = (selector) => document.querySelector(selector);
// Return icon markup for the account creation page.
const icon = (name) => `<i data-lucide="${name}"></i>`;
// Render all Lucide icon placeholders on the page.
const renderIcons = () => window.lucide && lucide.createIcons();
const apiBase =
  localStorage.getItem("componentHub.apiBase") ||
  (["localhost", "127.0.0.1"].includes(location.hostname)
    ? "http://localhost:3000/api"
    : "https://componenthub-backend.onrender.com/api");

document.body.innerHTML = `
  <div class="auth">
    <aside class="auth-side">
      <a class="brand" href="index.html"><span class="logo">${icon("box")}</span><span><b>ComponentHub</b><small>Software Component Catalogue</small></span></a>
      <div>
        <h1>Create your <em>ComponentHub</em> account.</h1>
        <ul>
          <li>${icon("search")}<span><b>Discover components</b><br>Search and browse reusable software components.</span></li>
          <li>${icon("folder-tree")}<span><b>Browse categories</b><br>Explore components through the catalogue hierarchy.</span></li>
          <li>${icon("repeat")}<span><b>Reuse software</b><br>Find components that can save development effort.</span></li>
        </ul>
      </div>
      <small>© 2026 ComponentHub · Software Engineering project</small>
    </aside>
    <main class="auth-main">
      <form class="card pad form auth-card" id="signupForm" novalidate>
        <div class="auth-logo"><span class="logo">${icon("box")}</span><b>ComponentHub</b></div>
        <div><h2 class="auth-title">Create account</h2><p class="muted">Verify your email to create a ComponentHub account.</p></div>
        <p class="bad" id="signupError" role="alert" hidden></p>
        <p class="ok" id="signupSuccess" hidden></p>
        <div id="detailsStep">
          <label>Username<input id="username" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="e.g. johngunji05" required></label>
          <label>Email<input id="email" type="email" autocomplete="email" placeholder="you@example.com" required></label>
          <label>Password<span class="pw"><input id="password" type="password" autocomplete="new-password" required><button type="button" id="passwordEye" aria-label="Show password">${icon("eye")}</button></span></label>
          <label>Confirm password<span class="pw"><input id="confirmPassword" type="password" autocomplete="new-password" required><button type="button" id="confirmEye" aria-label="Show password">${icon("eye")}</button></span></label>
          <button class="btn block" id="sendOtpButton" type="submit">Send OTP</button>
        </div>
        <div id="otpStep" hidden>
          <p class="muted">We sent a 6-digit code to <b id="otpEmail"></b>.</p>
          <label>Verification code<input id="otp" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required></label>
          <button class="btn block" id="verifyButton" type="button">Verify &amp; Create Account</button>
          <button class="btn ghost block" id="resendButton" type="button">Resend OTP</button>
        </div>
        <p class="muted" style="text-align:center">Already have an account? <a href="login.html">Sign in</a></p>
      </form>
    </main>
  </div>`;
renderIcons();

// Toggle visibility for a password input and update its accessible label.
const togglePassword = (inputId, buttonId) => {
  const input = $(`#${inputId}`);
  const button = $(`#${buttonId}`);
  button.onclick = () => {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    button.setAttribute("aria-label", show ? "Hide password" : "Show password");
    button.innerHTML = icon(show ? "eye-off" : "eye");
    renderIcons();
  };
};

togglePassword("password", "passwordEye");
togglePassword("confirmPassword", "confirmEye");

// Display a validation or API error beside the signup form.
const showError = (message) => {
  $("#signupSuccess").hidden = true;
  $("#signupError").textContent = message;
  $("#signupError").hidden = false;
};

// Send a JSON request to the account API and surface failures.
const api = async (path, body) => {
  const response = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
};

$("#signupForm").onsubmit = async (event) => {
  event.preventDefault();
  const username = $("#username").value.trim();
  const email = $("#email").value.trim();
  const password = $("#password").value;
  const confirmPassword = $("#confirmPassword").value;
  if (!username || !email || !password || !confirmPassword) return showError("Please fill in all fields.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showError("Enter a valid email address.");
  if (password.length < 8) return showError("Password must be at least 8 characters.");
  if (password !== confirmPassword) return showError("Passwords do not match.");

  const button = $("#sendOtpButton");
  button.disabled = true;
  button.textContent = "Sending OTP…";
  try {
    const data = await api("/auth/signup", { username, email, password, confirmPassword });
    window.signupToken = data.signupToken;
    $("#detailsStep").hidden = true;
    $("#otpStep").hidden = false;
    $("#otpEmail").textContent = data.email;
    $("#signupSuccess").textContent = "Verification code sent. Check your email.";
    $("#signupSuccess").hidden = false;
    $("#otp").focus();
  } catch (error) {
    showError(error instanceof TypeError ? "Cannot reach the server. Please try again." : error.message);
    button.disabled = false;
    button.textContent = "Send OTP";
  }
};

$("#verifyButton").onclick = async () => {
  const otp = $("#otp").value.trim();
  if (!/^\d{6}$/.test(otp)) return showError("Enter the 6-digit verification code.");
  const button = $("#verifyButton");
  button.disabled = true;
  button.textContent = "Creating account…";
  try {
    await api("/auth/signup/verify", { signupToken: window.signupToken, otp });
    $("#signupSuccess").textContent = "Account created successfully. Redirecting to login…";
    $("#signupSuccess").hidden = false;
    setTimeout(() => location.replace("login.html"), 1200);
  } catch (error) {
    showError(error instanceof TypeError ? "Cannot reach the server. Please try again." : error.message);
    button.disabled = false;
    button.textContent = "Verify & Create Account";
  }
};

$("#resendButton").onclick = async () => {
  const button = $("#resendButton");
  button.disabled = true;
  try {
    const data = await api("/auth/signup/resend", { signupToken: window.signupToken });
    $("#otpEmail").textContent = data.email;
    $("#signupSuccess").textContent = "A new verification code was sent.";
    $("#signupSuccess").hidden = false;
  } catch (error) {
    showError(error instanceof TypeError ? "Cannot reach the server. Please try again." : error.message);
  } finally {
    button.disabled = false;
  }
};
